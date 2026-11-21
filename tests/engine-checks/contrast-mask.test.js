'use strict';

// A mask (mask-image, -webkit-mask-image, the mask shorthand) fades the
// element and all it holds, text and background together, by amounts that
// vary across it: black text under a 20% mask is drawn a pale grey, and a
// "read more" fade takes the last lines to nothing. Like a filter, that
// leaves colors on screen the CSS doesn't give, so the text is asked about
// (BACKGROUND_FILTER_OR_BACKDROP_FILTER, blocker mask-image), not passed on
// its declared colors. Round 8, LY-2.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>Mask</title></head><body style="background:#fff"><main>${body}</main></body></html>`;

const run = (body) => {
  const result = runa11yCoreOnHtml(page(body), {
    runOnly: ['contrast-minimum', 'contrast-enhanced', 'contrast-computable']
  });
  return Object.fromEntries(result.checksResults.map((c) => [c.ruleId, c]));
};

for (const [description, body] of [
  [
    'a 20% mask on an ancestor',
    '<div style="mask-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2))"><p style="color:#000">Masked faint text</p></div>'
  ],
  [
    'a "read more" fade with -webkit-mask-image',
    '<div style="-webkit-mask-image:linear-gradient(#000,transparent)"><p style="color:#000">Read more fade</p></div>'
  ],
  [
    "a mask on the text's own element, set with the shorthand",
    '<p style="color:#000;mask:url(#fade)">Masked by an SVG mask</p>'
  ]
]) {
  test(`contrast: ${description} is asked about, not passed`, () => {
    const r = run(body);
    assert.equal(r['contrast-minimum'].outcome, 'notApplicable');
    assert.equal(r['contrast-enhanced'].outcome, 'notApplicable');
    assert.equal(r['contrast-computable'].outcome, 'cantTell');
    const occ = r['contrast-computable'].occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
    assert.equal(occ.data.details.blockerProperty, 'mask-image');
    assert.match(occ.summary, /mask/);
  });
}

test('contrast: a mask layer list of none is no mask', () => {
  const r = run('<div style="mask-image:none, none"><p style="color:#000">Plain text</p></div>');
  assert.equal(r['contrast-minimum'].outcome, 'pass');
  assert.equal(r['contrast-computable'].outcome, 'pass');
});
