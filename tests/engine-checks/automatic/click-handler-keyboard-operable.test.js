'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'click-handler-keyboard-operable';

function run(body, bodyAttrs = '') {
  return runa11yCoreOnHtml(`<!doctype html><html><body${bodyAttrs}>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no element has an onclick`, () => {
  assertRule(run('<div role="button" tabindex="0">A</div>'), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: a focusable role="button" span with onclick and no key handler is asked about (caisse-epargne.fr cookie link)`, () => {
  // Live on caisse-epargne.fr, this span takes focus and opens the cookie
  // preferences on click, but neither Enter nor Space opens them.
  const rule = assertRule(
    run(
      '<span id="c" class="link manage-my-cookies" role="button" tabindex="0" onclick="utag.gdpr.showConsentPreferences()">Gérer mes cookies</span>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.ok(hasOccurrenceForId(rule, 'c'));
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
  assert.equal(occ.data.details.role, 'button');
  assert.equal(occ.uncertainty.code, 'runtime-dependent');
  assert.equal(occ.i18n.summaryKey, 'clickHandlerKeyboardOperable_summary_cantTell_noKeyHandler');
});

test(`${RULE_ID}: the same span with onkeydown passes`, () => {
  assertRule(
    run('<span role="button" tabindex="0" onclick="a()" onkeydown="a()">A</span>'),
    RULE_ID,
    'pass',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: a key handler on an ancestor, body included, counts`, () => {
  assertRule(
    run('<div onkeyup="k(event)"><div tabindex="0" onclick="a()">A</div></div>'),
    RULE_ID,
    'pass'
  );
  assertRule(
    run('<div tabindex="0" onclick="a()">A</div>', ' onkeydown="k(event)"'),
    RULE_ID,
    'pass'
  );
});

for (const role of ['button', 'link', 'checkbox', 'switch']) {
  test(`${RULE_ID}: fail for role="${role}" with onclick that nothing can focus`, () => {
    const rule = assertRule(
      run(`<div id="f" role="${role}" onclick="a()">A</div>`),
      RULE_ID,
      'fail',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const occ = rule.occurrences[0];
    assert.ok(hasOccurrenceForId(rule, 'f'));
    assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE');
    assert.equal(occ.data.details.role, role);
    assert.match(occ.summary, new RegExp(`role="${role}"`));
  });
}

test(`${RULE_ID}: a role="button" operated from an aria-activedescendant ancestor is only asked about`, () => {
  const rule = assertRule(
    run(
      '<div tabindex="0" aria-activedescendant="b" aria-label="Tools"><div id="b" role="button" onclick="a()">Cut</div></div>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_NOT_FOCUSABLE');
  assert.equal(rule.occurrences[0].uncertainty.code, 'equivalence-unknown');
});

test(`${RULE_ID}: an unfocusable element with no role is asked about only when it shows a pointer cursor`, () => {
  assertRule(run('<div onclick="a()" style="cursor: pointer">More</div>'), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assertRule(run('<span onclick="track()">Intro</span>'), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: a container delegating to a native control is out of scope`, () => {
  for (const inner of [
    '<button type="button">Save</button>',
    '<a href="/x">Go</a>',
    '<input type="checkbox" aria-label="x">',
    '<details><summary>More</summary>x</details>'
  ]) {
    assertRule(
      run(`<div role="button" onclick="route(event)">${inner}</div>`),
      RULE_ID,
      'notApplicable'
    );
  }
});

test(`${RULE_ID}: a descendant that takes focus but does not fire click from the keyboard is no delegation`, () => {
  const rule = assertRule(
    run('<div role="button" onclick="a()"><input type="text" aria-label="q"></div>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
  // A disabled button takes no focus, so it delegates nothing.
  assertRule(
    run('<div role="button" onclick="a()"><button disabled>Save</button></div>'),
    RULE_ID,
    'fail'
  );
});

test(`${RULE_ID}: native controls, labels, body and html are out of scope`, () => {
  assertRule(
    run(
      '<button onclick="a()">A</button><a href="/x" onclick="a()">B</a><label onclick="t()">C <input></label><input type="text" onclick="this.select()" aria-label="d"><summary onclick="a()">E</summary>',
      ' onclick="closeMenus()"'
    ),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    runa11yCoreOnHtml('<!doctype html><html onclick="a()"><body><p>x</p></body></html>', {
      runOnly: [RULE_ID]
    }),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: hidden elements are left out`, () => {
  assertRule(
    run(
      '<div role="button" onclick="a()" hidden>A</div><div style="display:none"><span role="link" onclick="a()">B</span></div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const rule = assertRule(run('<div role="button" onclick="a()">A</div>'), RULE_ID, 'fail', {
    minOccurrences: 1
  });
  assert.equal(
    rule.title,
    'Inline click handlers on elements that are not native controls must work by keyboard'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'This element has role="button" and an onclick handler, but neither it nor anything in it can take keyboard focus, so a keyboard user cannot reach it.'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/click-handler-keyboard-operable-all-scenarios.html)`, () => {
  const fixtureHtml = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'click-handler-keyboard-operable-all-scenarios.html'),
    'utf8'
  );
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });
  const tiers = {};
  for (const o of rule.occurrences) {
    const m = /id="(chko_case_\d+)"/.exec(o.html || '');
    if (m) tiers[m[1]] = o.data.details.reasonCode;
  }
  assert.deepStrictEqual(tiers, {
    chko_case_01: 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE',
    chko_case_02: 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE',
    chko_case_03: 'CLICK_HANDLER_NO_KEY_HANDLER',
    chko_case_04: 'CLICK_HANDLER_NOT_FOCUSABLE',
    chko_case_05: 'CLICK_HANDLER_NOT_FOCUSABLE',
    chko_case_06: 'CLICK_HANDLER_NOT_FOCUSABLE',
    chko_case_07: 'CLICK_HANDLER_NO_KEY_HANDLER',
    chko_case_08: 'CLICK_HANDLER_NO_KEY_HANDLER'
  });
  for (const n of ['09', '10', '11', '12', '13', '14', '15']) {
    assert.ok(!hasOccurrenceForId(rule, `chko_case_${n}`), `case ${n} not reported`);
  }
});
