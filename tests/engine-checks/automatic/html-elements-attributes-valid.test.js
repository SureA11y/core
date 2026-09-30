'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'html-elements-attributes-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

const XHTML10 =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

function page(body, doctype = '<!doctype html>', htmlAttrs = 'lang="en"') {
  return `${doctype}<html ${htmlAttrs}><head><title>t</title></head><body>${body}</body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);
const reasons = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// Every case below was checked against the W3C validator (Nu checker
// 26.9.27): each failing case is a validator error there, and each passing
// case has no error, except where a test says the validator is stricter.
function expectFail(body, reasonCode) {
  const rule = assertRule(run(page(body)), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(reasons(rule), [reasonCode], body);
  return rule.occurrences[0];
}

// The validator reads hidden content too.
function expectFailEverywhere(body, reasonCode) {
  for (const wrapped of [
    body,
    `<div hidden>${body}</div>`,
    `<div style="display:none">${body}</div>`
  ]) {
    expectFail(wrapped, reasonCode);
  }
}

function expectPass(body) {
  assertRule(run(page(body)), RULE_ID, 'pass', { maxOccurrences: 0 });
}

test(`${RULE_ID}: obsolete elements fail, hidden ones included`, () => {
  expectFailEverywhere('<center>x</center>', 'obsoleteElement');
  for (const tag of ['blink', 'marquee', 'font', 'big', 'tt', 'strike', 'acronym', 'nobr']) {
    const occ = expectFail(`<${tag}>x</${tag}>`, 'obsoleteElement');
    assert.deepEqual(occ.i18n.params, { element: tag });
  }
  expectFail('<dir><li>a</li></dir>', 'obsoleteElement');
  expectFail('<object data="a.swf"><param name="a" value="b"></object>', 'obsoleteElement');
});

test(`${RULE_ID}: unknown elements fail; custom elements and current elements pass`, () => {
  expectFailEverywhere('<foo>x</foo>', 'unknownElement');
  expectFail('<font-face>x</font-face>', 'unknownElement');
  expectPass('<my-el>x</my-el><x->y</x-><search>s</search>');
  expectPass('<hgroup><h1>a</h1><p>b</p></hgroup><ruby>a<rt>b</rt></ruby>');
  expectPass('<svg><circle r="1"/></svg><math><mi>x</mi></math>');
});

test(`${RULE_ID}: dir must be ltr, rtl or auto, written without spaces`, () => {
  expectFailEverywhere('<p dir=" RTL ">x</p>', 'dirValue');
  expectFail('<p dir="">x</p>', 'dirValue');
  const occ = expectFail('<bdo dir="auto">a</bdo>', 'dirValue');
  assert.deepEqual(occ.i18n.params, { value: 'auto', element: 'bdo' });
  expectPass('<p dir="RTL">x</p><p dir="auto">y</p><bdo dir="ltr">z</bdo>');
});

test(`${RULE_ID}: an id must not be empty or contain whitespace`, () => {
  expectFailEverywhere('<p id="a b">x</p>', 'idValue');
  expectFail('<p id="">x</p>', 'idValue');
  expectFail('<p id="a&#9;b">x</p>', 'idValue');
  // A trailing space makes a different id, not a duplicate one.
  const result = runa11yCoreOnHtml(page('<p id="a ">x</p><p id="a">y</p>'), {
    runOnly: { includeRuleIds: [RULE_ID, 'duplicate-id'] }
  });
  assert.deepEqual(reasons(check(result, RULE_ID)), ['idValue']);
  assert.equal(check(result, 'duplicate-id').outcome, 'pass');
  expectPass('<p id="a&#160;b">x</p>');
});

test(`${RULE_ID}: lang must be a well-formed language tag`, () => {
  expectFailEverywhere('<p lang="en-US_x">Hello</p>', 'langValue');
  for (const value of [
    'fr-FR-!!',
    'en--US',
    ' en',
    'toolongprim',
    'en-US-US',
    'x-',
    '123',
    'en-a'
  ]) {
    const occ = expectFail(`<p lang="${value}">x</p>`, 'langValue');
    assert.equal(occ.i18n.params.value, value);
  }
  for (const value of [
    '',
    'EN-us',
    'zh-Hant-TW',
    'de-CH-1996',
    'es-419',
    'en-x-foo',
    'x-klingon',
    'i-klingon',
    'en-GB-oed',
    'zh-min-nan',
    'sgn-BE-FR',
    'qaa'
  ]) {
    expectPass(`<p lang="${value}">x</p>`);
  }
});

// Well formed but not registered: the validator rejects these, but the rule
// only judges the syntax, and RGAA accepts ISO 639-2 codes such as fra
// (glossary "Code de langue"). Missing a failure is allowed; a false one is
// not.
test(`${RULE_ID}: well-formed tags with unregistered subtags are not reported`, () => {
  for (const value of ['xx', 'fra', 'abcde', 'en-1234']) expectPass(`<p lang="${value}">x</p>`);
});

test(`${RULE_ID}: xml:lang needs a lang attribute with the same value`, () => {
  const rule = assertRule(
    run(page('<p>x</p>', '<!doctype html>', 'lang="fr-FR" xml:lang="fr"')),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), ['xmlLangMismatch']);
  assert.deepEqual(rule.occurrences[0].i18n.params, {
    xmlLang: 'fr',
    lang: 'fr-FR',
    element: 'html'
  });
  assertRule(run(page('<p>x</p>', '<!doctype html>', 'xml:lang="fr"')), RULE_ID, 'fail');
  expectFail('<p lang="en" xml:lang="fr">x</p>', 'xmlLangMismatch');
  assertRule(run(page('<p>x</p>', '<!doctype html>', 'lang="fr" xml:lang="FR"')), RULE_ID, 'pass');
});

test(`${RULE_ID}: scope must be row, col, rowgroup or colgroup on th`, () => {
  expectFailEverywhere(
    '<table><tr><th scope=" col ">a</th></tr><tr><td>1</td></tr></table>',
    'scopeValue'
  );
  expectFail('<table><tr><th scope="">a</th></tr><tr><td>1</td></tr></table>', 'scopeValue');
  expectFail('<table><tr><th scope="auto">a</th></tr><tr><td>1</td></tr></table>', 'scopeValue');
  expectFail('<div scope="row">x</div>', 'scopeElement');
  expectPass('<table><tr><th scope="COL">a</th><th scope="rowgroup">b</th></tr></table>');
  // scope on td is obsolete, but the validator only warns.
  expectPass('<table><tr><th>a</th></tr><tr><td scope="row">1</td></tr></table>');
});

test(`${RULE_ID}: headers must name th cells of the same table`, () => {
  expectFailEverywhere(
    '<table><tr><td id="h">A</td><td headers="h">1</td></tr></table>',
    'headersTarget'
  );
  const occ = expectFail(
    '<table><tr><th id="h">A</th><td headers="h zz">1</td></tr></table>',
    'headersTarget'
  );
  assert.deepEqual(occ.i18n.params, { target: 'zz' });
  expectFail(
    '<p id="h">x</p><table><tr><th>A</th><td headers="h">1</td></tr></table>',
    'headersTarget'
  );
  expectFail(
    '<table><tr><th id="h">A</th><td><table><tr><td headers="h">1</td></tr></table></td></tr></table>',
    'headersTarget'
  );
  expectFail(
    '<table><caption id="c">c</caption><tr><th>A</th><td headers="c">1</td></tr></table>',
    'headersTarget'
  );
  expectFail('<table><tr><th id="h">A</th><td headers="">1</td></tr></table>', 'headersEmpty');
  expectPass(
    '<table><thead><tr><th id="h">A</th><th headers="h" id="h2">B</th></tr></thead>' +
      '<tbody><tr><td headers="  h  h2 ">1</td></tr></tbody></table>'
  );
});

test(`${RULE_ID}: an optgroup needs a label attribute`, () => {
  expectFailEverywhere(
    '<select aria-label="s"><optgroup><option>a</option></optgroup></select>',
    'optgroupLabel'
  );
  expectPass('<select aria-label="s"><optgroup label=""><option>a</option></optgroup></select>');
});

test(`${RULE_ID}: an image button needs a non-empty alt`, () => {
  expectFailEverywhere(
    '<input type="image" src="a.png" alt="" aria-label="Search">',
    'inputImageAlt'
  );
  expectFail('<input type="IMAGE" src="a.png" aria-label="Search">', 'inputImageAlt');
  expectPass('<input type="image" src="a.png" alt="Search">');
  expectPass('<input type="image" src="a.png" alt=" " aria-label="Search">');
});

test(`${RULE_ID}: autocomplete values are checked, disabled fields included`, () => {
  expectFailEverywhere('<input disabled autocomplete="nom" aria-label="n">', 'autocompleteValue');
  expectFail(
    '<fieldset disabled><input autocomplete="nom" aria-label="n"></fieldset>',
    'autocompleteValue'
  );
  for (const value of [
    '',
    ' ',
    'shipping',
    'webauthn',
    'work name',
    'email home',
    'billing section-a email',
    'on email',
    'nickname one-time-code'
  ]) {
    expectFail(`<input autocomplete="${value}" aria-label="n">`, 'autocompleteValue');
  }
  expectFail('<input type="hidden" autocomplete="on">', 'autocompleteValue');
  expectFail('<select autocomplete="xyz"><option>a</option></select>', 'autocompleteValue');
  expectFail('<textarea autocomplete="" aria-label="n"></textarea>', 'autocompleteValue');
  expectFail('<form autocomplete="email"></form>', 'autocompleteValue');
  expectFail('<form autocomplete=" off "></form>', 'autocompleteValue');
});

test(`${RULE_ID}: an autofill field name must suit the input type`, () => {
  const occ = expectFail(
    '<input type="number" autocomplete="email" aria-label="n">',
    'autocompleteControl'
  );
  assert.deepEqual(occ.i18n.params, { value: 'email', fieldName: 'email', inputType: 'number' });
  expectFail('<input autocomplete="street-address" aria-label="n">', 'autocompleteControl');
  expectFail('<input type="password" autocomplete="email" aria-label="n">', 'autocompleteControl');
  expectFail(
    '<input type="tel" autocomplete="one-time-code" aria-label="n">',
    'autocompleteControl'
  );
  expectFail('<input type="Email" autocomplete="tel" aria-label="n">', 'autocompleteControl');
});

test(`${RULE_ID}: autocomplete is not allowed on fixed-value input types`, () => {
  for (const type of ['checkbox', 'radio', 'file', 'submit', 'reset', 'button']) {
    const occ = expectFail(
      `<input type="${type}" autocomplete="off" aria-label="n">`,
      'autocompleteType'
    );
    assert.deepEqual(occ.i18n.params, { inputType: type });
  }
});

test(`${RULE_ID}: valid autocomplete values pass`, () => {
  for (const markup of [
    '<input autocomplete="email" aria-label="n">',
    '<input autocomplete=" email " aria-label="n">',
    '<input autocomplete="EMAIL" aria-label="n">',
    '<input autocomplete="section-a billing email" aria-label="n">',
    '<input autocomplete="section- email" aria-label="n">',
    '<input autocomplete="section-foo shipping home tel-national" aria-label="n">',
    '<input autocomplete="fax tel-local-suffix" aria-label="n">',
    '<input autocomplete="username webauthn" aria-label="n">',
    '<input type="url" autocomplete="impp" aria-label="n">',
    '<input type="url" autocomplete="home impp" aria-label="n">',
    '<input type="hidden" autocomplete="shipping street-address">',
    '<input type="date" autocomplete="bday" aria-label="n">',
    '<input type="number" autocomplete="cc-exp-month" aria-label="n">',
    '<input type="email" autocomplete="off" aria-label="n">',
    '<textarea autocomplete="street-address" aria-label="n"></textarea>',
    '<select autocomplete="email" aria-label="n"><option>a</option></select>',
    '<form autocomplete="OFF"></form>'
  ]) {
    expectPass(markup);
  }
});

// Where the validator is stricter than the HTML standard, the rule stays
// silent: the standard makes these keywords case-insensitive, and puts no
// restriction on search inputs.
test(`${RULE_ID}: validator-only strictness is not reported`, () => {
  expectPass('<input autocomplete="OFF" aria-label="n">');
  expectPass('<input autocomplete="On" aria-label="n">');
  expectPass('<input type="search" autocomplete="street-address" aria-label="n">');
});

// 8.2.1 judges the source "selon le type de document spécifié": <center> is
// valid XHTML 1.0 Transitional.
test(`${RULE_ID}: a page declaring another doctype is asked about once`, () => {
  const rule = assertRule(
    run(page('<center>x</center><p id="">y</p>', XHTML10)),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), ['otherDoctype']);
  assert.equal(rule.occurrences[0].uncertainty.code, 'out-of-scope');
  // No doctype: checked as HTML5, as the validator does.
  assertRule(run(page('<center>x</center>', '')), RULE_ID, 'fail');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('<center>x</center>'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(rule.occurrences[0].summary, 'La balise <center> est obsolète en HTML.');
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('<center>x</center>'), { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.2 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.2' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(page('<center>x</center>'), opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// Under the RGAA profile, 8.2 takes this rule's verdict, while the WCAG
// rollups in the same run keep the WCAG rules' verdicts. Another rule may
// still ask about 8.2, so a page this rule passes is checked for "not
// failed" rather than "passed".
test(`${RULE_ID}: RGAA 8.2 fails headers pointing to a td, which WCAG 1.3.1 accepts`, () => {
  const result = runa11yCoreOnHtml(
    page('<table><tr><td id="h">A</td><td headers="h">1</td></tr></table>'),
    RGAA
  );
  assert.equal(check(result, 'table-headers-attr-valid').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
  assert.ok(rollup(result, 'rgaa-4.1.2-8.2').data.details.checksIds.includes(RULE_ID));
});

test(`${RULE_ID}: RGAA 8.2 fails an invalid autocomplete on a disabled field, which WCAG 1.3.5 exempts`, () => {
  const result = runa11yCoreOnHtml(
    page('<input disabled autocomplete="nom" aria-label="n">'),
    RGAA
  );
  assert.equal(check(result, 'autocomplete-valid').outcome, 'notApplicable');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
  assert.equal(rollup(result, 'rgaa-4.1.2-11.13').outcome, 'notApplicable');
});

test(`${RULE_ID}: WCAG 1.3.5 fails street-address on a search input, which RGAA 8.2 does not fail`, () => {
  const result = runa11yCoreOnHtml(
    page('<input type="search" autocomplete="street-address" aria-label="n">'),
    RGAA
  );
  assert.equal(check(result, 'autocomplete-valid').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-1.3.5-identify-input-purpose').outcome, 'fail');
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  assert.notEqual(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
});

test(`${RULE_ID}: RGAA 8.2 and WCAG 1.3.5 agree on an invalid value and on a valid one`, () => {
  const bad = runa11yCoreOnHtml(page('<input autocomplete="nom" aria-label="n">'), RGAA);
  assert.equal(rollup(bad, 'wcag-1.3.5-identify-input-purpose').outcome, 'fail');
  assert.equal(rollup(bad, 'rgaa-4.1.2-8.2').outcome, 'fail');
  const good = runa11yCoreOnHtml(page('<input autocomplete="email" aria-label="n">'), RGAA);
  assert.equal(rollup(good, 'wcag-1.3.5-identify-input-purpose').outcome, 'pass');
  assert.equal(check(good, RULE_ID).outcome, 'pass');
  assert.notEqual(rollup(good, 'rgaa-4.1.2-8.2').outcome, 'fail');
});

test(`${RULE_ID}: the WCAG attribute rules no longer carry 8.2.1`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '<marquee>m</marquee><input autocomplete="nom" aria-label="n">' +
        '<table><tr><th id="h" scope="bogus">A</th><td headers="x">1</td></tr></table>',
      '<!doctype html>',
      'lang="fr-FR" xml:lang="en"'
    ),
    RGAA
  );
  const ids = rollup(result, 'rgaa-4.1.2-8.2').data.details.checksIds;
  for (const id of [
    'deprecated-elements-not-used',
    'autocomplete-valid',
    'scope-attr-valid',
    'table-headers-attr-valid',
    'html-xml-lang-mismatch'
  ]) {
    assert.ok(!ids.includes(id), id);
  }
  assert.ok(ids.includes(RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'fail', {
    minOccurrences: 12,
    maxOccurrences: 12
  });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+?) ?"/) || [])[1]).sort();
  assert.deepEqual(
    ids,
    Array.from({ length: 12 }, (_, i) => `heav_case_${String(i + 1).padStart(2, '0')}`)
  );
});
