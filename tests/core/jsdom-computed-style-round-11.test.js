'use strict';

// Under jsdom, computedStyle puts in what jsdom's getComputedStyle leaves
// out (dom-helpers' __jsdomStyleFixesOf), so it should give what Chromium
// gives. Each case is checked against both: helpers.computedStyle under
// jsdom, and getComputedStyle in Chromium (skipped when Playwright or its
// Chromium build is not installed; set CHROMIUM_EXECUTABLE_PATH to use
// another build). Round 11's review (R11F-n).

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { chromium, executablePath, skip } = require('../helpers/chromium.js');

const page = (body, head = '') =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
// A script that gives #host an open shadow root holding inner.
const shadow = (host, inner) =>
  `<script>document.getElementById(${JSON.stringify(host)}).attachShadow({mode:"open"}).innerHTML=${JSON.stringify(inner)}</script>`;
const OVERFLOW = ['overflow', 'overflowX', 'overflowY'];
const RED = ['rgb(255, 0, 0)'];

// [label, html, selector (' >>> ' enters a shadow root), properties,
// values Chromium computes]
const CASES = [
  // R11F-4
  [
    'overflow set to a var() holding visible',
    page('<div id="t" style="--o:visible;overflow:var(--o)">x</div>'),
    '#t',
    OVERFLOW,
    ['visible', 'visible', 'visible']
  ],
  [
    'overflow-y set to a var() holding visible',
    page('<div id="t" style="--o:visible;overflow-y:var(--o)">x</div>'),
    '#t',
    OVERFLOW,
    ['visible', 'visible', 'visible']
  ],
  [
    'overflow-x set to a var() holding auto',
    page('<div id="t" style="--o:auto;overflow-x:var(--o)">x</div>'),
    '#t',
    OVERFLOW,
    ['auto', 'auto', 'auto']
  ],
  [
    'overflow set by a rule to a var() and a keyword',
    page('<div id="t" class="o">x</div>', '<style>.o{--o:auto;overflow:var(--o) hidden}</style>'),
    '#t',
    OVERFLOW,
    ['auto hidden', 'auto', 'hidden']
  ],
  [
    'overflow-y set to an undefined var()',
    page('<div id="t" style="overflow-y:var(--nope)">x</div>'),
    '#t',
    OVERFLOW,
    ['visible', 'visible', 'visible']
  ],
  [
    'overflow set to a var() with a fallback',
    page('<div id="t" style="overflow:var(--nope, auto)">x</div>'),
    '#t',
    OVERFLOW,
    ['auto', 'auto', 'auto']
  ],
  [
    'overflow: overlay',
    page('<div id="t" style="overflow:overlay">x</div>'),
    '#t',
    OVERFLOW,
    ['auto', 'auto', 'auto']
  ],
  [
    'overflow-y: overlay',
    page('<div id="t" style="overflow-y:overlay">x</div>'),
    '#t',
    OVERFLOW,
    ['auto', 'auto', 'auto']
  ],
  ['a textarea', page('<textarea id="t">x</textarea>'), '#t', OVERFLOW, ['auto', 'auto', 'auto']],
  [
    'a textarea set to overflow: visible',
    page('<textarea id="t" style="overflow:visible">x</textarea>'),
    '#t',
    OVERFLOW,
    ['auto', 'auto', 'auto']
  ],
  [
    'a textarea set to overflow-x: clip',
    page('<textarea id="t" style="overflow-x:clip">x</textarea>'),
    '#t',
    OVERFLOW,
    ['hidden auto', 'hidden', 'auto']
  ],
  [
    'a drop-down select',
    page('<select id="t"><option>a</option></select>'),
    '#t',
    OVERFLOW,
    ['clip', 'clip', 'clip']
  ],
  [
    'a drop-down select set to overflow: auto',
    page('<select id="t" style="overflow:auto"><option>a</option></select>'),
    '#t',
    OVERFLOW,
    ['clip', 'clip', 'clip']
  ],
  [
    'a list box select',
    page('<select id="t" multiple><option>a</option></select>'),
    '#t',
    OVERFLOW,
    ['hidden scroll', 'hidden', 'scroll']
  ],
  [
    'a list box select with a size',
    page('<select id="t" size="3"><option>a</option></select>'),
    '#t',
    OVERFLOW,
    ['hidden scroll', 'hidden', 'scroll']
  ],
  [
    'a list box select set to overflow-x: visible',
    page('<select id="t" size="2" style="overflow-x:visible"><option>a</option></select>'),
    '#t',
    OVERFLOW,
    ['auto scroll', 'auto', 'scroll']
  ],
  [
    'a list box select set to overflow: visible',
    page('<select id="t" multiple style="overflow:visible"><option>a</option></select>'),
    '#t',
    OVERFLOW,
    ['visible', 'visible', 'visible']
  ],
  // R11F-5: a colour hint inherits along the flat tree.
  [
    'text in a shadow root under a <font color>',
    page('<div id="h"></div>' + shadow('h', '<font color="red"><span id="t">x</span></font>')),
    '#h >>> #t',
    ['color'],
    RED
  ],
  [
    'a light child slotted into a <font color> in a shadow root',
    page(
      '<div id="h"><span id="t">x</span></div>' +
        shadow('h', '<font color="red"><slot></slot></font>')
    ),
    '#t',
    ['color'],
    RED
  ],
  [
    "a slot's fallback content in a <font color>",
    page(
      '<div id="h"></div>' +
        shadow('h', '<font color="red"><slot><span id="t">x</span></slot></font>')
    ),
    '#h >>> #t',
    ['color'],
    RED
  ],
  [
    'shadow text in a host inside a <font color>',
    page('<font color="red"><div id="h"></div></font>' + shadow('h', '<span id="t">x</span>')),
    '#h >>> #t',
    ['color'],
    RED
  ],
  [
    'shadow text under <body text>',
    page('<div id="h"></div>' + shadow('h', '<span id="t">x</span>')).replace(
      '<body>',
      '<body text="red">'
    ),
    '#h >>> #t',
    ['color'],
    RED
  ],
  [
    'a link in a shadow root under <body link>',
    page('<div id="h"></div>' + shadow('h', '<a href="#" id="t">x</a>')).replace(
      '<body>',
      '<body link="red">'
    ),
    '#h >>> #t',
    ['color'],
    RED
  ],
  // R11F-6: HTML's legacy colour rules match CSS's named colours only.
  ...[
    ['Canvas', 'rgb(202, 0, 160)'],
    ['AccentColor', 'rgb(172, 0, 0)'],
    ['inherit', 'rgb(0, 224, 0)'],
    ['currentcolor', 'rgb(192, 224, 0)'],
    ['RebeccaPurple', 'rgb(102, 51, 153)']
  ].map(([value, rgb]) => [
    `<font color="${value}">`,
    page(`<p style="color:green"><font id="t" color="${value}">x</font></p>`),
    '#t',
    ['color'],
    [rgb]
  ])
];

function jsdomStyle(html, selector, props) {
  const dom = new JSDOM(html, { pretendToBeVisual: true, runScripts: 'dangerously' });
  const { window } = dom;
  const { document } = window;
  const h = createDomHelpers({ document, window, root: [document], includeShadowDom: true });
  const el = selector
    .split(' >>> ')
    .reduce((ctx, s, i) => (i ? ctx.shadowRoot : ctx).querySelector(s), document);
  const cs = h.computedStyle(el);
  return props.map((p) => cs[p] ?? cs.getPropertyValue(p));
}

for (const [label, html, selector, props, expected] of CASES) {
  test(`computedStyle under jsdom: ${label}`, () => {
    assert.deepEqual(jsdomStyle(html, selector, props), expected);
  });
}

test('getComputedStyle in Chromium: the same cases', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [label, html, selector, props, expected] of CASES) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      const got = await p.evaluate(
        ([sel, names]) => {
          const el = sel
            .split(' >>> ')
            .reduce((ctx, s, i) => (i ? ctx.shadowRoot : ctx).querySelector(s), document);
          const cs = getComputedStyle(el);
          return names.map((q) => cs[q] ?? cs.getPropertyValue(q));
        },
        [selector, props]
      );
      assert.deepEqual(got, expected, label);
    } finally {
      await p.close();
    }
  }
});
