'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'object-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no <object>`, () => {
  const html = `<!doctype html><html><body><p>No objects</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when fallback text exists`, () => {
  const html = `<!doctype html><html><body>
    <object id="ok" data="x.svg">Fallback text</object>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-label provides a name`, () => {
  const html = `<!doctype html><html><body>
    <object id="ok" data="x.svg" aria-label="Diagram"></object>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <object> has no fallback and no name`, () => {
  const html = `<!doctype html><html><body>
    <object id="bad" data="x.svg"></object>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad'));
});

test(`${RULE_ID}: notApplicable when only ineligible objects exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <object id="ah" data="x.svg" aria-hidden="true"></object>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <object id="focus_ah" data="x.svg" aria-hidden="true" tabindex="0"></object>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert objects)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <object id="inert_obj" data="x.svg"></object>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <object id="pres_nf" data="x.svg" role="presentation"></object>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/object-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'object-text-alternative-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Expected fails for the crafted fixture.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = [
    'object_case_01',
    'object_case_08',
    'object_case_10',
    'object_case_11',
    'object_case_12',
    'object_case_17',
    'object_case_18'  // whitespace-only fallback content does not count
  ];

  const expectedNoOccIds = [
    'object_case_02',
    'object_case_03',
    'object_case_04',
    'object_case_05',
    'object_case_06',
    'object_case_07',
    'object_case_09',
    'object_case_13',
    'object_case_14',
    'object_case_15',
    'object_case_16'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  // Verify escaped <object> in summaries
  for (const occ of rule.occurrences) {
    assert.ok(
      typeof occ.summary === 'string' && occ.summary.includes('<object>'),
      'Expected <object> in occurrence.summary'
    );
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><object data="x.svg"></object></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<object> doit fournir une alternative textuelle');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <object> fournissent une alternative textuelle via un contenu de repli ou un nom accessible.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Alternative textuelle manquante pour <object>.');
  assert.strictEqual(
    occ.hint,
    'Fournissez un contenu de repli pertinent dans <object>, ajoutez un nom accessible (aria-label/aria-labelledby), ou utilisez un attribut title comme solution de repli.'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><object data="x.svg"></object></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<object> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <object> elements provide a text alternative via fallback content or an accessible name.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing text alternative for <object>.');
  assert.strictEqual(
    occ.hint,
    'Provide meaningful fallback content inside <object>, add an accessible name (aria-label/aria-labelledby), or use a title attribute as a best-effort fallback.'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><object data="x.svg"></object></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<object> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <object> elements provide a text alternative via fallback content or an accessible name.'
  );
});
