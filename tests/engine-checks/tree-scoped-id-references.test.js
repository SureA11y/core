'use strict';

/**
 * An ID reference resolves in the referring element's own tree: its shadow
 * root, or its document (#92). IDs are scoped to their tree: HTML's labeled
 * control is "an element in the tree" with that ID, and ARIA ID references,
 * `headers` and `usemap` are looked up the same way. So a reference inside a
 * shadow root finds its target there, and one from a shadow root to the page
 * (or from the page into a shadow root) finds nothing, as in browsers.
 *
 * Each case puts markup in the page and in a shadow root attached to
 * #host, and runs one rule over both with includeShadowDom.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml');

function outcome(ruleId, light, shadow) {
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>T</title></head><body style="background:#fff"><main>${light}<div id="host"></div></main></body></html>`
  );
  dom.window.document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = shadow;
  const result = runa11yCoreOnDom(dom, {
    runOnly: [ruleId],
    engineOptions: { includeShadowDom: true }
  });
  const r = result.checksResults.find((c) => c.ruleId === ruleId);
  assert.ok(r, `${ruleId} ran`);
  return r.outcome;
}

const CASES = [
  // [rule, page markup, shadow markup, outcome]
  [
    'form-control-programmatic-label-present',
    '',
    '<label for="z">Zip</label><input id="z">',
    'pass'
  ],
  [
    'form-control-programmatic-label-present',
    '<label for="z">Zip</label>',
    '<input id="z">',
    'fail'
  ],
  [
    'form-control-programmatic-label-present',
    '',
    '<span id="l">Zip</span><input aria-labelledby="l">',
    'pass'
  ],
  [
    'form-control-programmatic-label-present',
    '<span id="l">Zip</span>',
    '<input aria-labelledby="l">',
    'fail'
  ],
  [
    'button-name-present',
    '',
    '<span id="l">Save</span><button aria-labelledby="l"></button>',
    'pass'
  ],
  [
    'button-name-present',
    '<span id="l">Save</span>',
    '<button aria-labelledby="l"></button>',
    'fail'
  ],
  [
    'textbox-name-present',
    '',
    '<span id="l">Notes</span><div role="textbox" tabindex="0" aria-labelledby="l"></div>',
    'pass'
  ],
  [
    'textbox-name-present',
    '<span id="l">Notes</span>',
    '<div role="textbox" tabindex="0" aria-labelledby="l"></div>',
    'fail'
  ],
  [
    'table-headers-attr-valid',
    '',
    '<table><tr><th id="h">Name</th></tr><tr><td headers="h">A</td></tr></table>',
    'pass'
  ],
  [
    'table-headers-attr-valid',
    '<table><tr><th id="h">Name</th></tr><tr><td>B</td></tr></table>',
    '<table><tr><th>Other</th></tr><tr><td headers="h">A</td></tr></table>',
    'fail'
  ],
  [
    'aria-required-children',
    '',
    '<div role="list" aria-owns="i"></div><div id="i" role="listitem">Item</div>',
    'pass'
  ],
  [
    'aria-required-children',
    '<div id="i" role="listitem">Item</div>',
    '<div role="list" aria-owns="i"></div>',
    'cantTell'
  ],
  [
    'aria-required-parent',
    '',
    '<div role="list" aria-owns="i"></div><div id="i" role="listitem">Item</div>',
    'pass'
  ],
  [
    'aria-required-parent',
    '<div role="list" aria-owns="i"></div>',
    '<div id="i" role="listitem">Item</div>',
    'fail'
  ],
  [
    'area-alt-present',
    '',
    '<img src="m.png" alt="Map" usemap="#m"><map name="m"><area href="/a" shape="rect" coords="0,0,9,9"></map>',
    'fail'
  ],
  [
    'area-alt-present',
    '<img src="m.png" alt="Map" usemap="#m">',
    '<map name="m"><area href="/a" shape="rect" coords="0,0,9,9"></map>',
    'notApplicable'
  ],
  // Text naming a disabled control has no contrast requirement (WCAG 1.4.3).
  [
    'contrast-minimum',
    '',
    '<label id="lb" style="color:#bbb">Name</label><div role="textbox" aria-disabled="true" aria-labelledby="lb"></div>',
    'notApplicable'
  ],
  [
    'contrast-minimum',
    '<div role="textbox" aria-disabled="true" aria-labelledby="lb"></div>',
    '<label id="lb" style="color:#bbb">Name</label>',
    'fail'
  ]
];

for (const [ruleId, light, shadow, want] of CASES) {
  test(`${ruleId}: ${want} for ${light ? 'page ' + light + ' with ' : ''}shadow ${shadow}`, () => {
    assert.equal(outcome(ruleId, light, shadow), want);
  });
}
