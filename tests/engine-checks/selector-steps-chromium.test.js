'use strict';

// An occurrence's selector is checked step by step, at constant cost, and
// counts :nth-of-type among siblings of one type as CSS does (the same local
// name in the same namespace). Each selector must still name exactly its
// element, in a real browser's selector engine.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

// Reports every element inside #box; data-k says which one it was.
const REPORT_ALL = `(ctx) => {
  const box = ctx.document.getElementById('box');
  const occurrences = [...box.querySelectorAll('*')].map((el) => ({
    __node: el,
    summary: el.getAttribute('data-k') || ''
  }));
  return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences };
}`;

test('every selector names exactly its element, in Chromium', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id="box">${'<img src="x.png"><span></span>'.repeat(300)}<svg><foreignObject><p></p><p></p></foreignObject><g></g><g></g></svg></div></main></body></html>`
    );
    await page.evaluate(() => {
      const box = document.getElementById('box');
      // An HTML <a> and an SVG <a> side by side: not of one type for CSS.
      for (const ns of [null, 'http://www.w3.org/2000/svg', null, 'http://www.w3.org/2000/svg']) {
        box.appendChild(ns ? document.createElementNS(ns, 'a') : document.createElement('a'));
      }
      let k = 0;
      for (const el of box.querySelectorAll('*')) el.setAttribute('data-k', String(k++));
    });
    await page.addScriptTag({ content: BUNDLE });
    const wrong = await page.evaluate((src) => {
      const r = window.a11ycore.runa11yCoreInPage(
        null,
        null,
        {
          customRules: [{ id: 'acme-all', meta: { tags: ['best-practice'] }, runInPage: src }]
        },
        ['acme-all']
      );
      const occ = r.checksResults[0].occurrences;
      const el = (o) => document.querySelector(`[data-k="${o.summary}"]`);
      // No type selector tells an HTML <a> from an SVG <a>, so theirs can
      // only be checked to match them; those are verified whole, as before.
      const mixed = (o) => el(o).localName === 'a';
      const bad = occ.filter((o) => {
        if (mixed(o)) return !el(o).matches(o.selector);
        const found = document.querySelectorAll(o.selector);
        return found.length !== 1 || found[0] !== el(o);
      });
      return [
        occ.length,
        document.querySelectorAll('#box *').length,
        bad.map((o) => o.selector),
        occ.filter(mixed).length
      ];
    }, REPORT_ALL);
    assert.equal(wrong[0], wrong[1], 'one occurrence per element');
    assert.deepEqual(wrong[2], []);
    assert.equal(wrong[3], 4);
  } finally {
    await browser.close();
  }
});
