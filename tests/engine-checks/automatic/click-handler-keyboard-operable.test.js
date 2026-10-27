'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'click-handler-keyboard-operable';

function run(body, bodyAttrs = '') {
  return runa11yCoreOnHtml(`<!doctype html><html><body${bodyAttrs}>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

function runWithShadow(body, hostId, shadowHtml) {
  const dom = createDom(`<!doctype html><html><body>${body}</body></html>`);
  dom.window.document.getElementById(hostId).attachShadow({ mode: 'open' }).innerHTML = shadowHtml;
  return runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
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

test(`${RULE_ID}: a control in the host's shadow root or slotted into it delegates the click`, () => {
  assertRule(
    runWithShadow('<x-a id="h" role="button" onclick="a()"></x-a>', 'h', '<button>In</button>'),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    runWithShadow('<x-d id="h" role="button" onclick="a()"></x-d>', 'h', '<a href="/x">In</a>'),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    runWithShadow(
      '<x-f id="h"><button>Slotted</button></x-f>',
      'h',
      '<div role="button" onclick="a()"><slot></slot></div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: a focusable element in the host's shadow root makes it reachable`, () => {
  const rule = assertRule(
    runWithShadow(
      '<x-c id="h" role="button" onclick="a()"></x-c>',
      'h',
      '<div tabindex="0">In</div>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
});

test(`${RULE_ID}: tabindex="-1" is asked about as out of the tab order`, () => {
  const rule = assertRule(
    run('<div id="t" role="button" tabindex="-1" onclick="a()">A</div>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_NOT_IN_TAB_ORDER');
  assert.equal(occ.i18n.summaryKey, 'clickHandlerKeyboardOperable_summary_cantTell_notInTabOrder');
  assert.match(occ.summary, /tab order/);
  assertRule(
    run('<div role="button" onclick="a()"><button tabindex="-1">B</button></div>'),
    RULE_ID,
    'cantTell'
  );
  assertRule(
    run(
      '<div onkeydown="rove(event)"><div role="button" tabindex="-1" onclick="a()">A</div></div>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: display: contents takes no focus, so tabindex="0" does not make it reachable`, () => {
  const rule = assertRule(
    run(
      '<div role="button" tabindex="0" onclick="a()" style="display: contents"><span>A</span></div>'
    ),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE');
});

test(`${RULE_ID}: a control inside a focusable composite widget is only asked about`, () => {
  for (const composite of [
    '<div role="grid" tabindex="0" aria-label="g"><div role="row"><div role="gridcell">X</div></div></div>',
    '<div role="listbox" tabindex="0" aria-label="l"><div role="option">X</div></div>',
    '<div role="toolbar" tabindex="0" aria-label="t">X</div>',
    '<button role="combobox" aria-expanded="false">X</button>'
  ]) {
    const html = composite.replace('X', '<span role="button" onclick="a()">Del</span>');
    const rule = assertRule(run(html), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_NOT_FOCUSABLE');
  }
  assertRule(
    run(
      '<div role="grid" aria-label="g"><div role="row"><div role="gridcell"><span role="button" onclick="a()">Del</span></div></div></div>'
    ),
    RULE_ID,
    'fail'
  );
});

test(`${RULE_ID}: aria-disabled="true" on the element or an ancestor leaves it out`, () => {
  assertRule(
    run(
      '<div role="button" aria-disabled="true" onclick="a()">A</div><div aria-disabled="true"><span role="link" onclick="a()">B</span></div>'
    ),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    run('<div role="button" aria-disabled="false" onclick="a()">A</div>'),
    RULE_ID,
    'fail'
  );
});

test(`${RULE_ID}: a handler that does nothing is left out`, () => {
  for (const code of [
    'return false',
    'return false;',
    ' void(0) ',
    'void 0',
    'event.preventDefault();',
    'event.preventDefault(); return false;',
    // Other spellings, and a label (javascript:) before the statement.
    'void (0)',
    'return(false)',
    'javascript:void(0)',
    'javascript: return false;'
  ]) {
    assertRule(run(`<div role="button" onclick="${code}">A</div>`), RULE_ID, 'notApplicable');
  }
  assertRule(run('<div role="button" onclick="javascript:go()">A</div>'), RULE_ID, 'fail');
  assertRule(run('<div role="button" onclick="return false; a()">A</div>'), RULE_ID, 'fail');
  assertRule(run('<div role="button" onclick="return go()">A</div>'), RULE_ID, 'fail');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const rule = assertRule(run('<div role="button" onclick="a()">A</div>'), RULE_ID, 'fail', {
    minOccurrences: 1
  });
  assert.equal(
    rule.title,
    'Click handlers on elements that are not native controls must work by keyboard'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'This element has role="button" and a click handler, but neither it nor anything in it can take keyboard focus, so a keyboard user cannot reach it.'
  );
});

// A jsdom page with the listener hook installed before the page's own
// script, as listenerHookScript({ early: true }) is in a browser. jsdom's
// selector engine adds key listeners to the window the first time a selector
// runs, so one runs before the hook.
function hooked(body, script) {
  const { JSDOM } = require('jsdom');
  const { listenerHookScript } = require('../../../src/index.js');
  const dom = new JSDOM(`<!doctype html><html><body>${body}</body></html>`, {
    runScripts: 'outside-only'
  });
  dom.window.document.querySelector('*');
  dom.window.eval(listenerHookScript({ early: true }));
  if (script) dom.window.eval(script);
  return runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
}
function occOf(result, id) {
  const rule = result.checksResults.find((c) => c.ruleId === RULE_ID);
  return rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: leans fail when an early hook saw no key or focus listener for a tab stop`, () => {
  const occ = occOf(
    hooked(
      '<div id="a" tabindex="0">Save</div>',
      "document.getElementById('a').onclick = () => {};"
    ),
    'a'
  );
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
  assert.equal(occ.lean.toward, 'fail');
  assert.equal(occ.lean.i18n.whyKey, 'clickHandlerKeyboardOperable_lean_why_noKeyListener');
  // Without the hook, nothing says no listener exists.
  const plain = assertRule(
    run('<div id="a" tabindex="0" onclick="go()">Save</div>'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(plain.occurrences[0].lean, undefined);
  // A page-wide focus listener may add one: no lean.
  const focused = occOf(
    hooked(
      '<div id="a" tabindex="0">Save</div>',
      "document.getElementById('a').onclick = () => {}; document.addEventListener('focusin', () => {});"
    ),
    'a'
  );
  assert.equal(focused.data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
  assert.equal(focused.lean, undefined);
});

test(`${RULE_ID}: out of the tab order, leans fail with no key path and pass for a roving tabindex`, () => {
  const occ = occOf(
    hooked(
      '<div id="a" role="tab" tabindex="-1">A</div>',
      "document.getElementById('a').onclick = () => {};"
    ),
    'a'
  );
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_NOT_IN_TAB_ORDER');
  assert.equal(occ.lean.toward, 'fail');
  assert.equal(
    occ.lean.i18n.whyKey,
    'clickHandlerKeyboardOperable_lean_why_noKeyPathNotInTabOrder'
  );

  const roving = assertRule(
    run(
      '<div role="tablist" aria-label="t"><div role="tab" tabindex="0">One</div><div id="b" role="tab" tabindex="-1" onclick="a()">Two</div></div>'
    ),
    RULE_ID,
    'cantTell'
  );
  const r = roving.occurrences.find((o) => o.html.includes('id="b"'));
  assert.equal(r.data.details.reasonCode, 'CLICK_HANDLER_NOT_IN_TAB_ORDER');
  assert.equal(r.lean.toward, 'pass');
  assert.equal(r.lean.i18n.whyKey, 'clickHandlerKeyboardOperable_lean_why_roving');

  const alone = assertRule(
    run('<div id="t" role="button" tabindex="-1" onclick="a()">A</div>'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(alone.occurrences[0].lean, undefined);
});

test(`${RULE_ID}: a key listener on the widget that owns the item leans pass; one on the document does not`, () => {
  const occ = occOf(
    hooked(
      '<div id="l" role="tablist" aria-label="t"><div id="a" role="tab" tabindex="0">A</div></div>',
      "document.getElementById('a').onclick = () => {}; document.getElementById('l').addEventListener('keydown', () => {});"
    ),
    'a'
  );
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_KEY_LISTENER_ABOVE');
  assert.equal(occ.lean.toward, 'pass');
  assert.equal(occ.lean.i18n.whyKey, 'clickHandlerKeyboardOperable_lean_why_compositeListener');
  const onDoc = occOf(
    hooked(
      '<div role="tablist" aria-label="t"><div id="a" role="tab" tabindex="0">A</div></div>',
      "document.getElementById('a').onclick = () => {}; document.addEventListener('keydown', () => {});"
    ),
    'a'
  );
  assert.equal(onDoc.data.details.reasonCode, 'CLICK_HANDLER_KEY_LISTENER_ABOVE');
  assert.equal(onDoc.lean, undefined);
});

test(`${RULE_ID}: a focus listener only on the document leans fail; one on the element does not`, () => {
  const occ = occOf(
    hooked(
      '<div id="a" role="button" tabindex="0">A</div>',
      "document.getElementById('a').onclick = () => {}; document.addEventListener('focusin', () => {});"
    ),
    'a'
  );
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_FOCUS_LISTENER');
  assert.equal(occ.lean.toward, 'fail');
  assert.equal(occ.lean.i18n.whyKey, 'clickHandlerKeyboardOperable_lean_why_pageFocusListener');
  const own = occOf(
    hooked(
      '<div id="a" role="button" tabindex="0">A</div>',
      "const a = document.getElementById('a'); a.onclick = () => {}; a.addEventListener('focus', () => {});"
    ),
    'a'
  );
  assert.equal(own.data.details.reasonCode, 'CLICK_HANDLER_FOCUS_LISTENER');
  assert.equal(own.lean, undefined);
});

for (const role of ['tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio']) {
  test(`${RULE_ID}: role="${role}" in the tab order fails when an early hook saw no key or focus listener`, () => {
    const result = hooked(
      `<div id="a" role="${role}" tabindex="0">A</div>`,
      "document.getElementById('a').onclick = () => {};"
    );
    const rule = assertRule(result, RULE_ID, 'fail');
    const occ = occOf(result, 'a');
    assert.equal(rule.outcome, 'fail');
    assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_LISTENER');
    assert.equal(occ.data.details.role, role);
    assert.equal(occ.i18n.hintKey, 'clickHandlerKeyboardOperable_hint_fail_noKeyListenerItem');
  });

  test(`${RULE_ID}: role="${role}" with a focus listener is asked about, not failed`, () => {
    // On the element, an ancestor, or the document, as for a button.
    for (const [body, script] of [
      [
        `<div id="a" role="${role}" tabindex="0">A</div>`,
        "const a = document.getElementById('a'); a.onclick = () => {}; a.addEventListener('focus', () => {});"
      ],
      [
        `<div id="p"><div id="a" role="${role}" tabindex="0">A</div></div>`,
        "document.getElementById('a').onclick = () => {}; document.getElementById('p').addEventListener('focusin', () => {});"
      ],
      [
        `<div id="a" role="${role}" tabindex="0">A</div>`,
        "document.getElementById('a').onclick = () => {}; document.addEventListener('focusin', () => {});"
      ]
    ]) {
      const result = hooked(body, script);
      const rule = result.checksResults.find((c) => c.ruleId === RULE_ID);
      assert.equal(rule.outcome, 'cantTell', script);
      assert.equal(occOf(result, 'a').data.details.reasonCode, 'CLICK_HANDLER_FOCUS_LISTENER');
    }
  });

  test(`${RULE_ID}: role="${role}" is judged as before with a key handler, or without the early hook`, () => {
    // An inline key handler, or a key listener on the element: pass.
    assert.equal(
      hooked(
        `<div id="a" role="${role}" tabindex="0" onkeydown="k()">A</div>`,
        "document.getElementById('a').onclick = () => {};"
      ).checksResults.find((c) => c.ruleId === RULE_ID).outcome,
      'pass'
    );
    // A key listener above it only: asked about.
    const above = hooked(
      `<div id="p"><div id="a" role="${role}" tabindex="0">A</div></div>`,
      "document.getElementById('a').onclick = () => {}; document.getElementById('p').addEventListener('keydown', () => {});"
    );
    assert.equal(occOf(above, 'a').data.details.reasonCode, 'CLICK_HANDLER_KEY_LISTENER_ABOVE');
    // Without the hook nothing says no listener exists: asked about, as before.
    const plain = assertRule(
      run(`<div id="a" role="${role}" tabindex="0" onclick="go()">A</div>`),
      RULE_ID,
      'cantTell'
    );
    assert.equal(plain.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
    // Nothing can focus it: not a CONTROL_NOT_FOCUSABLE fail, as before.
    const unfocusable = assertRule(
      run(`<div id="a" role="${role}" onclick="go()">A</div>`),
      RULE_ID,
      'cantTell'
    );
    assert.equal(unfocusable.occurrences[0].data.details.reasonCode, 'CLICK_HANDLER_NOT_FOCUSABLE');
  });
}

test(`${RULE_ID}: a focus listener only on a descendant does not change the fail, for a button or a tab or menu item`, () => {
  for (const role of ['button', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio']) {
    const result = hooked(
      `<div id="a" role="${role}" tabindex="0"><span id="s">A</span></div>`,
      "document.getElementById('a').onclick = () => {}; document.getElementById('s').addEventListener('focus', () => {});"
    );
    assert.equal(occOf(result, 'a').data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_LISTENER', role);
  }
});

test(`${RULE_ID}: other widget roles still only lean fail with no key listener`, () => {
  const occ = occOf(
    hooked(
      '<div id="a" role="option" tabindex="0">A</div>',
      "document.getElementById('a').onclick = () => {};"
    ),
    'a'
  );
  assert.equal(occ.data.details.reasonCode, 'CLICK_HANDLER_NO_KEY_HANDLER');
  assert.equal(occ.lean.toward, 'fail');
});

test(`${RULE_ID}: an unfocusable element leans pass under a focus keeper and fail with only a pointer cursor`, () => {
  const managed = assertRule(
    run(
      '<div tabindex="0" aria-activedescendant="b" aria-label="Tools"><div id="b" role="option" onclick="a()">Cut</div></div>'
    ),
    RULE_ID,
    'cantTell'
  ).occurrences[0];
  assert.equal(managed.data.details.reasonCode, 'CLICK_HANDLER_NOT_FOCUSABLE');
  assert.equal(managed.lean.toward, 'pass');
  assert.equal(managed.lean.i18n.whyKey, 'clickHandlerKeyboardOperable_lean_why_managed');

  const pointer = assertRule(
    run('<div onclick="a()" style="cursor: pointer">More</div>'),
    RULE_ID,
    'cantTell'
  ).occurrences[0];
  assert.equal(pointer.lean.toward, 'fail');
  assert.equal(pointer.lean.i18n.whyKey, 'clickHandlerKeyboardOperable_lean_why_pointerOnly');

  // An option with no focus keeper: a widget role, so no lean.
  const option = assertRule(run('<div role="option" onclick="a()">X</div>'), RULE_ID, 'cantTell')
    .occurrences[0];
  assert.equal(option.data.details.reasonCode, 'CLICK_HANDLER_NOT_FOCUSABLE');
  assert.equal(option.lean, undefined);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/click-handler-keyboard-operable-all-scenarios.html)`, () => {
  const fixtureHtml = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'click-handler-keyboard-operable-all-scenarios.html'),
    'utf8'
  );
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 10, maxOccurrences: 10 });
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
    chko_case_07: 'CLICK_HANDLER_NOT_IN_TAB_ORDER',
    chko_case_08: 'CLICK_HANDLER_NO_KEY_HANDLER',
    chko_case_16: 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE',
    chko_case_17: 'CLICK_HANDLER_NOT_FOCUSABLE'
  });
  for (const n of ['09', '10', '11', '12', '13', '14', '15', '18', '19', '20']) {
    assert.ok(!hasOccurrenceForId(rule, `chko_case_${n}`), `case ${n} not reported`);
  }
});
