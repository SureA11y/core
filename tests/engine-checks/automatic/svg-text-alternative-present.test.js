'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'svg-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no <svg>`, () => {
  const html = `<!doctype html><html><body><p>No svg</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when applicable <svg> has <title> text`, () => {
  const html = `<!doctype html><html><body>
    <svg id="ok_title" role="img" xmlns="http://www.w3.org/2000/svg"><title>Close</title></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when applicable <svg> has aria-label`, () => {
  const html = `<!doctype html><html><body>
    <svg id="ok_al" role="img" aria-label="Close" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when applicable <svg> has aria-labelledby`, () => {
  const html = `<!doctype html><html><body>
    <span id="lbl">Settings</span>
    <svg id="ok_lb" role="img" aria-labelledby="lbl" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <svg role="graphics-symbol"> has no title/desc and no aria name`, () => {
  const html = `<!doctype html><html><body>
    <svg id="bad_gs" role="graphics-symbol" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad_gs'));
});

test(`${RULE_ID}: pass when applicable <svg role="graphics-symbol"> has <title> text`, () => {
  const html = `<!doctype html><html><body>
    <svg id="ok_gs" role="graphics-symbol" xmlns="http://www.w3.org/2000/svg"><title>Close</title></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <svg role="graphics-document"> has no title/desc and no aria name`, () => {
  const html = `<!doctype html><html><body>
    <svg id="bad_gd" role="graphics-document" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad_gd'));
});

test(`${RULE_ID}: pass when applicable <svg role="graphics-document"> has <title> text`, () => {
  const html = `<!doctype html><html><body>
    <svg id="ok_gd" role="graphics-document" xmlns="http://www.w3.org/2000/svg"><title>Chart</title></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when applicable <svg role="img"> has no title/desc and no aria name`, () => {
  const html = `<!doctype html><html><body>
    <svg id="bad1" role="img" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad1'));
});

test(`${RULE_ID}: fail when applicable <svg role="img"> has only <desc> (no <title>/aria name): SVG-AAM §7.1 says desc only contributes to the accessible description, never the name`, () => {
  const html = `<!doctype html><html><body>
    <svg id="desc_only" role="img" xmlns="http://www.w3.org/2000/svg"><desc>Settings icon</desc></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'desc_only'));
});

test(`${RULE_ID}: pass when applicable <svg role="img"> has both <title> and <desc>`, () => {
  const html = `<!doctype html><html><body>
    <svg id="title_and_desc" role="img" xmlns="http://www.w3.org/2000/svg"><title>Settings</title><desc>Longer description of the settings icon</desc></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when only ineligible svgs exist (aria-hidden and not tabbable)`, () => {
  const html = `<!doctype html><html><body>
    <svg id="ah" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden but tabbable is applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <svg id="focus_ah" role="img" aria-hidden="true" tabindex="0" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'focus_ah'));
});

test(`${RULE_ID}: role=presentation not focusable is excluded and does not cause pass (=> notApplicable when only those)`, () => {
  const html = `<!doctype html><html><body>
    <svg id="pres_nf" role="presentation" xmlns="http://www.w3.org/2000/svg"><title>Decorative</title></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role=presentation but focusable is NOT excluded and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <svg id="pres_focus" role="presentation" tabindex="0" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'pres_focus'));
});

test(`${RULE_ID}: inert subtree is ineligible and does not cause pass (=> notApplicable when only inert svgs)`, () => {
  const html = `<!doctype html><html><body>
    <div inert>
      <svg id="inert_svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: IDREF-referenced (eligible element references aria-hidden svg) becomes applicable and fails if unnamed`, () => {
  const html = `<!doctype html><html><body>
    <div id="host" aria-labelledby="svg_ref">Host</div>
    <svg id="svg_ref" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'svg_ref'));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/svg-text-alternative-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'svg-text-alternative-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 14, maxOccurrences: 14 });

  const expectedFailIds = [
    'svg_case_01',
    'svg_case_03', // <desc> alone never provides a name (SVG-AAM §7.1)
    'svg_case_06',
    'svg_case_07',
    'svg_case_09',
    'svg_case_10',
    'svg_case_12',
    'svg_case_15',
    'svg_case_27', // an empty first <title> names nothing, though another follows (#118)
    'svg_case_22', // <desc> as first child still doesn't count as a name
    'svg_case_23', // empty <title> + <desc> second: desc still doesn't count as a name
    'svg_case_24', // <desc> misplaced (not first, not pair-second) does not count
    'svg_case_25', // role="graphics-symbol" is applicability intent
    'svg_case_26' // role="graphics-document" is applicability intent
  ];

  const expectedNoOccIds = [
    'svg_case_02',
    'svg_case_21', // a direct child <title> counts wherever it is (#118)
    'svg_case_04',
    'svg_case_05',
    'svg_case_08',
    'svg_case_11',
    'svg_case_13',
    'svg_case_14',
    'svg_case_16'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  for (const occ of rule.occurrences) {
    assert.ok(
      typeof occ.summary === 'string' && occ.summary.includes('<svg>'),
      'Expected <svg> in occurrence.summary'
    );
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><svg role="img" xmlns="http://www.w3.org/2000/svg"></svg></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<svg> doit fournir un équivalent textuel');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <svg> en ligne fournissent un équivalent textuel via un élément <title> ou un nom ARIA (un élément <desc> seul ne suffit pas).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Cet élément <svg> n’a pas d’équivalent textuel.');
  assert.strictEqual(
    occ.hint,
    'Ajoutez un <title> contenant du texte, ou nommez-le avec aria-label ou aria-labelledby. Un <desc> seul ne lui donne pas de nom.'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><svg role="img" xmlns="http://www.w3.org/2000/svg"></svg></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<svg> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that inline <svg> elements provide a text alternative via a <title> element or an ARIA name (a <desc> element alone does not count).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'This <svg> has no text alternative.');
  assert.strictEqual(
    occ.hint,
    'Add a <title> with text, or name it with aria-label or aria-labelledby. A <desc> alone does not give it a name.'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body><svg role="img" xmlns="http://www.w3.org/2000/svg"></svg></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<svg> must provide a text alternative');
  assert.strictEqual(
    rule.description,
    'Checks that inline <svg> elements provide a text alternative via a <title> element or an ARIA name (a <desc> element alone does not count).'
  );
});

test(`${RULE_ID}: the role attribute is a fallback list: role="foo none" is excluded when not focusable (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><svg role="foo none" aria-label=""></svg></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an upper-case role resolves too: role="IMG" signals intent (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><svg role="IMG"></svg></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

// SVG-AAM names an SVG element by "a direct child title element" and
// describes it by "a direct child desc element", in no particular position;
// the first one counts (#118).
test(`${RULE_ID}: a direct child <title> names the svg wherever it is among the children`, () => {
  for (const markup of [
    '<svg role="img"><circle r="4"/><title>Star</title></svg>',
    '<svg role="img"><desc>A yellow star</desc><title>Star</title><circle r="4"/></svg>',
    '<svg><g><circle r="4"/></g><title>Star</title></svg>'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an empty first <title>, a <title> in a group, or a <desc> alone still names nothing`, () => {
  for (const markup of [
    '<svg role="img"><title></title><circle r="4"/><title>Star</title></svg>',
    '<svg role="img"><g><title>Star</title><circle r="4"/></g></svg>',
    '<svg><circle r="4"/><desc>A yellow star</desc></svg>'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

// An empty aria-label names nothing, so it is no sign the image is meant to be
// conveyed: alone it leaves the <svg> out, and with a role it does not name it.
test(`${RULE_ID}: a blank aria-label or aria-labelledby alone does not make an <svg> applicable`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body>
      <svg aria-label=""></svg>
      <svg aria-label="   "></svg>
      <svg aria-labelledby=""></svg>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role="img" with a blank aria-label still fails`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><svg id="blank" role="img" aria-label=" "></svg></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'blank'));
});

test(`${RULE_ID}: the hint says which <title>, <text> or alt the author meant as its name`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
  <svg id="s1" role="img"><g><title>Logo</title><path d="M0 0h1v1H0z"></path></g></svg>
  <svg id="s2" role="img"><title></title><desc>Sales by month</desc></svg>
  <svg id="s3" role="img"><title> </title></svg>
  <svg id="s4" role="img"><text x="0" y="10">Sales up 20%</text></svg>
  <svg id="s5" role="img" alt="Logo"></svg>
  <svg id="s6" role="img" aria-labelledby="nope"></svg>
  <svg id="s7" role="img"></svg>
</body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 7,
    maxOccurrences: 7
  });
  const occ = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  assert.equal(occ('s1').i18n.hintKey, 'svg_textAltPresent_hint_fail_nestedTitle');
  assert.equal(
    occ('s1').hint,
    'Its <title> ("Logo") is inside a <g>, where it names that element, not the <svg>: only a <title> that is a direct child of the <svg> names it. Move it there.'
  );
  assert.equal(occ('s1').data.details.nameCause.cause, 'nestedTitle');
  assert.equal(occ('s2').i18n.hintKey, 'svg_textAltPresent_hint_fail_emptyTitleDesc');
  assert.equal(
    occ('s2').hint,
    'Its <title> is empty, and the <desc> ("Sales by month") gives a description, not a name. Put the name in the <title>.'
  );
  assert.equal(occ('s2').data.details.nameCause.cause, 'emptyTitle');
  assert.equal(occ('s3').i18n.hintKey, 'svg_textAltPresent_hint_fail_emptyTitle');
  assert.equal(occ('s3').hint, 'Its <title> is empty, so it gives no name. Put the name in it.');
  assert.equal(occ('s4').i18n.hintKey, 'svg_textAltPresent_hint_fail_textInside');
  assert.equal(
    occ('s4').hint,
    'Its <text> "Sales up 20%" is drawn on screen, but text inside an <svg> does not name it. Add a <title> or aria-label with that text.'
  );
  assert.equal(occ('s4').data.details.nameCause.cause, 'textInside');
  assert.equal(occ('s5').i18n.hintKey, 'svg_textAltPresent_hint_fail_alt');
  assert.equal(
    occ('s5').hint,
    'Its alt="Logo" does nothing: an <svg> has no alt attribute. Add a <title> child with that text, or aria-label="Logo".'
  );
  assert.equal(occ('s5').data.details.nameCause.cause, 'altOnSvg');
  assert.equal(occ('s6').i18n.hintKey, 'nameCause_hint_labelledbyMissing');
  assert.equal(
    occ('s6').hint,
    'Its aria-labelledby points to "nope", which no element on the page has, so it gives no name. Point it at the id of the element whose text names it, or name it with aria-label.'
  );
  assert.equal(occ('s7').i18n.hintKey, 'svg_textAltPresent_hint_fail');
  assert.equal(
    occ('s7').hint,
    'Add a <title> with text, or name it with aria-label or aria-labelledby. A <desc> alone does not give it a name.'
  );
});
