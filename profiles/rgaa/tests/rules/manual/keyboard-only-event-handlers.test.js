'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'keyboard-only-event-handlers';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a div with a key handler and no pointer handler is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<div tabindex="0" onkeydown="go()">Go</div>'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'keyboardOnlyHandler',
    element: 'div',
    keyAttrs: ['onkeydown']
  });
  assert.equal(occ.i18n.summaryKey, 'keyboardOnlyEventHandlers_summary_cantTell');
  assert.deepEqual(occ.i18n.params, { element: 'div', attrs: 'onkeydown' });
  assert.equal(occ.summary, 'This <div> has onkeydown but no click or pointer handler.');
});

test(`${RULE_ID}: every key handler is listed, and a hover handler is not a pointer equivalent`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(
      page(
        '<span role="button" tabindex="0" onkeyup="a()" onkeypress="b()" onmouseover="c()">x</span>'
      ),
      RUN
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(rule.occurrences[0].data.details.keyAttrs, ['onkeyup', 'onkeypress']);
});

test(`${RULE_ID}: a click or pointer handler beside the key handler makes it notApplicable`, () => {
  for (const attr of [
    'onclick',
    'ondblclick',
    'onmousedown',
    'onmouseup',
    'onpointerdown',
    'onpointerup',
    'ontouchstart',
    'ontouchend'
  ]) {
    const html = page(`<div tabindex="0" onkeydown="go()" ${attr}="go()">Go</div>`);
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: native interactive elements are notApplicable`, () => {
  for (const body of [
    '<button onkeydown="go()">Go</button>',
    '<a href="/x" onkeydown="go()">Go</a>',
    '<input type="text" aria-label="q" onkeyup="go()">',
    '<select aria-label="s" onkeydown="go()"><option>a</option></select>',
    '<textarea aria-label="t" onkeydown="go()"></textarea>',
    '<details><summary onkeydown="go()">More</summary>x</details>',
    '<div contenteditable="true" onkeydown="go()">Edit</div>',
    '<video controls onkeydown="go()"></video>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: non-native elements that look interactive are still asked about`, () => {
  for (const body of [
    '<a tabindex="0" onkeydown="go()">No href</a>',
    '<input type="hidden" onkeydown="go()"><div tabindex="0" onkeydown="go()">x</div>',
    '<div contenteditable="false" tabindex="0" onkeydown="go()">x</div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
  }
});

test(`${RULE_ID}: empty handlers, hidden content and pages without handlers are notApplicable`, () => {
  for (const body of [
    '<div tabindex="0" onkeydown="  ">x</div>',
    '<div style="display:none" tabindex="0" onkeydown="go()">x</div>',
    '<div hidden onkeydown="go()">x</div>',
    '<p>No handler</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<div tabindex="0" onkeydown="go()">Go</div>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cet élément <div> a onkeydown mais aucun gestionnaire de clic ou de pointage.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<div tabindex="0" onkeydown="go()">Go</div>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 7.3 rollup id run it`, () => {
  const html = page('<div tabindex="0" onkeydown="go()">Go</div>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-7.3' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// WCAG 2.1.1 asks for keyboard access only; RGAA 7.3.1 asks for pointer
// access too.
test(`${RULE_ID}: WCAG 2.1.1 has nothing to ask about a keyboard-only div, RGAA 7.3 asks`, () => {
  const result = runa11yCoreOnHtml(page('<div tabindex="0" onkeydown="go()">Go</div>'), RGAA);
  // 2.1.1's only question on this page is manual-review's page-level prompt,
  // which it asks on every page; this rule is not one of its contributors.
  const wcag = rollup(result, 'wcag-2.1.1-keyboard');
  assert.ok(!wcag.data.details.checksIds.includes(RULE_ID));
  const askedBy = wcag.data.details.contributors
    .filter((c) => c.outcome === 'cantTell')
    .map((c) => c.testId);
  assert.deepEqual(askedBy, ['manual-review']);
  const mouseOnly = result.checksResults.find((r) => r.ruleId === 'mouse-only-event-handlers');
  assert.equal(mouseOnly.outcome, 'notApplicable');
  const rgaa = rollup(result, 'rgaa-4.1.2-7.3');
  assert.equal(rgaa.outcome, 'cantTell');
  assert.ok(rgaa.data.details.checksIds.includes(RULE_ID));
});

test(`${RULE_ID}: WCAG and RGAA both ask about a pointer-only div, through mouse-only-event-handlers`, () => {
  const result = runa11yCoreOnHtml(page('<div onmouseover="show()">Tip</div>'), RGAA);
  assert.equal(
    result.checksResults.find((r) => r.ruleId === 'mouse-only-event-handlers').outcome,
    'cantTell'
  );
  assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'notApplicable');
  assert.equal(rollup(result, 'wcag-2.1.1-keyboard').outcome, 'cantTell');
  assert.equal(rollup(result, 'rgaa-4.1.2-7.3').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['koh_case_01', 'koh_case_02', 'koh_case_03', 'koh_case_04']);
});
