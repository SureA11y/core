'use strict';

// form-group-name-present cases from round 11's review (R11F-11):
// [label, light DOM, shadow root of #h (or null), outcome].
const R2 =
  '<label><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label>';

module.exports = [
  [
    'a hidden legend names no group',
    `<fieldset><legend hidden>Size</legend>${R2}</fieldset>`,
    null,
    'cantTell'
  ],
  [
    'radio buttons no slot takes are not drawn',
    `<x-g id="h">${R2}</x-g>`,
    '<p>Nothing slotted</p>',
    'notApplicable'
  ],
  [
    "radio buttons in a slot's fallback, with nodes assigned to it, are not drawn",
    '<x-g id="h"><span>x</span></x-g>',
    `<slot>${R2}</slot>`,
    'notApplicable'
  ],
  [
    "radio buttons in a slot's fallback, with nothing assigned, are drawn",
    '<x-g id="h"></x-g>',
    `<slot>${R2}</slot>`,
    'cantTell'
  ]
];
