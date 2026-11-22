'use strict';

// Cascade layers deciding whether a link's content is underlined (round 11,
// D9): [label, head, body, outcome]. The outcome is Chromium's, and jsdom
// must give the same (link-in-text-block-layers.test.js runs both).
const link = (inner) =>
  `<p style="color:#000">Read the <a href="/" style="color:#000;text-decoration:none">${inner}</a> before you start the work today.</p>`;
const span = (style = '') =>
  link(`<span class="u"${style ? ` style="${style}"` : ''}>guide</span>`);
const sheet = (css) => `<style>${css}</style>`;
const U = 'text-decoration:underline';
const N = 'text-decoration:none';

module.exports = [
  ['a later layer wins', sheet(`@layer a{.u{${U}}} @layer b{.u{${N}}}`), span(), 'fail'],
  [
    'a later layer wins, the other way',
    sheet(`@layer a{.u{${N}}} @layer b{.u{${U}}}`),
    span(),
    'pass'
  ],
  [
    'a later layer wins over a more specific earlier one',
    sheet(`@layer a{p a .u{${U}}} @layer b{.u{${N}}}`),
    span(),
    'fail'
  ],
  [
    'layers rank in the order an @layer statement first names them',
    sheet(`@layer b, a; @layer a{.u{${U}}} @layer b{.u{${N}}}`),
    span(),
    'pass'
  ],
  [
    'a layer named again keeps its first place',
    sheet(`@layer a{.u{${N}}} @layer b{.u{${U}}} @layer a{.u{${N}}}`),
    span(),
    'pass'
  ],
  [
    "a layer's own declarations win over its nested layer's",
    sheet(`@layer a{@layer b{.u{${U}}} .u{${N}}}`),
    span(),
    'fail'
  ],
  [
    'a dotted name is a nested layer',
    sheet(`@layer a.b{.u{${U}}} @layer a{.u{${N}}}`),
    span(),
    'fail'
  ],
  [
    'nested layers rank in their order inside their parent',
    sheet(`@layer a{@layer y{.u{${U}}} @layer x{.u{${N}}}}`),
    span(),
    'fail'
  ],
  [
    'a nested layer of a later layer wins over an earlier layer',
    sheet(`@layer a{.u{${U}}} @layer b.c{.u{${N}}}`),
    span(),
    'fail'
  ],
  ['a later anonymous layer wins', sheet(`@layer{.u{${U}}} @layer{.u{${N}}}`), span(), 'fail'],
  [
    'a named layer after an anonymous one wins',
    sheet(`@layer{.u{${N}}} @layer x{.u{${U}}}`),
    span(),
    'pass'
  ],
  [
    'no layer wins over every layer for normal declarations',
    sheet(`.u{${N}} @layer a{p a .u{${U}}}`),
    span(),
    'fail'
  ],
  [
    'an !important in an earlier layer wins over one in a later layer',
    sheet(`@layer a{.u{${U}!important}} @layer b{.u{${N}!important}}`),
    span(),
    'pass'
  ],
  [
    'an !important in a layer wins over one in no layer',
    sheet(`.u{${N}!important} @layer a{.u{${U}!important}}`),
    span(),
    'pass'
  ],
  [
    'an !important in a nested layer wins over its parent layer’s',
    sheet(`@layer a{@layer b{.u{${U}!important}} .u{${N}!important}}`),
    span(),
    'pass'
  ],
  [
    'the style attribute wins over every normal declaration',
    sheet(`.u{${N}} @layer a{.u{${N}}}`),
    span(U),
    'pass'
  ],
  [
    'a layered !important wins over a normal style attribute',
    sheet(`@layer a{.u{${N}!important}}`),
    span(U),
    'fail'
  ],
  [
    'an !important style attribute wins over a layered !important',
    sheet(`@layer a{.u{${N}!important}}`),
    span(`${U}!important`),
    'pass'
  ],
  [
    'an !important style attribute wins over an unlayered !important',
    sheet(`.u{${N}!important} @layer a{.u{${U}}}`),
    span(`${U}!important`),
    'pass'
  ],
  [
    'an underline in no layer loses to a layered !important none',
    sheet(`.u{${U}} @layer a{.u{${N}!important}}`),
    span(),
    'fail'
  ]
];
