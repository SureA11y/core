'use strict';

/**
 * focus-indicator-contrast in a real browser. jsdom and Chromium expose the
 * CSS object model differently (Chromium expands the outline shorthand into
 * longhands, some with `initial`), so the fixture is replayed in both and
 * the findings must match.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

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

const RULE_ID = 'focus-indicator-contrast';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

function summarize(result) {
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  return {
    outcome: rule.outcome,
    findings: (rule.occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
      o.occurrenceOutcome,
      o.data.details.reasonCode
    ])
  };
}

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('the fixture gives the same findings as in jsdom', async () => {
    const p = await browser.newPage();
    try {
      await p.setContent(FIXTURE);
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (include) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include } }, null),
        RULE_ID
      );
      const jsdom = summarize(
        runa11yCoreOnHtml(FIXTURE, { runOnly: { includeRuleIds: [RULE_ID] } })
      );
      assert.deepEqual(summarize(result), jsdom);
      assert.equal(jsdom.outcome, 'fail');
    } finally {
      await p.close();
    }
  });
});
