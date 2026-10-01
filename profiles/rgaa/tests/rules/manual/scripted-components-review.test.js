'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'scripted-components-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const ROOT = path.join(__dirname, '../../../../..');

function page(body, head = '') {
  return `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body>${body}</body></html>`;
}

const SCRIPT = '<script src="/js/app.js"></script>';

function run(html, engineOptions) {
  return runa11yCoreOnHtml(html, engineOptions ? { ...RUN, engineOptions } : RUN);
}

function reasons(rule) {
  return rule.occurrences.map((o) => o.data.details.reasonCode);
}

test(`${RULE_ID}: a page with no script is notApplicable`, () => {
  const body =
    '<main><h1>Opening hours</h1><p>Monday to Friday.</p><a href="/contact">Contact</a><button>Print</button><div role="tree"></div></main>';
  assertRule(run(page(body)), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});

test(`${RULE_ID}: data blocks are not script`, () => {
  const head =
    '<script type="application/ld+json">{"@type":"Organization"}</script>' +
    '<script type="importmap">{"imports":{}}</script>' +
    '<script type="text/template"><div onclick="x()"></div></script>' +
    '<script type="speculationrules">{}</script>';
  assertRule(run(page('<p>x</p>', head)), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: a page with script and no candidate still asks, once, at the scan root`, () => {
  const rule = assertRule(run(page('<p>Text only.</p>', SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.selector, 'html');
  assert.deepEqual(occ.data.details, { reasonCode: 'pageReview', scriptEvidence: 'scriptElement' });
  assert.equal(occ.i18n.summaryKey, 'scriptedComponentsReview_summary_cantTell_page');
  assert.match(occ.summary, /cannot see behaviour attached from script files/);
  assert.match(occ.hint, /7\.1\.1.*7\.1\.2.*7\.1\.3/);
  assert.match(occ.hint, /starting point, not a complete list/);
});

test(`${RULE_ID}: each sign of script alone makes the rule ask`, () => {
  const cases = [
    ['scriptElement', page('<p>x</p>', '<script>var a = 1;</script>')],
    ['scriptElement', page('<p>x</p><script type="module" src="app.js"></script>')],
    ['scriptElement', page('<p>x</p><script type="">1</script>')],
    ['scriptElement', page('<p>x</p><script type="text/javascript; charset=utf-8">1</script>')],
    ['inlineHandler', page('<img src="a.png" alt="Logo" onload="init()">')],
    ['inlineHandler', page('<body onload="init()"><p>x</p></body>')],
    ['javascriptUrl', page('<a href="javascript:void(0)">Open</a>')],
    ['javascriptUrl', page('<a href="  JavaScript:open()">Open</a>')],
    ['javascriptUrl', page('<form action="javascript:send()"><button>Send</button></form>')],
    ['customElement', page('<date-picker></date-picker>')]
  ];
  for (const [evidence, html] of cases) {
    const rule = assertRule(run(html), RULE_ID, 'cantTell');
    assert.equal(rule.occurrences[0].data.details.scriptEvidence, evidence, html);
  }
});

test(`${RULE_ID}: a script inside an open shadow root counts`, () => {
  const dom = createDom(page('<div id="h"></div>'));
  dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML =
    '<span onclick="x()">Go</span>';
  const result = runa11yCoreOnDom(dom, RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell');
  assert.equal(rule.occurrences[0].data.details.scriptEvidence, 'inlineHandler');
});

test(`${RULE_ID}: the engine's own files are not counted as page script`, () => {
  const bundleHead = fs.readFileSync(path.join(ROOT, 'surea11y.browser.js'), 'utf8').slice(0, 800);
  const localeHead = fs.readFileSync(path.join(ROOT, 'surea11y.i18n.fr.js'), 'utf8').slice(0, 400);
  const core = fs.readFileSync(path.join(ROOT, 'src/core.js'), 'utf8');
  const chunkStart = core.indexOf('// SELF-CONTAINED in-page runner');
  assert.ok(chunkStart > 0);
  const chunkHead = core.slice(chunkStart, chunkStart + 400);
  const escape = (s) => s.replace(/<\//g, '<\\/');

  const heads = [
    '<script src="/node_modules/@surea11y/core/surea11y.browser.js"></script>' +
      '<script src="https://cdn.example/surea11y.i18n.de.js?v=2"></script>',
    `<script>${escape(bundleHead)}</script><script>${escape(localeHead)}</script>`,
    `<script>${escape(chunkHead)}</script>`
  ];
  for (const head of heads) {
    assertRule(run(page('<p>x</p>', head)), RULE_ID, 'notApplicable');
  }

  // A script written into the page to call the engine is page script.
  const harness =
    '<script src="surea11y.browser.js"></script>' +
    '<script>a11ycore.runa11yCoreInPage(location.href, null, {}, null);</script>';
  assertRule(run(page('<p>x</p>', harness)), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: widget roles the element does not have natively are listed (widgetRole)`, () => {
  const body =
    '<div role="tab">Tab</div><span role="checkbox" aria-checked="false">Opt</span>' +
    '<a href="#" role="button">Print</a><ul role="menu"><li role="menuitem">New</li></ul>';
  const rule = assertRule(run(page(body, SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 6,
    maxOccurrences: 6
  });
  assert.deepEqual(reasons(rule), [
    'pageReview',
    'widgetRole',
    'widgetRole',
    'widgetRole',
    'widgetRole',
    'widgetRole'
  ]);
  assert.deepEqual(rule.occurrences[3].data.details, {
    reasonCode: 'widgetRole',
    element: 'a',
    role: 'button'
  });
  assert.equal(
    rule.occurrences[1].summary,
    'This <div> has role="tab", a widget role it does not have natively.'
  );
});

test(`${RULE_ID}: tabindex >= 0 on an element that is not focusable is listed (focusableNonNative)`, () => {
  const body =
    '<div tabindex="0">Card</div><li tabindex="3">Item</li><span tabindex="-1">Target</span>';
  const rule = assertRule(run(page(body, SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(
    rule.occurrences.slice(1).map((o) => o.data.details),
    [
      { reasonCode: 'focusableNonNative', element: 'div', tabindex: '0' },
      { reasonCode: 'focusableNonNative', element: 'li', tabindex: '3' }
    ]
  );
});

test(`${RULE_ID}: inline interaction handlers on non-native elements are listed (inlineHandler)`, () => {
  const body =
    '<div onclick="open()">More</div><span onkeydown="k(event)">Key</span><img src="a.png" alt="A" onload="x()">';
  const rule = assertRule(run(page(body)), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(
    rule.occurrences.slice(1).map((o) => o.data.details),
    [
      { reasonCode: 'inlineHandler', element: 'div', attribute: 'onclick' },
      { reasonCode: 'inlineHandler', element: 'span', attribute: 'onkeydown' }
    ]
  );
});

test(`${RULE_ID}: editable elements that are not form fields are listed (contentEditable)`, () => {
  const body =
    '<div contenteditable>A</div><p contenteditable="plaintext-only">B</p><div contenteditable="false">C</div>';
  const rule = assertRule(run(page(body, SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(reasons(rule), ['pageReview', 'contentEditable', 'contentEditable']);
});

test(`${RULE_ID}: state attributes are listed, native elements included (stateAttribute)`, () => {
  const body =
    '<button type="button" aria-expanded="false">Menu</button><button aria-pressed="true">Bold</button>' +
    '<a href="/a" aria-haspopup="true">Account</a><div aria-controls="p">Toggle</div><div id="p"></div>';
  const rule = assertRule(run(page(body, SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 5,
    maxOccurrences: 5
  });
  assert.deepEqual(
    rule.occurrences.slice(1).map((o) => o.data.details.attribute),
    ['aria-expanded', 'aria-pressed', 'aria-haspopup', 'aria-controls']
  );
});

test(`${RULE_ID}: native elements are not listed`, () => {
  const body =
    '<button role="button">Save</button><a href="/h" role="link" onclick="t()">Help</a>' +
    '<input type="checkbox" role="checkbox" onchange="c()" aria-label="Keep">' +
    '<input type="text" tabindex="0" aria-label="Name"><select tabindex="0" aria-label="City"><option>Paris</option></select>' +
    '<textarea contenteditable aria-label="Note"></textarea><progress role="progressbar" value="1" max="2"></progress>' +
    '<dialog role="dialog" open>Hi</dialog>';
  assertRule(run(page(body, SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: an element is listed once, under the first reason that matches`, () => {
  const body =
    '<div role="switch" aria-checked="false" tabindex="0" onclick="t()" aria-controls="x">Mode</div>' +
    '<span tabindex="0" contenteditable>Edit</span>';
  const rule = assertRule(run(page(body)), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(reasons(rule), ['pageReview', 'widgetRole', 'contentEditable']);
});

test(`${RULE_ID}: hidden content is skipped, like the other rules`, () => {
  const body = '<div role="menu" hidden>Closed</div><div style="display:none" tabindex="0">x</div>';
  assertRule(run(page(body, SCRIPT)), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('<div role="tab">A</div>', SCRIPT), { locale: 'fr', runOnly: RUN.runOnly }),
    RULE_ID,
    'cantTell'
  );
  assert.match(rule.occurrences[0].summary, /technologies d’assistance|fichiers de script/);
  assert.equal(
    rule.occurrences[1].summary,
    'Cet élément <div> a role="tab", un rôle de composant d’interface qu’il n’a pas nativement.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<div role="tab">A</div>', SCRIPT);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 7.1 rollup id run it`, () => {
  const html = page('<p>x</p>', SCRIPT);
  for (const opts of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-7.1' } } }
  ]) {
    const result = runa11yCoreOnHtml(html, opts);
    const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

function rollup71(html) {
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  return result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-7.1');
}

test(`${RULE_ID}: under the RGAA profile, 7.1 is notApplicable on a page with no script`, () => {
  const main = '<main><h1>Opening hours</h1><p>Monday to Friday.</p></main>';
  assert.equal(rollup71(page(main)).outcome, 'notApplicable');
});

test(`${RULE_ID}: under the RGAA profile, 7.1 asks on a page with script and nothing failing`, () => {
  const main = '<main><h1>Opening hours</h1><p>Monday to Friday.</p></main>';
  const composite = rollup71(page(main, SCRIPT));
  assert.equal(composite.outcome, 'cantTell');
  const tests = composite.meta.normativeMappings
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement);
  assert.deepEqual(tests, ['7.1.1', '7.1.2', '7.1.3']);
});

test(`${RULE_ID}: under the RGAA profile, an unnamed tree still fails 7.1`, () => {
  const main = '<main><h1>Files</h1><ul role="tree"><li role="treeitem">Docs</li></ul></main>';
  assert.equal(rollup71(page(main, SCRIPT)).outcome, 'fail');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/scripted-components-review-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'scripted-components-review-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });
  assert.equal(rule.occurrences[0].selector, 'html');
  const ids = rule.occurrences.slice(1).map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'scr_case_01',
    'scr_case_02',
    'scr_case_03',
    'scr_case_04',
    'scr_case_05',
    'scr_case_06',
    'scr_case_07'
  ]);
  assert.deepEqual(reasons(rule).slice(1), [
    'widgetRole',
    'widgetRole',
    'focusableNonNative',
    'inlineHandler',
    'contentEditable',
    'stateAttribute',
    'widgetRole'
  ]);
});
