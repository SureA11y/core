'use strict';

// form-group-name-present in Chromium: the scenario fixture gives the same
// findings as under jsdom, and the groups it passes are the ones Chromium's
// accessibility tree names (round 10, G10-1).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Playwright's Chromium, or CHROMIUM_EXECUTABLE_PATH's; skipped without one.
const { chromium, executablePath, skip } = require('../../helpers/chromium');
const { addBundle } = require('../../helpers/browserBundle');

const RULE_ID = 'form-group-name-present';
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../..', 'fixtures', 'form-group-name-present-all-scenarios.html'),
  'utf8'
);

test(`${RULE_ID}: the fixture in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(FIXTURE);
  await addBundle(page);
  const got = await page.evaluate((ruleId) => {
    const r = window.a11ycore
      .runa11yCoreInPage(null, null, {}, [ruleId])
      .checksResults.find((c) => c.ruleId === ruleId);
    return {
      outcome: r.outcome,
      ids: r.occurrences.map((o) => /id="(fgn_case_\d+)"/.exec(o.html)[1]),
      codes: r.occurrences.map((o) => o.data.details.reasonCode)
    };
  }, RULE_ID);
  assert.deepEqual(got, {
    outcome: 'cantTell',
    ids: ['fgn_case_01', 'fgn_case_02', 'fgn_case_03', 'fgn_case_04', 'fgn_case_11'],
    codes: [
      'RADIO_GROUP_NO_NAME',
      'CHECKBOX_GROUP_NO_NAME',
      'RADIO_GROUP_NO_NAME',
      'RADIO_GROUP_NO_NAME',
      'RADIO_GROUP_SPLIT'
    ]
  });
  // The groups the rule takes as named are named in Chromium's tree too.
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const named = nodes
    .filter((n) => n.role && ['group', 'radiogroup'].includes(n.role.value))
    .map((n) => (n.name && n.name.value) || '');
  for (const name of ['Payment', 'Delivery day', 'Newsletters', 'Delivery', 'Collection']) {
    assert.ok(named.includes(name), name);
  }
});

test(
  `${RULE_ID}: hidden legends and options the flat tree leaves out, in Chromium (round 11)`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    for (const [
      label,
      light,
      shadow,
      outcome
    ] of require('./form-group-name-present-round-11-cases.js')) {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${light}</main></body></html>`
        );
        if (shadow)
          await page.evaluate((inner) => {
            document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = inner;
          }, shadow);
        await addBundle(page);
        const got = await page.evaluate(
          (ruleId) =>
            window.a11ycore
              .runa11yCoreInPage(null, null, {}, [ruleId])
              .checksResults.find((c) => c.ruleId === ruleId).outcome,
          RULE_ID
        );
        assert.equal(got, outcome, label);
      } finally {
        await page.close();
      }
    }
  }
);
