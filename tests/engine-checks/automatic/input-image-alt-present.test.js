'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-input-image-alt-present';

function hasOccurrenceForId(rule, id) {
    return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no <input type="image">`, () => {
    const html = `<!doctype html><html><body><p>No image inputs</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when at least one applicable <input type="image"> exists and all have alt (alt may be empty)`, () => {
    const html = `<!doctype html><html><body>
    <input id="ok1" type="image" alt="Search" src="x.png">
    <input id="ok2" type="image" alt="" src="y.png">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when alt is entirely absent but a non-empty title attribute is present (sibling fix to img-alt-present's real AliExpress finding, 2026-07-23 — same HTML-AAM fallback, also accepted by the reference engine's own input-image-alt rule)`, () => {
    const html = `<!doctype html><html><body>
    <input id="title_only" type="image" title="Search" src="x.png">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-hidden and no alt)`, () => {
    const html = `<!doctype html><html><body>
    <input id="ah" type="image" aria-hidden="true" src="x.png">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when only ineligible inputs exist (aria-hidden and not focusable)`, () => {
    const html = `<!doctype html><html><body>
    <input id="ah" type="image" aria-hidden="true" disabled src="x.png">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but focusable is applicable and fails if alt missing`, () => {
    const html = `<!doctype html><html><body>
    <input id="focus_ah" type="image" aria-hidden="true" tabindex="0" src="x.png">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
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
    const fixturePath = path.join(__dirname, '../..', 'fixtures', 'input-image-alt-present-all-scenarios.html');
    const html = fs.readFileSync(fixturePath, 'utf8');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 9, maxOccurrences: 9 });

    const expectedFailIds = [
        'input_image_case_01',
        'input_image_case_04',
        'input_image_case_10',
        'input_image_case_11',
        'input_image_case_12',
        'input_image_case_13',
        'input_image_case_16',  // aria-labelledby dangling IDREF, no alt => fails
        'input_image_case_17',  // aria-label="" empty, no alt => fails
        'input_image_case_18'   // ancestor visibility:hidden but own visibility:visible override => eligible, missing alt => fails
    ];

    const expectedNoOccIds = [
        'input_image_case_02',
        'input_image_case_03',
        'input_image_case_05',
        'input_image_case_06',
        'input_image_case_07',
        'input_image_case_08',
        'input_image_case_09',
        'input_image_case_14',  // aria-label present, no alt => satisfies ARIA naming mechanism
        'input_image_case_15',  // aria-labelledby resolves non-empty text => satisfies ARIA naming mechanism
        'input_image_case_19'   // ancestor visibility:hidden, no override => inherited, ineligible
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
    assert.strictEqual(occ.hint, 'Add an alt attribute (use alt="" only when a separate accessible name is provided).');
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
