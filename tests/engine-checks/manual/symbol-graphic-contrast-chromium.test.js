'use strict';

// symbol-graphic-contrast in Chromium: the scenario fixture gives the same
// findings as under jsdom, and the text-contrast rules judge none of the
// symbols this rule asks about (round 10, G10-5).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Playwright's Chromium, or CHROMIUM_EXECUTABLE_PATH's; skipped without one.
const { chromium, executablePath, skip } = require('../../helpers/chromium');
const { addBundle } = require('../../helpers/browserBundle');

const RULE_ID = 'symbol-graphic-contrast';
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../..', 'fixtures', 'symbol-graphic-contrast-all-scenarios.html'),
  'utf8'
);

test(`${RULE_ID}: the fixture in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(FIXTURE);
  await addBundle(page);
  const got = await page.evaluate((ruleId) => {
    const result = window.a11ycore.runa11yCoreInPage(null, null, {}, [
      ruleId,
      'contrast-minimum',
      'contrast-computable'
    ]);
    const idsOf = (id) => {
      const r = result.checksResults.find((c) => c.ruleId === id);
      return (r ? r.occurrences : [])
        .map((o) => /id="(sgc_case_\d+)"/.exec(o.html || ''))
        .filter(Boolean)
        .map((m) => m[1]);
    };
    const own = result.checksResults.find((c) => c.ruleId === ruleId);
    return {
      outcome: own.outcome,
      ids: idsOf(ruleId),
      ratios: own.occurrences.map((o) => o.data.details.ratio),
      textRules: [...idsOf('contrast-minimum'), ...idsOf('contrast-computable')]
    };
  }, RULE_ID);
  assert.equal(got.outcome, 'cantTell');
  assert.deepEqual(got.ids, ['sgc_case_01', 'sgc_case_02', 'sgc_case_03']);
  assert.ok(got.ratios.every((r) => r < 3));
  assert.equal(got.ratios[0], 1.42);
  // The symbols asked about are no text the text-contrast rules judge.
  for (const id of got.ids) assert.ok(!got.textRules.includes(id), id);
});
