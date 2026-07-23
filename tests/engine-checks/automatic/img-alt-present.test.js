'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-img-alt-present';

function hasOccurrenceForId(rule, id) {
    return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no <img>`, () => {
    const html = `<!doctype html><html><body><p>No images</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when at least one applicable <img> exists and all have alt (alt may be empty)`, () => {
    const html = `<!doctype html><html><body>
    <img id="ok1" src="x.png" alt="A cat">
    <img id="ok2" src="y.png" alt="">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when only ineligible images exist (aria-hidden and not focusable)`, () => {
    const html = `<!doctype html><html><body>
    <img id="ah" src="x.png" aria-hidden="true">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but focusable is applicable and fails if alt missing`, () => {
    const html = `<!doctype html><html><body>
    <img id="focus_ah" src="x.png" aria-hidden="true" tabindex="0">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable)`, () => {
    const html = `<!doctype html><html><body>
    <img id="pres_nf" src="x.png" role="presentation">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation but focusable is NOT excluded and fails if alt missing`, () => {
    const html = `<!doctype html><html><body>
    <img id="pres_focus" src="x.png" role="presentation" tabindex="0">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'pres_focus'));
});

test(`${RULE_ID}: pass when alt is entirely absent but a non-empty title attribute is present (found on a real site — AliExpress's homepage logo, 2026-07-23: <img title="..."> with no alt attribute at all is a real, valid HTML-AAM text-alternative fallback, also accepted by the reference engine's own image-alt rule via its non-empty-title check)`, () => {
    const html = `<!doctype html><html><body>
    <img id="title_only" src="x.png" title="Company logo">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when title is present but empty/whitespace-only (an empty title is not a real text alternative)`, () => {
    const html = `<!doctype html><html><body>
    <img id="empty_title" src="x.png" title="   ">
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'empty_title'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert imgs)`, () => {
    const html = `<!doctype html><html><body>
    <div inert>
      <img id="inert_img" src="x.png">
    </div>
  </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/img-alt-present-all-scenarios.html)`, () => {
    const fixturePath = path.join(__dirname, '../..', 'fixtures', 'img-alt-present-all-scenarios.html');
    const html = fs.readFileSync(fixturePath, 'utf8');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    // With the current helper behavior and the fixed presentation logic, we expect 12 fails.
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 12, maxOccurrences: 12 });

    const expectedFailIds = [
        'img_case_01',
        'img_case_12',
        'img_case_13_label',
        'img_case_18',
        'img_case_24',   // opacity:0 case (note: duplicated in template; consider renaming template id)
        'img_case_25',
        'img_case_26',
        'img_case_23',
        'img_case_27a',
        'img_case_30',   // aria-labelledby dangling IDREF, no alt => fails
        'img_case_31',   // aria-label="" empty, no alt => fails
        'img_case_32',   // ancestor visibility:hidden but own visibility:visible override => eligible, missing alt => fails
    ];

    const expectedNoOccIds = [
        'img_case_04',
        'img_case_05',
        'img_case_06',
        'img_case_07',
        'img_case_08',
        'img_case_09',
        'img_case_10',
        'img_case_11',
        'img_case_14',   // has alt
        'img_case_15',   // hiddenAttr => ineligible in current helper
        'img_case_16',   // visibilityHidden => ineligible
        'img_case_17',   // inert => ineligible
        'img_case_27',   // presentation + not focusable => excluded by rule
        'img_case_26b',  // aria-hidden and not focusable => ineligible
        'img_case_25a',  // aria-hidden and not focusable => ineligible
        'img_case_25b',  // hiddenAttr => ineligible
        'img_case_28',   // aria-label present, no alt => satisfies ARIA naming mechanism
        'img_case_29',   // aria-labelledby resolves non-empty text => satisfies ARIA naming mechanism
        'img_case_33',   // ancestor visibility:hidden, no override => inherited, ineligible
    ];

    for (const id of expectedFailIds) {
        assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
    }

    for (const id of expectedNoOccIds) {
        assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
    }

    // Optional extra: verify escaped <img> in summaries
    for (const occ of rule.occurrences) {
        assert.ok(
            typeof occ.summary === 'string' && occ.summary.includes('<img>'),
            'Expected escaped <img> in occurrence.summary'
        );
    }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized and escaped`, () => {
    const html = `<!doctype html><html><body><img src="foo.png"></body></html>`;

    const result = runa11yCoreOnHtml(html, {
        runOnly: [RULE_ID],
        engineOptions: { locale: 'fr' }
    });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

    // Exact strings recommended (stable + deterministic)
    assert.strictEqual(rule.title, '<img> doit avoir un attribut alt');
    assert.strictEqual(
        rule.description,
        'Vérifie que les éléments <img> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.'
    );

    // Keys should still be present
    assert.ok(rule.i18n && typeof rule.i18n.titleKey === 'string');
    assert.ok(rule.i18n && typeof rule.i18n.descriptionKey === 'string');

    // Occurrence strings should be localized and escaped
    const occ = rule.occurrences[0];
    assert.strictEqual(occ.summary, 'Attribut alt manquant sur <img>.');
    assert.strictEqual(
        occ.hint,
        'Ajoutez un attribut alt (utilisez alt="" uniquement pour les images décoratives).'
    );
    assert.ok(occ.i18n && typeof occ.i18n.summaryKey === 'string');
    assert.ok(occ.i18n && typeof occ.i18n.hintKey === 'string');
});

test(`${RULE_ID}: i18n default is English and escaped`, () => {
    const html = `<!doctype html><html><body><img src="foo.png"></body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

    assert.strictEqual(rule.title, '<img> must have an alt attribute');
    assert.strictEqual(
        rule.description,
        'Checks that <img> elements provide an alt attribute to support a text alternative mechanism.'
    );

    const occ = rule.occurrences[0];
    assert.strictEqual(occ.summary, 'Missing alt attribute on <img>.');
    assert.strictEqual(occ.hint, 'Add an alt attribute (use alt="" only for decorative images).');
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
    const html = `<!doctype html><html><body><img src="foo.png"></body></html>`;

    const result = runa11yCoreOnHtml(html, {
        runOnly: [RULE_ID],
        engineOptions: { locale: 'zz' }
    });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

    assert.strictEqual(rule.title, '<img> must have an alt attribute');
    assert.strictEqual(
        rule.description,
        'Checks that <img> elements provide an alt attribute to support a text alternative mechanism.'
    );
});
