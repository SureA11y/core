'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'canvas-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no <canvas>`, () => {
  const html = `<!doctype html><html><body><p>No canvas</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when at least one applicable <canvas> exists and each has fallback text`, () => {
  const html = `<!doctype html><html><body>
    <canvas id="c1">Chart summary</canvas>
    <canvas id="c2">Alternate text</canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when <canvas> has an accessible name (aria-label) even without fallback`, () => {
  const html = `<!doctype html><html><body>
    <canvas id="c_aria" aria-label="Sales chart"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when <canvas> has an accessible name (aria-labelledby) even without fallback`, () => {
  const html = `<!doctype html><html><body>
    <div id="lbl">Revenue chart</div>
    <canvas id="c_lb" aria-labelledby="lbl"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <canvas> has no fallback and no accessible name`, () => {
  const html = `<!doctype html><html><body>
    <canvas id="c_fail"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'c_fail'));
});

test(`${RULE_ID}: notApplicable when only ineligible canvases exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <canvas id="c_ah" aria-hidden="true"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and fails if no text alternative`, () => {
  const html = `<!doctype html><html><body>
    <canvas id="c_ah_tab" aria-hidden="true" tabindex="0"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'c_ah_tab'));
});

test(`${RULE_ID}: aria-hidden but programmatic focus only (tabindex=-1) stays ineligible (=> notApplicable if only those)`, () => {
  const html = `<!doctype html><html><body>
    <canvas id="c_ah_prog" aria-hidden="true" tabindex="-1"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: IDREF-referenced (eligible element references aria-hidden canvas) becomes applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <div id="host" aria-labelledby="c_ref">Host</div>
    <canvas id="c_ref" aria-hidden="true"></canvas>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'c_ref'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert canvases)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <canvas id="c_inert"></canvas>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/canvas-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'canvas-text-alternative-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Crafted fixture: expect 9 fails (canvas_case_06 now correctly fails —
  // <canvas> is not labelable, so label[for] is not a valid mechanism).
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedFailIds = [
    'canvas_case_01',
    'canvas_case_06', // label[for] is not a valid mechanism for <canvas>
    'canvas_case_10',
    'canvas_case_11',
    'canvas_case_12',
    'canvas_case_13',
    'canvas_case_20',
    'canvas_case_21',
    'canvas_case_23'  // descendant img[alt=""] is empty, not meaningful fallback
  ];

  const expectedNoOccIds = [
    'canvas_case_02', // fallback present
    'canvas_case_03', // aria-label
    'canvas_case_04', // aria-labelledby
    'canvas_case_05', // title attr name
    'canvas_case_07', // aria-hidden ineligible
    'canvas_case_08', // display:none ineligible
    'canvas_case_09', // inert ineligible
    'canvas_case_14', // template non-composed
    'canvas_case_15', // mixed: eligible w/ alt passes; ineligible doesn't fail
    'canvas_case_16', // aria-hidden + tabindex=-1 ineligible
    'canvas_case_17', // idref referenced but has name => pass
    'canvas_case_18', // details closed ineligible
    'canvas_case_19', // visibility:hidden ineligible
    'canvas_case_22', // descendant img[alt] non-empty => meaningful fallback
    'canvas_case_24', // descendant area[alt] non-empty => meaningful fallback
    'canvas_case_25'  // descendant [aria-label] non-empty => meaningful fallback
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  for (const occ of rule.occurrences) {
    assert.ok(typeof occ.summary === 'string' && occ.summary.includes('<canvas>'), 'Expected <canvas> in occurrence.summary');
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><canvas id="c"></canvas></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'fr' } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<canvas> doit fournir une alternative textuelle');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <canvas> fournissent une alternative textuelle via un contenu de repli ou un nom accessible.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Alternative textuelle manquante pour <canvas>.');
  assert.strictEqual(
    occ.hint,
    'Fournissez un texte de repli dans <canvas> ou un nom accessible (par ex. aria-label/aria-labelledby).'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><canvas id="c"></canvas></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<canvas> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing text alternative for <canvas>.');
  assert.strictEqual(
    occ.hint,
    'Provide fallback text inside <canvas> or an accessible name (e.g., aria-label/aria-labelledby).'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><canvas id="c"></canvas></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'zz' } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<canvas> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.'
  );
});
