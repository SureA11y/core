'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'input-image-alt-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no <input type="image">`, () => {
  const html = `<!doctype html><html><body><p>No image inputs</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when every applicable <input type="image"> has a non-empty name`, () => {
  const html = `<!doctype html><html><body>
    <input id="ok1" type="image" alt="Search" src="x.png">
    <input id="ok2" type="image" alt="" aria-label="Clear" src="y.png">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail on alt="" with no other naming source`, () => {
  const html = `<!doctype html><html><body><input id="e" type="image" alt="" src="x.png"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'empty_alt');
});

test(`${RULE_ID}: alt="" is fine when the control is named elsewhere`, () => {
  for (const markup of [
    `<input type="image" src="x.png" alt="" aria-label="Search">`,
    `<input type="image" src="x.png" alt="" title="Search">`
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: exactly one rule reports an unnamed alt="" image button`, () => {
  const html = `<!doctype html><html><body><input type="image" alt="" src="x.png"></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID, 'input-image-alt-decorative']
  });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assertRule(result, 'input-image-alt-decorative', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: pass when alt is entirely absent but a non-empty title attribute is present (same HTML-AAM fallback)`, () => {
  const html = `<!doctype html><html><body>
    <input id="title_only" type="image" title="Search" src="x.png">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when only ineligible inputs exist (aria-hidden and not focusable)`, () => {
  const html = `<!doctype html><html><body>
    <input id="ah" type="image" aria-hidden="true" disabled src="x.png">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when aria-hidden and explicitly tabbable`, () => {
  const html = `<!doctype html><html><body>
    <input id="focus_ah" type="image" aria-hidden="true" tabindex="0" src="x.png">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert inputs)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <input id="inert_input" type="image" src="x.png">
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: disabled is NOT excluded and fails if alt missing`, () => {
  const html = `<!doctype html><html><body>
    <input id="dis" type="image" disabled src="x.png">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'dis'));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/input-image-alt-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'input-image-alt-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedFailIds = [
    'input_image_case_01',
    'input_image_case_03', // alt="" with no other naming source
    'input_image_case_10',
    'input_image_case_11',
    'input_image_case_12',
    'input_image_case_13',
    'input_image_case_16', // aria-labelledby dangling IDREF, no alt => fails
    'input_image_case_17', // aria-label="" empty, no alt => fails
    'input_image_case_18' // ancestor visibility:hidden but own visibility:visible override => eligible, missing alt => fails
  ];

  const expectedNoOccIds = [
    'input_image_case_02',
    'input_image_case_04', // aria-hidden: outside the accessibility tree
    'input_image_case_05',
    'input_image_case_06',
    'input_image_case_07',
    'input_image_case_08',
    'input_image_case_09',
    'input_image_case_14', // aria-label present, no alt => satisfies ARIA naming mechanism
    'input_image_case_15', // aria-labelledby resolves non-empty text => satisfies ARIA naming mechanism
    'input_image_case_19' // ancestor visibility:hidden, no override => inherited, ineligible
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized and escaped`, () => {
  const html = `<!doctype html><html><body><input type="image" src="foo.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<input type="image"> doit avoir un attribut alt');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <input type="image"> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Attribut alt manquant sur <input type="image">.');
  assert.strictEqual(
    occ.hint,
    'Ajoutez un attribut alt (utilisez alt="" uniquement lorsqu’un nom accessible séparé est fourni).'
  );
});

test(`${RULE_ID}: i18n default is English and escaped`, () => {
  const html = `<!doctype html><html><body><input type="image" src="foo.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<input type="image"> must have an alt attribute');
  assert.strictEqual(
    rule.description,
    'Checks that <input type="image"> elements provide an alt attribute to support a text alternative mechanism.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Missing alt attribute on <input type="image">.');
  assert.strictEqual(
    occ.hint,
    'Add an alt attribute (use alt="" only when a separate accessible name is provided).'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><input type="image" src="foo.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<input type="image"> must have an alt attribute');
  assert.strictEqual(
    rule.description,
    'Checks that <input type="image"> elements provide an alt attribute to support a text alternative mechanism.'
  );
});

test(`${RULE_ID}: notApplicable for an image button inside an aria-hidden ancestor`, () => {
  const html = `<!doctype html><html><body><div aria-hidden="true"><input type="image" src="foo.png"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for an image button carrying aria-hidden itself`, () => {
  const html = `<!doctype html><html><body><input type="image" src="foo.png" aria-hidden="true"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an image button outside the aria-hidden subtree is unaffected`, () => {
  const html = `<!doctype html><html><body>
    <div aria-hidden="true"><input type="image" src="a.png"></div>
    <input id="visible" type="image" src="b.png">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(
    (rule.occurrences || []).some((o) => (o.html || '').includes('id="visible"')),
    'expected the occurrence to be the visible image button'
  );
});

test('aria-hidden-focus reports the image button this rule skips', () => {
  const html = `<!doctype html><html><body><div aria-hidden="true"><input type="image" src="foo.png"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-hidden-focus'] });
  assertRule(result, 'aria-hidden-focus', 'fail', { minOccurrences: 1 });
});

test(`${RULE_ID}: fail when alt is the HTML-AAM default name`, () => {
  const html = `<!doctype html><html><body><input id="d" type="image" src="x.png" alt="Submit Query"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'default_name');
});

test(`${RULE_ID}: the default-name match ignores case and surrounding space`, () => {
  const html = `<!doctype html><html><body><input type="image" src="x.png" alt="  submit query  "></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when the default name comes from aria-label or title`, () => {
  for (const markup of [
    `<input type="image" src="x.png" alt="" aria-label="Submit Query">`,
    `<input type="image" src="x.png" title="Submit">`
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: a name that merely starts with the default word passes`, () => {
  for (const alt of ['Submit search', 'Submit order', 'Search', 'Query builder']) {
    const html = `<!doctype html><html><body><input type="image" src="x.png" alt="${alt}"></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: alt="" fails as an empty name, not as a default name`, () => {
  const html = `<!doctype html><html><body><input type="image" src="x.png" alt=""></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'empty_alt');
});
