'use strict';

// symbol-graphic-contrast: symbols drawn as text, with no letter or digit,
// used as a graphic, under 3:1 against their background are asked about as
// WCAG 1.4.11 non-text contrast (round 10, G10-5).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'symbol-graphic-contrast';

function run(body, engineOptions) {
  return runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff;color:#111">${body}</body></html>`,
    { runOnly: [RULE_ID], ...(engineOptions ? { engineOptions } : {}) }
  );
}

test(`${RULE_ID}: pale rating stars are asked about, leaning fail`, () => {
  const rule = assertRule(
    run('<p>Rating <span id="s" style="color:#f5d76e">★★★★☆</span></p>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.ok(occ.html.includes('id="s"'));
  assert.deepEqual(occ.data.details, {
    reasonCode: 'SYMBOLS_BELOW_GRAPHIC_THRESHOLD',
    symbols: '★★★★☆',
    ratio: 1.42,
    foreground: '#f5d76e',
    background: '#ffffff',
    threshold: 3
  });
  assert.equal(occ.i18n.summaryKey, 'symbolGraphicContrast_summary_cantTell');
  assert.equal(occ.lean.toward, 'fail');
  assert.equal(occ.lean.i18n.whyKey, 'symbolGraphicContrast_lean_why');
});

test(`${RULE_ID}: dots, arrows and check marks are symbols too; opacity counts`, () => {
  for (const body of [
    '<span style="color:#ccc">●●○○</span>',
    '<span style="color:#bbb">→</span>',
    '<span style="color:#a8e6a3">✓</span>',
    '<span style="color:#000;opacity:.2">★★★</span>',
    '<div style="background:#222"><span style="color:#444">◆◇</span></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: symbols at 3:1 or more pass`, () => {
  for (const body of [
    '<span style="color:#7a5c00">★★★★☆</span>',
    '<span style="color:#000">→</span>',
    '<div style="background:#222"><span style="color:#fff">●○</span></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

// Text with a letter or a digit is the text-contrast rules', which leave out
// only letter-free text (ACT afw4f7): the two never judge the same text.
test(`${RULE_ID}: text the text-contrast rules judge, separators, emoji and hidden symbols are not this rule's`, () => {
  for (const body of [
    '<p style="color:#ddd">4.5 ★</p>',
    '<p style="color:#ddd">Next →</p>',
    '<p style="color:#ddd">★★★★☆ <b>4</b></p>',
    '<nav><a href="/">Home</a> <span style="color:#ddd">|</span> <a href="/a">A</a></nav>',
    '<span style="color:#ddd">·</span>',
    '<span style="color:#eee">😀</span>',
    '<span style="color:#ddd;display:none">★★★</span>',
    '<span style="color:#ddd;position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">★★★</span>',
    '<svg><text fill="#ddd">★★★</text></svg>',
    '<select><option style="color:#ddd">★★★</option></select>',
    '<span style="color:#ddd">* * *</span>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: symbols whose colours can't be measured are left out`, () => {
  assertRule(
    run(
      '<div style="background-image:linear-gradient(#fff,#eee)"><span style="color:#ddd">★★★</span></div>'
    ),
    RULE_ID,
    'notApplicable',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: the summary in every locale gives the ratio`, () => {
  const occ = run('<span style="color:#f5d76e">★★★★☆</span>', { locale: 'fr' }).checksResults.find(
    (r) => r.ruleId === RULE_ID
  ).occurrences[0];
  assert.match(occ.summary, /« ★★★★☆ », ont un contraste de 1[.,]42:1/);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/symbol-graphic-contrast-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'symbol-graphic-contrast-all-scenarios.html'),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(
    rule.occurrences.map((o) => /id="(sgc_case_\d+)"/.exec(o.html)[1]),
    ['sgc_case_01', 'sgc_case_02', 'sgc_case_03']
  );
});

test(`${RULE_ID}: symbols in an inactive control are left out, as 1.4.11 exempts them (round 11, B11-7)`, () => {
  const B = 'style="color:#ccc;background:#fff;border:1px solid #ccc"';
  for (const body of [
    `<button disabled ${B}>×</button>`,
    `<fieldset disabled><button ${B}>+</button></fieldset>`,
    `<div role="button" tabindex="0" aria-disabled="true" ${B}>×</div>`
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
  // The same control, active, is asked about.
  assertRule(run(`<button ${B}>×</button>`), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: nested symbol elements report each symbol once, on the element that holds it (round 11, B11-11)`, () => {
  const rule = assertRule(
    run('<p><span id="o" style="color:#ccc">★<b id="i">★★</b></span></p>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.deepEqual(
    rule.occurrences.map((o) => [/id="(\w)"/.exec(o.html)[1], o.data.details.symbols]),
    [
      ['o', '★'],
      ['i', '★★']
    ]
  );
});
