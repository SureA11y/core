'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'mouse-only-event-handlers';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no element has a pointer-only handler`, () => {
  const html = `<!doctype html><html><body><div onclick="act()">click only</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when onmouseover/onmouseout has no keyboard equivalent`, () => {
  const html = `<!doctype html><html><body><div onmouseover="show()" onmouseout="hide()">hover</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(
    rule.occurrences[0].data.details.reasonCode,
    'MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT'
  );
  assert.deepStrictEqual(rule.occurrences[0].data.details.mouseAttrs, [
    'onmouseover',
    'onmouseout'
  ]);
});

test(`${RULE_ID}: notApplicable when onmouseover/onmouseout is paired with onfocus/onblur`, () => {
  const html = `<!doctype html><html><body><div onmouseover="show()" onmouseout="hide()" onfocus="show()" onblur="hide()" tabindex="0">hover</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when onmousedown is paired with onkeydown`, () => {
  const html = `<!doctype html><html><body><div onmousedown="drag()" onkeydown="drag()" tabindex="0">drag</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: onfocus on an element that cannot take focus is not an equivalent`, () => {
  const html = `<!doctype html><html><body><div id="m" onmouseover="show()" onfocus="show()">Menu</div></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.ok(hasOccurrenceForId(rule, 'm'));
    assert.equal(
      occ.data.details.reasonCode,
      'MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE'
    );
    assert.deepStrictEqual(occ.data.details.keyboardAttrs, ['onfocus']);
    assert.equal(occ.i18n.summaryKey, 'mouseOnlyEventHandlers_summary_cantTell_notFocusable');
    assert.equal(
      occ.summary,
      'This element has onmouseover and onfocus, but it cannot take keyboard focus, so the keyboard handlers never run.'
    );
  }
});

test(`${RULE_ID}: the same element with tabindex="0" is notApplicable`, () => {
  const html = `<!doctype html><html><body><div onmouseover="show()" onfocus="show()" tabindex="0">Menu</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a key handler counts when a descendant can take focus, a focus handler does not`, () => {
  const keyHtml = `<!doctype html><html><body><div onmouseover="show()" onkeydown="show()"><a href="/x">Menu</a></div></body></html>`;
  assertRule(runa11yCoreOnHtml(keyHtml, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable');

  const focusHtml = `<!doctype html><html><body><div onmouseover="show()" onfocus="show()"><a href="/x">Menu</a></div></body></html>`;
  assertRule(runa11yCoreOnHtml(focusHtml, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: notApplicable when the pointer-only handler is on a hidden element`, () => {
  const html = `<!doctype html><html><body><div onmouseover="show()" hidden>hover</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div onmouseover="show()">hover</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Pointer-only inline event handlers should have a keyboard-reachable equivalent'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/mouse-only-event-handlers-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'mouse-only-event-handlers-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedFlaggedIds = ['moeh_case_01', 'moeh_case_02', 'moeh_case_07', 'moeh_case_09'];
  const expectedNoOccIds = [
    'moeh_case_03',
    'moeh_case_04',
    'moeh_case_05',
    'moeh_case_06',
    'moeh_case_08'
  ];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
