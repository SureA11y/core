'use strict';

/**
 * media-transcript-adjacent in a real browser. Chromium's own stylesheet
 * hides `audio:not([controls])` with `display: none`, which jsdom does not,
 * so an <audio autoplay> without controls looks hidden only in a real
 * browser. The rule must still ask about it there, and follow the author's
 * own hiding as in jsdom. This test runs the browser bundle in Chromium and
 * checks the outcomes against the same scan in jsdom.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

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

const RULE_ID = 'media-transcript-adjacent';
const BUNDLE = fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8');
const FIXTURE = path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`);
const RULES = { include: RULE_ID };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

// Outcome and occurrence count, which is what must agree between the two
// environments.
function summarize(result) {
  const r = result.checksResults.find((x) => x.ruleId === RULE_ID);
  return r ? { outcome: r.outcome, occurrences: (r.occurrences || []).length } : null;
}

const jsdomSummary = (html) =>
  summarize(runa11yCoreOnHtml(html, { engineOptions: { optInRules: 'rgaa', rules: RULES } }));

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function chromiumSummary(html) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (rules) =>
          window.a11ycore.runa11yCoreInPage(null, null, { optInRules: 'rgaa', rules }, null),
        RULES
      );
      return summarize(result);
    } finally {
      await p.close();
    }
  }

  await t.test('<audio autoplay loop> without controls is still asked about', async () => {
    const html = page('<audio autoplay loop src="m.mp3"></audio>');
    const got = await chromiumSummary(html);
    assert.deepEqual(got, { outcome: 'cantTell', occurrences: 1 });
    assert.deepEqual(got, jsdomSummary(html));
  });

  await t.test("audio in an author-hidden container follows the author's hiding", async () => {
    const html = page('<div style="display:none"><audio autoplay loop src="m.mp3"></audio></div>');
    const got = await chromiumSummary(html);
    assert.equal(got.outcome, 'notApplicable');
    assert.deepEqual(got, jsdomSummary(html));
  });

  await t.test(`${path.basename(FIXTURE)}: Chromium agrees with jsdom`, async () => {
    const html = fs.readFileSync(FIXTURE, 'utf8');
    assert.deepEqual(await chromiumSummary(html), jsdomSummary(html));
  });
});
