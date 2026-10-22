'use strict';

/**
 * inert-content.test.js in a real browser (#226): each failing or flagged
 * example of docs/RULE_EXAMPLES.md with its body inside <div inert> reports
 * nothing, except by the rules left alone on purpose, and a modal dialog
 * opened with showModal() leaves the page behind it out the same way.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { readExamples, toPage } = require('../../src/rule-docs.js');
const { JUDGED_WHEN_INERT, inertPage } = require('../helpers/inertContent.js');

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

const { addBundle } = require('../helpers/browserBundle');

const examples = readExamples(path.join(__dirname, '../../docs/RULE_EXAMPLES.md')).filter(
  (e) => (e.expected === 'fail' || e.expected === 'cantTell') && !JUDGED_WHEN_INERT[e.ruleId]
);

test('inert content in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  async function outcome(html, ruleId, before = null) {
    const page = await context.newPage();
    try {
      await page.setContent(html);
      if (before) await page.evaluate(before);
      await addBundle(page);
      return await page.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]);
        const c = r.checksResults.find((x) => x.ruleId === id);
        return { outcome: c.outcome };
      }, ruleId);
    } finally {
      await page.close();
    }
  }

  await t.test(
    'no rule reports what is inside an inert subtree, but the ones left alone',
    async () => {
      const judged = [];
      for (const ex of examples) {
        const { outcome: got } = await outcome(inertPage(toPage(ex.html)), ex.ruleId);
        if (got !== 'notApplicable' && got !== 'pass')
          judged.push(`${ex.ruleId} (${ex.label}): ${got}`);
      }
      assert.deepEqual(judged, []);
    }
  );

  const page = (attr) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div ${attr}><img src="a.png"></div></main></body></html>`;

  await t.test('img-alt-decorative asks about an aria-hidden image, not an inert one', async () => {
    assert.equal(
      (await outcome(page('aria-hidden="true"'), 'img-alt-decorative')).outcome,
      'cantTell'
    );
    assert.equal((await outcome(page('inert'), 'img-alt-decorative')).outcome, 'notApplicable');
    assert.equal((await outcome(page('inert'), 'img-alt-present')).outcome, 'notApplicable');
  });

  await t.test('behind a modal opened with showModal(), as under inert', async () => {
    const html =
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="">' +
      '<p style="line-height:1.2 !important">The toy brought back fond memories of being lost in the rain forest.</p></main>' +
      '<dialog id="d" aria-label="Sign in"><button>Close</button></dialog></body></html>';
    const open = () => document.getElementById('d').showModal();
    assert.equal((await outcome(html, 'img-alt-decorative')).outcome, 'cantTell');
    assert.equal((await outcome(html, 'img-alt-decorative', open)).outcome, 'notApplicable');
    // Drawn, so judged when inert, but not behind the modal.
    const inert = html.replace('<main>', '<main inert>');
    assert.equal((await outcome(inert, 'avoid-inline-spacing')).outcome, 'fail');
    assert.equal((await outcome(inert, 'avoid-inline-spacing', open)).outcome, 'notApplicable');
  });
});
