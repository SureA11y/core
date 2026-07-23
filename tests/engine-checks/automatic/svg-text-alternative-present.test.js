'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-svg-text-alternative-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
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

test(`${RULE_ID}: fail when applicable <svg role="img"> has no title/desc and no aria name`, () => {
  const html = `<!doctype html><html><body>
    <svg id="bad1" role="img" xmlns="http://www.w3.org/2000/svg"></svg>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad1'));
});

test(`${RULE_ID}: fail when applicable <svg role="img"> has only <desc> (no <title>/aria name) — SVG-AAM §7.1: desc only contributes to the accessible description, never the name`, () => {
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
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'svg-text-alternative-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 12, maxOccurrences: 12 });

  const expectedFailIds = [
    'svg_case_01',
    'svg_case_03',  // <desc> alone never provides a name (SVG-AAM §7.1)
    'svg_case_06',
    'svg_case_07',
    'svg_case_09',
    'svg_case_10',
    'svg_case_12',
    'svg_case_15',
    'svg_case_21',  // <title> not first child does not count
    'svg_case_22',  // <desc> as first child still doesn't count as a name
    'svg_case_23',  // empty <title> + <desc> second: desc still doesn't count as a name
    'svg_case_24'   // <desc> misplaced (not first, not pair-second) does not count
  ];

  const expectedNoOccIds = [
    'svg_case_02',
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

  assert.strictEqual(rule.title, '<svg> doit fournir une alternative textuelle');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments <svg> en ligne fournissent une alternative textuelle via un élément <title> ou un nom ARIA (un élément <desc> seul ne suffit pas).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Alternative textuelle manquante pour <svg>.');
  assert.strictEqual(
    occ.hint,
    'Fournissez un élément <title> avec du texte, ou un nom ARIA (aria-label/aria-labelledby) — un élément <desc> seul ne fournit pas de nom accessible.'
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
  assert.strictEqual(occ.summary, 'Missing text alternative for <svg>.');
  assert.strictEqual(
    occ.hint,
    'Provide a <title> element with text, or an ARIA name (aria-label/aria-labelledby) — a <desc> element alone does not provide an accessible name.'
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
