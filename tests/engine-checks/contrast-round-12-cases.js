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

// [host attributes, shadow markup, contrast-minimum] (round 12, C12-10).
const SHADOW_DISABLED_CASES_C12_10 = [
  [
    'role="button" aria-disabled="true" tabindex="0"',
    '<span style="color:#aaa">Buy</span>',
    'notApplicable'
  ],
  [
    'aria-disabled="true"',
    '<button style="color:#aaa;background:#fff;border:0">Buy</button>',
    'notApplicable'
  ],
  ['role="button" aria-disabled="true" tabindex="0"', '<div><slot></slot></div>', 'notApplicable'],
  // aria-disabled on a plain element disables nothing (round 11, D6).
  ['aria-disabled="true"', '<span style="color:#aaa">Buy</span>', 'fail'],
  ['role="button" tabindex="0"', '<span style="color:#aaa">Buy</span>', 'fail']
];

module.exports.SHADOW_DISABLED_CASES_C12_10 = SHADOW_DISABLED_CASES_C12_10;

// Stars with text that is not seen: symbol-graphic-contrast asks about
// them (round 12, C12-11).
const UNSEEN_TEXT_CASES_C12_11 = [
  '<span style="color:#ccc">★★★★☆<span style="opacity:0">4 of 5</span></span>',
  '<span style="color:#ccc">★★★★☆<span style="font-size:0">4 of 5</span></span>',
  '<span style="color:#ccc">★★★★☆<span style="display:inline-block;text-indent:-9999px;width:0;overflow:hidden">4 of 5</span></span>'
];

module.exports.UNSEEN_TEXT_CASES_C12_11 = UNSEEN_TEXT_CASES_C12_11;

// color: revert in a link, on black: [markup, contrast-minimum, ratio]
// (round 12, C12-14).
const REVERT_LINK_CASES_C12_14 = [
  [
    '<div style="background:#000;color:#fff">See <a href="#" style="color:revert">the link</a></div>',
    'fail',
    2.23
  ],
  [
    '<div style="background:#000;color:#fff">See <a href="#" style="color:#fff">the <span style="color:revert">link</span></a></div>',
    'pass',
    null
  ]
];

module.exports.REVERT_LINK_CASES_C12_14 = REVERT_LINK_CASES_C12_14;
