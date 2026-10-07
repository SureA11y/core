'use strict';

/**
 * Colors set with custom properties, in a real browser. Chromium hands
 * the contrast rules computed colors with var() already substituted, so
 * they are measured as any other color, and the parser never needs its
 * probe for them (#125): the scan adds nothing to the document.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

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

const RULES = ['contrast-computable', 'contrast-minimum', 'contrast-enhanced'];

test('colors set with custom properties are measured, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(css) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title>' +
          `<style>:root{--bg:#fff;--faint:#bbb;--dark:#222}${css}</style></head>` +
          '<body><main><p>Some text</p><section><p class="in">Nested text</p></section></main></body></html>'
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate((ids) => {
        const observer = new MutationObserver(() => {});
        observer.observe(document, { childList: true, subtree: true });
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ids);
        const out = { mutations: observer.takeRecords().length };
        for (const c of r.checksResults) out[c.ruleId] = c.outcome;
        return out;
      }, RULES);
    } finally {
      await p.close();
    }
  }

  await t.test('faint text in a custom property fails', async () => {
    const r = await scan('main{background-color:var(--bg)}p{color:var(--faint)}');
    assert.equal(r['contrast-minimum'], 'fail');
    assert.equal(r.mutations, 0);
  });

  await t.test('dark text in a custom property passes', async () => {
    const r = await scan('main{background-color:var(--bg)}p{color:var(--dark)}');
    assert.equal(r['contrast-minimum'], 'pass');
    assert.equal(r['contrast-enhanced'], 'pass');
    assert.equal(r.mutations, 0);
  });

  await t.test('a property set closer to the text wins, with a fallback', async () => {
    const r = await scan(
      'main{background-color:var(--bg)}section{--dark:#ccc}p{color:var(--dark)}' +
        '.in{color:var(--missing, var(--dark))}'
    );
    assert.equal(r['contrast-minimum'], 'fail');
    assert.equal(r.mutations, 0);
  });
});
