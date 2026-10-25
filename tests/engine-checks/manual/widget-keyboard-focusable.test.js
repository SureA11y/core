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

const RULE_ID = 'widget-keyboard-focusable';

function run(body) {
  return runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

function reasonCodes(rule) {
  return (rule.occurrences || []).map((o) => o.data.details.reasonCode);
}

test(`${RULE_ID}: notApplicable without widget roles`, () => {
  assertRule(
    run('<button>Save</button><div role="region" aria-label="x">x</div>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass when the widget is in the tab order`, () => {
  assertRule(run('<div role="button" tabindex="0">Save</div>'), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: cantTell for a widget that cannot take focus`, () => {
  const rule = assertRule(run('<div role="button" id="a">Save</div>'), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const d = rule.occurrences[0].data.details;
  assert.equal(d.reasonCode, 'WIDGET_NOT_FOCUSABLE');
  assert.equal(d.role, 'button');
  assert.equal(d.focusable, false);
  assert.equal(rule.occurrences[0].uncertainty, undefined, 'a manual rule carries no uncertainty');
});

test(`${RULE_ID}: cantTell for a widget focusable only from script`, () => {
  const rule = assertRule(
    run('<div role="switch" aria-checked="false" tabindex="-1">Wi-Fi</div>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasonCodes(rule), ['WIDGET_NOT_IN_TAB_ORDER']);
  assert.equal(rule.occurrences[0].data.details.focusable, true);
});

test(`${RULE_ID}: a widget holding a tabbable element passes`, () => {
  assertRule(
    run('<div role="combobox" aria-expanded="false"><input aria-label="City"></div>'),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: composite with a roving tab stop, or aria-activedescendant, passes`, () => {
  assertRule(
    run(
      '<div role="radiogroup" aria-label="Size"><div role="radio" aria-checked="true" tabindex="0">S</div><div role="radio" aria-checked="false" tabindex="-1">M</div></div>'
    ),
    RULE_ID,
    'pass'
  );
  assertRule(
    run(
      '<ul role="listbox" aria-label="Fruit" tabindex="0" aria-activedescendant="o1"><li role="option" id="o1">Apple</li></ul>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: composite with no tab stop is asked about once, not per item`, () => {
  const rule = assertRule(
    run(
      '<div role="grid" aria-label="Seats"><div role="row"><div role="gridcell" tabindex="-1">A1</div><div role="gridcell"><div role="button">Pick</div></div></div></div>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const d = rule.occurrences[0].data.details;
  assert.equal(d.reasonCode, 'COMPOSITE_NO_TAB_STOP');
  assert.equal(d.role, 'grid');
  assert.equal(d.scriptFocusable, true);
});

test(`${RULE_ID}: a popup another element controls gets focus from it`, () => {
  assertRule(
    run(
      '<button aria-haspopup="listbox" aria-controls="l">Pick</button><ul role="listbox" id="l" aria-label="Fruit"><li role="option">Apple</li></ul>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a submenu is judged through its menubar`, () => {
  assertRule(
    run(
      '<ul role="menubar" aria-label="Main"><li role="menuitem" tabindex="0">File<ul role="menu"><li role="menuitem" tabindex="-1">Open</li></ul></li></ul>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: a host with aria-activedescendant must take focus to manage its items`, () => {
  const rule = assertRule(
    run(
      '<div aria-activedescendant="c"><div id="c" role="checkbox" aria-checked="false">Agree</div></div>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.deepEqual(reasonCodes(rule), [
    'ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE',
    'WIDGET_NOT_FOCUSABLE'
  ]);
  assertRule(
    run(
      '<div tabindex="0" aria-activedescendant="c"><div id="c" role="checkbox" aria-checked="false">Agree</div></div>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a composite's aria-activedescendant is a tab stop only when it is in the tab order`, () => {
  const rule = assertRule(
    run(
      '<div role="tree" aria-label="t" tabindex="-1" aria-activedescendant="i"><div id="i" role="treeitem">a</div></div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasonCodes(rule), ['COMPOSITE_NO_TAB_STOP']);
});

test(`${RULE_ID}: disabled, aria-hidden and onclick widgets are left out`, () => {
  assertRule(
    run(
      '<div role="button" aria-disabled="true">A</div>' +
        '<div aria-disabled="true"><div role="checkbox" aria-checked="false">B</div></div>' +
        '<button role="switch" aria-checked="false" disabled>C</button>' +
        '<div role="button" aria-hidden="true">D</div>' +
        '<div role="button" onclick="go()">E</div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: a widget in an open shadow root is judged`, () => {
  const dom = createDom('<!doctype html><html lang="en"><body><div id="host"></div></body></html>');
  dom.window.document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML =
    '<div role="button">In shadow</div>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepEqual(reasonCodes(rule), ['WIDGET_NOT_FOCUSABLE']);
});

test(`${RULE_ID}: leans`, async (t) => {
  const occOf = (body, code) =>
    assertRule(run(body), RULE_ID, 'cantTell').occurrences.find(
      (o) => o.data.details.reasonCode === code
    );
  await t.test(
    'a widget that cannot take focus leans fail, unless a tab stop has its role and name',
    () => {
      const lone = occOf('<div role="button">Save</div>', 'WIDGET_NOT_FOCUSABLE');
      assert.equal(lone.lean.toward, 'fail');
      assert.equal(lone.lean.i18n.whyKey, 'widgetKeyboardFocusable_lean_why_notFocusable');
      const twin = occOf(
        '<div role="button">Save</div><button>Save</button>',
        'WIDGET_NOT_FOCUSABLE'
      );
      assert.equal(twin.lean, undefined);
    }
  );
  await t.test('out of the tab order, a twin in it leans pass; without the hook, no lean', () => {
    const twin = occOf(
      '<div role="button" tabindex="-1">Save</div><button>Save</button>',
      'WIDGET_NOT_IN_TAB_ORDER'
    );
    assert.equal(twin.lean.toward, 'pass');
    assert.equal(twin.lean.i18n.whyKey, 'widgetKeyboardFocusable_lean_why_duplicate');
    assert.equal(
      occOf('<div role="button" tabindex="-1">Save</div>', 'WIDGET_NOT_IN_TAB_ORDER').lean,
      undefined
    );
  });
  await t.test(
    'out of the tab order, with an early hook and no key listener above, leans fail',
    () => {
      const { JSDOM } = require('jsdom');
      const { listenerHookScript } = require('../../../src/index.js');
      const dom = new JSDOM(
        '<!doctype html><html lang="en"><body><div role="button" tabindex="-1">Save</div></body></html>',
        { runScripts: 'outside-only' }
      );
      // jsdom's selector engine adds key listeners to the window the first
      // time a selector runs, so one runs before the hook.
      dom.window.document.querySelector('*');
      dom.window.eval(listenerHookScript({ early: true }));
      const occ = assertRule(
        runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false }),
        RULE_ID,
        'cantTell'
      ).occurrences[0];
      assert.equal(occ.data.details.reasonCode, 'WIDGET_NOT_IN_TAB_ORDER');
      assert.equal(occ.lean.toward, 'fail');
      assert.equal(occ.lean.i18n.whyKey, 'widgetKeyboardFocusable_lean_why_noKeyListener');
    }
  );
  await t.test(
    'a composite with no tab stop leans fail, unless a popup trigger sits before it',
    () => {
      const lone = occOf(
        '<div role="listbox" aria-label="l"><div role="option">A</div></div>',
        'COMPOSITE_NO_TAB_STOP'
      );
      assert.equal(lone.lean.toward, 'fail');
      assert.equal(lone.lean.i18n.whyKey, 'widgetKeyboardFocusable_lean_why_compositeNoTabStop');
      const popup = occOf(
        '<button aria-haspopup="menu">More</button><div role="menu" aria-label="m"><div role="menuitem">A</div></div>',
        'COMPOSITE_NO_TAB_STOP'
      );
      assert.equal(popup.lean, undefined);
    }
  );
  await t.test('an aria-activedescendant host that cannot take focus leans fail', () => {
    const occ = occOf(
      '<div aria-activedescendant="o1"><div id="o1">A</div></div>',
      'ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE'
    );
    assert.equal(occ.lean.toward, 'fail');
    assert.equal(occ.lean.i18n.whyKey, 'widgetKeyboardFocusable_lean_why_activedescendantHost');
  });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/widget-keyboard-focusable-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'widget-keyboard-focusable-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });

  const byId = new Map(
    rule.occurrences.map((o) => [o.html.match(/id="(wkf_case_\d+)"/)[1], o.data.details.reasonCode])
  );
  assert.deepEqual(Object.fromEntries([...byId].sort()), {
    wkf_case_09: 'WIDGET_NOT_FOCUSABLE',
    wkf_case_10: 'WIDGET_NOT_FOCUSABLE',
    wkf_case_11: 'WIDGET_NOT_FOCUSABLE',
    wkf_case_12: 'WIDGET_NOT_IN_TAB_ORDER',
    wkf_case_13: 'COMPOSITE_NO_TAB_STOP',
    wkf_case_14: 'COMPOSITE_NO_TAB_STOP',
    wkf_case_22: 'ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE',
    wkf_case_23: 'COMPOSITE_NO_TAB_STOP'
  });
});
