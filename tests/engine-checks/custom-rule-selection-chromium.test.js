'use strict';

/**
 * Custom rules under a profile, in a real browser (#138). An override
 * without its built-in's tags runs in the built-in's place, and a
 * best-practice custom rule the profile leaves out is listed in
 * skippedCustomRules rather than dropped without a trace.
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

test('custom rules under a profile, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });

  const r = await page.evaluate(() => {
    const rule = (id, tags) => ({
      id,
      meta: { title: id, description: id, tags, wcagSc: [], type: 'automatic' },
      runInPage:
        "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'cantTell', occurrences: [] }; }"
    });
    const res = window.a11ycore.runa11yCoreInPage(
      null,
      null,
      {
        profile: 'wcag22-aa',
        customRules: [
          rule('img-alt-present', ['images']),
          rule('my-best-practice', ['best-practice'])
        ]
      },
      null
    );
    return {
      override: (res.checksResults.find((c) => c.ruleId === 'img-alt-present') || {}).outcome,
      bestPractice: res.checksResults.some((c) => c.ruleId === 'my-best-practice'),
      skipped: res.skippedCustomRules.map((s) => s.id)
    };
  });

  assert.deepEqual(r, { override: 'cantTell', bestPractice: false, skipped: ['my-best-practice'] });
});
