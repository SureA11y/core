'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'svg-image-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no SVG <image>`, () => {
  const html = `<!doctype html><html><body><svg></svg></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when applicable SVG <image> has <title> text`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="ok1" href="x.png"><title>Logo</title></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when applicable SVG <image> has aria-label`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="ok2" href="x.png" aria-label="Logo"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable SVG <image> has no title/desc and no accessible name`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="bad1" href="x.png"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad1'));
});

test(`${RULE_ID}: notApplicable when only ineligible images exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="ah" href="x.png" aria-hidden="true"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable (tabindex=0) is applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="focus_ah" href="x.png" aria-hidden="true" tabindex="0"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: IDREF-referenced (eligible element references aria-hidden image) becomes applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <div aria-labelledby="ref_img">Ref</div>
    <svg><image id="ref_img" href="x.png" aria-hidden="true"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ref_img'));
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="pres_nf" href="x.png" role="presentation"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation but focusable is NOT excluded and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <svg><image id="pres_focus" href="x.png" role="presentation" tabindex="0"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'pres_focus'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert images)`, () => {
  const html = `<!doctype html><html><body>
    <div inert><svg><image id="inert_img" href="x.png"></image></svg></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/svg-image-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'svg-image-text-alternative-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedFailIds = [
    'svgimg_case_01',
    'svgimg_case_05',
    'svgimg_case_07',
    'svgimg_case_09',
    'svgimg_case_10', // <title> not first child does not count
    'svgimg_case_13', // <desc> misplaced does not count
    'svgimg_case_16', // opacity:0 remains eligible
    'svgimg_case_17'  // offscreen remains eligible
  ];
  const expectedNoOccIds = [
    'svgimg_case_02',
    'svgimg_case_03',
    'svgimg_case_04',
    'svgimg_case_06',
    'svgimg_case_08',
    'svgimg_case_11', // <desc> as first child counts
    'svgimg_case_12', // empty <title> + <desc> pair-second counts
    'svgimg_case_14', // title attribute counts
    'svgimg_case_15', // aria-labelledby counts
    'svgimg_case_18', // display:none ineligible
    'svgimg_case_19', // visibility:hidden ineligible
    'svgimg_case_20'  // template non-composed ineligible
  ];

  for (const id of expectedFailIds) assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  for (const id of expectedNoOccIds) assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);

  for (const occ of rule.occurrences) {
    assert.ok(typeof occ.summary === 'string' && occ.summary.includes('<image>'), 'Expected <image> in occurrence.summary');
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body>
    <svg><image href="x.png"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'fr' } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<image> dans un SVG doit avoir une alternative textuelle');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments SVG <image> fournissent une alternative textuelle via <title>/<desc> ou un nom accessible ARIA.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Alternative textuelle manquante sur <image> (SVG).');
  assert.strictEqual(
    occ.hint,
    'Ajoutez un <title> (et éventuellement <desc>) dans <image>, ou fournissez aria-label/aria-labelledby.'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body>
    <svg><image href="x.png"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, 'SVG <image> must have a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that SVG <image> elements provide a text alternative via <title>/<desc> or an ARIA accessible name.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing text alternative on SVG <image>.');
  assert.strictEqual(
    occ.hint,
    'Add a <title> (and optionally <desc>) inside <image>, or provide aria-label/aria-labelledby.'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body>
    <svg><image href="x.png"></image></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale: 'zz' } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'SVG <image> must have a text alternative');
});
