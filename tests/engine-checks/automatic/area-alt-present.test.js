'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'area-alt-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no <area>`, () => {
  const html = `<!doctype html><html><body><p>No image maps</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when at least one applicable <area> exists and all have alt (alt may be empty)`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m">
      <area id="ok1" alt="Go" shape="rect" coords="0,0,1,1">
      <area id="ok2" alt="" shape="rect" coords="0,0,1,1">
    </map>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when alt is entirely absent but a non-empty title attribute is present (sibling fix to img-alt-present's real AliExpress finding, 2026-07-23 — same HTML-AAM fallback, also accepted by a reference engine's own area-alt rule)`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m">
      <area id="title_only" title="Go to home" shape="rect" coords="0,0,1,1">
    </map>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when only ineligible or non-focusable areas exist`, () => {
  const html = `<!doctype html><html><body>
    <map name="mu">
      <area id="ah" aria-hidden="true" shape="rect" coords="0,0,1,1">
      <area id="nf" shape="rect" coords="0,0,1,1">
    </map>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but focusable (used map policy) is applicable and fails if alt missing`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m">
      <area id="focus_ah" aria-hidden="true" shape="rect" coords="0,0,1,1">
    </map>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: inert wrapper makes areas ineligible (=> notApplicable when only inert-wrapped used-map areas)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <img alt="" usemap="#m" src="x.png">
      <map name="m"><area id="inert_area" shape="rect" coords="0,0,1,1"></map>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: used map but ineligible referencing <img> => notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <img hidden alt="" usemap="#m" src="x.png">
    <map name="m"><area id="a1" shape="rect" coords="0,0,1,1"></map>
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/area-alt-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'area-alt-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Expected fails for the crafted fixture.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedFailIds = [
    'area_case_01',
    'area_case_04',
    'area_case_09',
    'area_case_10',
    'area_case_14',
    'area_case_15',
    'area_case_16',
    'area_case_23' // aria-labelledby dangling IDREF, no alt => fails
  ];

  const expectedNoOccIds = [
    'area_case_02',
    'area_case_03',
    'area_case_05',
    'area_case_06',
    'area_case_07',
    'area_case_08',
    'area_case_11',
    'area_case_12',
    'area_case_13',
    'area_case_17',
    'area_case_18',
    'area_case_19',
    'area_case_20',
    'area_case_21', // aria-label satisfies mechanism without alt
    'area_case_22' // aria-labelledby resolves non-empty text
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  // Verify escaped <area> in summaries
  for (const occ of rule.occurrences) {
    assert.ok(
      typeof occ.summary === 'string' && occ.summary.includes('<area>'),
      'Expected escaped <area> in occurrence.summary'
    );
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized and escaped`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png"><map name="m"><area id="x"></map>
  </body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<area> doit avoir un attribut alt');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <area> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Attribut alt manquant sur <area>.');
  assert.strictEqual(
    occ.hint,
    'Ajoutez un attribut alt (utilisez alt="" uniquement pour les zones décoratives).'
  );
});

test(`${RULE_ID}: i18n default is English and escaped`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png"><map name="m"><area id="x"></map>
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<area> must have an alt attribute');
  assert.strictEqual(
    rule.description,
    'Checks that <area> elements provide an alt attribute to support a text alternative mechanism.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing alt attribute on <area>.');
  assert.strictEqual(occ.hint, 'Add an alt attribute (use alt="" only for decorative areas).');
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png"><map name="m"><area id="x"></map>
  </body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<area> must have an alt attribute');
  assert.strictEqual(
    rule.description,
    'Checks that <area> elements provide an alt attribute to support a text alternative mechanism.'
  );
});
