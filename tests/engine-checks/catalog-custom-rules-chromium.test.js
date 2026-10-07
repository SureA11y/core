'use strict';

/**
 * The catalog against a scan in a real browser (#141). With
 * engineOptions.customRules, getChecksForRunOnly in Node lists exactly the
 * rules the same options run in Chromium, custom rules and an override
 * included.
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
const { getChecksForRunOnly } = require('../../src/index.js');

const rule = (id, tags) => ({
  id,
  meta: { title: id, description: id, tags, wcagSc: [], type: 'automatic' },
  runInPage:
    "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'pass', occurrences: [] }; }"
});
const CUSTOM = [rule('my-best-practice', ['best-practice']), rule('img-alt-present', ['images'])];

test('getChecksForRunOnly lists what a Chromium scan runs', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });

  for (const [runOnly, extra] of [
    [null, {}],
    [null, { profile: 'wcag22-aa' }],
    [['my-best-practice'], {}]
  ]) {
    const engineOptions = { customRules: CUSTOM, ...extra };
    const ran = await page.evaluate(
      ({ eo, ro }) =>
        window.a11ycore
          .runa11yCoreInPage(null, null, eo, ro)
          .checksResults.map((c) => c.ruleId)
          .sort(),
      { eo: engineOptions, ro: runOnly }
    );
    const listed = getChecksForRunOnly(runOnly, engineOptions)
      .map((r) => r.ruleId)
      .sort();
    assert.deepEqual(listed, ran, JSON.stringify([runOnly, extra]));
  }
});
