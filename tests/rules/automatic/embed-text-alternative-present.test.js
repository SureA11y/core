'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-embed-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no <embed>`, () => {
  const html = `<!doctype html><html><body><p>No embeds</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-label provides a name`, () => {
  const html = `<!doctype html><html><body>
    <embed id="ok" src="x.pdf" aria-label="Report">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <embed> has no accessible name`, () => {
  const html = `<!doctype html><html><body>
    <embed id="bad" src="x.pdf">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad'));
});

test(`${RULE_ID}: notApplicable when only ineligible embeds exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <embed id="ah" src="x.pdf" aria-hidden="true">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <embed id="focus_ah" src="x.pdf" aria-hidden="true" tabindex="0">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert embeds)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <embed id="inert_embed" src="x.pdf">
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <embed id="pres_nf" src="x.pdf" role="presentation">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/embed-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'embed-text-alternative-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Expected fails for the crafted fixture.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedFailIds = [
    'embed_case_01',
    'embed_case_06',
    'embed_case_08',
    'embed_case_09',
    'embed_case_10',
    'embed_case_15'
  ];

  const expectedNoOccIds = [
    'embed_case_02',
    'embed_case_03',
    'embed_case_04',
    'embed_case_05',
    'embed_case_07',
    'embed_case_11',
    'embed_case_12',
    'embed_case_13',
    'embed_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  // Verify escaped <embed> in summaries
  for (const occ of rule.occurrences) {
    assert.ok(
      typeof occ.summary === 'string' && occ.summary.includes('<embed>'),
      'Expected <embed> in occurrence.summary'
    );
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><embed src="x.pdf"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<embed> doit fournir une alternative textuelle');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <embed> fournissent une alternative textuelle via un nom accessible.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Alternative textuelle manquante pour <embed>.');
  assert.strictEqual(
    occ.hint,
    'Ajoutez un nom accessible à <embed> (aria-label/aria-labelledby).'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><embed src="x.pdf"></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<embed> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <embed> elements provide a text alternative via an accessible name.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing text alternative for <embed>.');
  assert.strictEqual(
    occ.hint,
    'Add an accessible name to <embed> (aria-label/aria-labelledby).'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><embed src="x.pdf"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<embed> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <embed> elements provide a text alternative via an accessible name.'
  );
});
