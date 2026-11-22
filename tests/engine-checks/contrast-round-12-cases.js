'use strict';

// Markup shared by contrast-round-12.test.js (jsdom) and
// contrast-round-12-chromium.test.js, which must agree on it.

// A grey sign beside black digits: [contrast-minimum, symbol-graphic-contrast].
const SIGN_CASES_C12_1 = [
  '<div style="display:flex;color:#000"><span style="color:#aaa">$</span><span>45.00</span></div>',
  '<div style="display:grid;grid-template-columns:auto auto;color:#000"><span style="color:#aaa">$</span><span>45.00</span></div>',
  '<p style="color:#000"><span style="display:inline-flex"><span style="color:#aaa">$</span><span>45.00</span></span></p>',
  '<p style="color:#000"><span style="color:#aaa">$</span><span style="float:right">45.00</span></p>',
  '<p style="color:#000;position:relative"><span style="color:#aaa">$</span><span style="position:absolute;left:30px">45.00</span></p>'
];

module.exports = { SIGN_CASES_C12_1 };

// [markup, contrast-minimum, symbol-graphic-contrast] (round 12, C12-12).
const SIGN_LINK_CASES_C12_12 = [
  ['<p><span style="color:#aaa">$</span><a href="/p">45</a></p>', 'fail', 'notApplicable'],
  ['<p><a href="/p">45</a><span style="color:#aaa">€</span></p>', 'fail', 'notApplicable'],
  [
    '<p><span style="color:#aaa">$</span><a href="/p"><b>45</b>.00</a></p>',
    'fail',
    'notApplicable'
  ],
  [
    '<p><a href="/">Home</a> <span style="color:#aaa">&gt;</span> <a href="/s">Shop</a></p>',
    'pass',
    'cantTell'
  ],
  [
    '<p><a href="/">Home</a><span style="color:#aaa">$</span><a href="/s">Shop</a></p>',
    'pass',
    'cantTell'
  ]
];

module.exports.SIGN_LINK_CASES_C12_12 = SIGN_LINK_CASES_C12_12;
