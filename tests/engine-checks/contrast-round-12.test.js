'use strict';

/**
 * Text contrast: what the twelfth stress test found (C12-n), under jsdom.
 * The same cases run in Chromium in contrast-round-12-chromium.test.js,
 * where they apply, and the two agree.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../helpers/runDomRulesOnHtml.js');

const { SIGN_CASES_C12_1 } = require('./contrast-round-12-cases.js');

const page = (body, head = '') =>
  `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`;

function check(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  return result.checksResults.find((c) => c.ruleId === ruleId);
}

test('text placed straight into a shadow host takes its slot’s color and background (C12-2)', () => {
  const run = (shadow) => {
    const dom = createDom(page('<x-s id="h">Buy now</x-s>'));
    dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = shadow;
    const result = runa11yCoreOnDom(dom, { runOnly: ['contrast-minimum'] });
    return result.checksResults.find((c) => c.ruleId === 'contrast-minimum');
  };
  const grey = run('<div style="color:#aaa"><slot></slot></div>');
  assert.equal(grey.outcome, 'fail');
  assert.equal(Math.round(grey.occurrences[0].data.details.metrics.ratio * 100) / 100, 2.32);
  assert.equal(run('<slot style="color:#aaa"></slot>').outcome, 'fail');
  // White text on a dark wrapper in the shadow tree is measured there.
  const dark = run('<div style="background:#000;color:#fff"><slot></slot></div>');
  assert.equal(dark.outcome, 'pass');
});

const svgPage = (inner, head = '') => page(`<svg width="300" height="100">${inner}</svg>`, head);

test('an SVG shape its display or visibility hides is no background, without a layout (C12-4)', () => {
  const label = '<text x="10" y="50" fill="#fff">Sales</text>';
  for (const rect of [
    '<rect display="none" width="300" height="100" fill="#000"/>',
    '<rect visibility="hidden" width="300" height="100" fill="#000"/>',
    '<g display="none"><rect width="300" height="100" fill="#000"/></g>',
    '<g visibility="hidden"><rect width="300" height="100" fill="#000"/></g>',
    '<rect class="bg" width="300" height="100" fill="#000"/>'
  ]) {
    const head = rect.includes('class="bg"') ? '<style>.bg{display:none}</style>' : '';
    // White on the white page behind it: not drawn, as Chromium has it.
    assert.equal(
      check(svgPage(rect + label, head), 'contrast-minimum').outcome,
      'notApplicable',
      rect
    );
    assert.notEqual(
      check(svgPage(rect + label, head), 'contrast-computable').outcome,
      'pass',
      rect
    );
  }
  // Drawn, the rect is measured against.
  assert.equal(
    check(svgPage('<rect width="300" height="100" fill="#000"/>' + label), 'contrast-minimum')
      .outcome,
    'pass'
  );
});

test('a baseline set in CSS keeps SVG text asked about, without a layout (C12-5)', () => {
  const svg = (head) =>
    svgPage(
      '<rect width="300" height="35" fill="#000"/><text x="10" y="25" font-size="20" fill="#fff">Sales<tspan>!</tspan></text>',
      head
    );
  for (const head of [
    '<style>text{dominant-baseline:hanging}</style>',
    '<style>svg{dominant-baseline:hanging}</style>',
    '<style>tspan{alignment-baseline:hanging}</style>',
    '<style>tspan{baseline-shift:-10px}</style>'
  ]) {
    const r = check(svg(head), 'contrast-computable');
    assert.equal(r.outcome, 'cantTell', head);
    assert.equal(r.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP', head);
  }
  // Text clear inside the rect on its usual baseline is measured.
  const tall = svgPage(
    '<rect width="300" height="60" fill="#000"/><text x="10" y="30" font-size="20" fill="#fff">Sales</text>'
  );
  assert.equal(check(tall, 'contrast-computable').outcome, 'pass');
});

test('SVG geometry set in CSS keeps text over the shape asked about, without a layout (C12-6)', () => {
  const label = '<text x="100" y="50" fill="#fff">Sales</text>';
  for (const [head, shape] of [
    ['<style>.bg{width:20px}</style>', '<rect class="bg" width="300" height="100" fill="#000"/>'],
    ['<style>rect{x:200px}</style>', '<rect width="300" height="100" fill="#000"/>'],
    ['<style>circle{r:5px}</style>', '<circle cx="120" cy="45" r="100" fill="#000"/>'],
    ['<style>circle{cx:0}</style>', '<circle cx="120" cy="45" r="100" fill="#000"/>']
  ]) {
    const r = check(svgPage(shape + label, head), 'contrast-computable');
    assert.equal(r.outcome, 'cantTell', head);
    assert.equal(r.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP', head);
  }
  // Geometry from attributes alone is read.
  const plain = check(
    svgPage(
      '<rect width="300" height="100" fill="#000"/>' + label,
      '<style>rect{stroke:none}</style>'
    ),
    'contrast-computable'
  );
  assert.equal(plain.outcome, 'pass');
});

test('the width SVG text may take is a real upper bound, without a layout (C12-8)', () => {
  const bar = (w, label) =>
    svgPage(
      `<rect width="${w}" height="40" fill="#000"/><text x="4" y="27" font-size="16" fill="#fff">${label}</text>`
    );
  const outcome = (html) => check(html, 'contrast-computable').outcome;
  // Fits by a clear margin: measured.
  assert.equal(outcome(bar(130, 'Sales')), 'pass');
  // 10 × 16px is 160px, and some glyphs are wider than 1em: asked about at 170px.
  assert.equal(outcome(bar(170, 'MMMMMMMMMM')), 'cantTell');
  assert.equal(outcome(bar(190, 'MMMMMMMMMM')), 'pass');
  // Emoji and wide East Asian characters take up to 2em.
  assert.equal(outcome(bar(40, '😀A')), 'cantTell');
  assert.equal(outcome(bar(60, '売上')), 'cantTell');
  assert.equal(outcome(bar(72, '売上')), 'pass');
});

test('a sign that is a flex or grid item, or beside a float or a positioned box, is a graphic, as in Chromium (C12-1)', () => {
  for (const body of SIGN_CASES_C12_1) {
    assert.equal(check(page(body), 'contrast-minimum').outcome, 'pass', body);
    assert.equal(check(page(body), 'symbol-graphic-contrast').outcome, 'cantTell', body);
  }
  // In one inline run, the sign is text.
  const inline = '<p style="color:#000"><span style="color:#aaa">$</span><span>45.00</span></p>';
  assert.equal(check(page(inline), 'contrast-minimum').outcome, 'fail');
});
