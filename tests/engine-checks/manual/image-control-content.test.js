'use strict';

// An image that is the only content of a link or button names it (H30): the
// image rules give it the reason code IMAGE_ONLY_CONTROL_CONTENT, with the
// control's role in controlContent, so a report can judge the image with the
// control. The outcome is unchanged.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

function detailsById(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  const rule = result.checksResults.find((r) => r.ruleId === ruleId);
  const out = {};
  for (const o of rule.occurrences) {
    const m = /id="([^"]+)"/.exec(o.html);
    if (m) out[m[1]] = o.data.details;
  }
  return out;
}

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

test('img-alt-quality marks an image that is a link or button’s only content', () => {
  const d = detailsById(
    page(
      '<a href="/"><img id="only" src="logo.png" alt="Home"></a>' +
        '<button><span><img id="btn" src="x.png" alt="Search"></span></button>' +
        '<a href="/r"><img id="beside" src="pdf.png" alt="PDF"> Annual report</a>' +
        '<p><img id="alone" src="a.png" alt="A cat"></p>' +
        '<a href="/r"><img id="two-a" src="a.png" alt="One"><img id="two-b" src="b.png" alt="Two"></a>'
    ),
    'img-alt-quality'
  );
  assert.equal(d.only.controlContent, 'link');
  assert.equal(d.only.reasonCode, 'IMAGE_ONLY_CONTROL_CONTENT');
  assert.equal(d.btn.controlContent, 'button');
  // Beside text, or not a control's only content: the rule's own code only.
  const review = { reasonCode: 'TEXT_ALTERNATIVE_REVIEW' };
  assert.deepEqual(d.beside, review);
  assert.deepEqual(d.alone, review);
  assert.deepEqual(d['two-a'], review);
});

test('img-alt-quality keeps the alt signal beside controlContent', () => {
  const d = detailsById(
    page('<a href="/"><img id="i" src="IMG_0042.jpg" alt="IMG_0042"></a>'),
    'img-alt-quality'
  );
  assert.equal(d.i.altSignal, 'file-name');
  assert.equal(d.i.reasonCode, 'IMAGE_ONLY_CONTROL_CONTENT');
});

test('svg-text-alternative-quality marks an svg that is a link’s only content', () => {
  const d = detailsById(
    page(
      '<a href="/"><svg id="only" role="img"><title>Home</title></svg></a>' +
        '<a href="/r"><svg id="beside" role="img"><title>PDF</title></svg> Report</a>' +
        '<a href="/h"><span hidden>x</span><svg id="hidden-text" role="img"><title>Help</title></svg></a>'
    ),
    'svg-text-alternative-quality'
  );
  assert.equal(d.only.reasonCode, 'IMAGE_ONLY_CONTROL_CONTENT');
  assert.equal(d.only.controlContent, 'link');
  assert.equal(d.beside.reasonCode, 'TEXT_ALTERNATIVE_REVIEW');
  assert.equal(d['hidden-text'].controlContent, 'link');
});

test('img-alt-decorative marks an excluded image that is a control’s only content', () => {
  const d = detailsById(
    page(
      '<button><svg id="icon" aria-hidden="true"></svg></button>' +
        '<a href="/r"><svg id="beside" aria-hidden="true"></svg>Report</a>'
    ),
    'img-alt-decorative'
  );
  assert.equal(d.icon.controlContent, 'button');
  assert.equal(d.icon.reasonCode, 'IMAGE_ONLY_CONTROL_CONTENT');
  assert.equal(d.beside.reasonCode, 'EXCLUDED_ELEMENT_REVIEW');
});
