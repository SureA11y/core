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

const {
  SIGN_CASES_C12_1,
  SIGN_LINK_CASES_C12_12,
  SHADOW_DISABLED_CASES_C12_10,
  UNSEEN_TEXT_CASES_C12_11,
  REVERT_LINK_CASES_C12_14
} = require('./contrast-round-12-cases.js');

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

test('a sign beside a link whose nearest character is a digit is text (C12-12)', () => {
  for (const [body, minimum, symbol] of SIGN_LINK_CASES_C12_12) {
    for (const [id, want] of [
      ['contrast-minimum', minimum],
      ['symbol-graphic-contrast', symbol]
    ]) {
      assert.equal(check(page(body), id).outcome, want, `${id}: ${body}`);
    }
  }
});

test('the search for a sign’s neighbours has a budget for the whole scan (C12-13)', () => {
  // Grey signs, each on its own line, 150 empty inline elements before
  // their digit. The
  // first are read as text; past the budget of styles not read yet, a
  // sign is a graphic, as before signs were read with their text.
  const padding = '<span><b></b></span>'.repeat(150);
  let body = '<p>';
  for (let i = 0; i < 12; i++) body += `<br><span style="color:#aaa">$</span>${padding}5`;
  body += '</p>';
  const minimum = check(page(body), 'contrast-minimum');
  assert.equal(minimum.outcome, 'fail');
  assert.ok(minimum.occurrences.length < 12);
  assert.equal(check(page(body), 'symbol-graphic-contrast').outcome, 'cantTell');
  // A sign beside digits whose styles the scan has read costs nothing:
  // after the budget is spent, a plain price is still text.
  const after = body + '<p><span style="color:#aaa">€</span>45</p>';
  const occ = check(page(after), 'contrast-minimum').occurrences;
  assert.ok(occ.some((o) => o.html.includes('€')));
  // A page of real prices stays well within it: each sign is text.
  let prices = '<ul>';
  for (let i = 0; i < 300; i++)
    prices += `<li><span><bdi><span style="color:#aaa">€</span>${i},00</bdi></span></li>`;
  prices += '</ul>';
  assert.equal(check(page(prices), 'symbol-graphic-contrast').outcome, 'notApplicable');
});

test('a failing sign read with its price says why it needs the text ratio, in every locale (C12-17)', () => {
  const html = page(
    '<p>45,00 <span style="color:#aaa">€</span></p><p style="color:#aaa">Plain text</p>'
  );
  const said = {
    'contrast-minimum': {
      en: 'This sign is read with the price beside it, so it is text and needs the text ratio.',
      de: 'Dieses Zeichen wird mit dem Preis daneben gelesen; es ist also Text und braucht das Kontrastverhältnis für Text.',
      es: 'Este signo se lee con el precio que tiene al lado, así que es texto y necesita la relación de contraste del texto.',
      fr: 'Ce signe se lit avec le prix à côté de lui : c’est donc du texte, qui doit atteindre le rapport de contraste du texte.',
      ja: 'この記号は隣の価格と一緒に読まれるため、テキストであり、テキストのコントラスト比が必要です。'
    },
    'contrast-enhanced': {
      en: 'This sign is read with the price beside it, so it is text and needs the enhanced text ratio.',
      de: 'Dieses Zeichen wird mit dem Preis daneben gelesen; es ist also Text und braucht das erhöhte Kontrastverhältnis für Text.',
      es: 'Este signo se lee con el precio que tiene al lado, así que es texto y necesita la relación de contraste mejorada del texto.',
      fr: 'Ce signe se lit avec le prix à côté de lui : c’est donc du texte, qui doit atteindre le rapport de contraste renforcé du texte.',
      ja: 'この記号は隣の価格と一緒に読まれるため、テキストであり、テキストの強化されたコントラスト比が必要です。'
    }
  };
  for (const [ruleId, byLocale] of Object.entries(said)) {
    for (const [locale, sentence] of Object.entries(byLocale)) {
      const r = runa11yCoreOnHtml(html, { runOnly: [ruleId], engineOptions: { locale } });
      const [sign, plain] = r.checksResults.find((c) => c.ruleId === ruleId).occurrences;
      assert.equal(sign.data.details.reasonCode, 'BELOW_THRESHOLD');
      assert.ok(sign.summary.endsWith(sentence), `${ruleId} ${locale}: ${sign.summary}`);
      assert.ok(!plain.summary.includes(sentence), `${ruleId} ${locale}`);
    }
  }
});

test('aria-disabled on a shadow host that is a control exempts the text it draws (C12-10)', () => {
  for (const [attrs, shadow, want] of SHADOW_DISABLED_CASES_C12_10) {
    const light = shadow.includes('<slot>') ? '<span style="color:#aaa">Buy</span>' : '';
    const dom = createDom(page(`<x-d id="h" ${attrs}>${light}</x-d>`));
    dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = shadow;
    const result = runa11yCoreOnDom(dom, { runOnly: ['contrast-minimum'] });
    const r = result.checksResults.find((c) => c.ruleId === 'contrast-minimum');
    assert.equal(r.outcome, want, `${attrs} ${shadow}`);
  }
});

test('symbols beside text that is not seen are judged as symbols (C12-11)', () => {
  for (const body of UNSEEN_TEXT_CASES_C12_11) {
    assert.equal(check(page(body), 'symbol-graphic-contrast').outcome, 'cantTell', body);
  }
  // Text that is seen makes the element text.
  const seen = '<span style="color:#ccc">★★★★☆<span>4 of 5</span></span>';
  assert.equal(check(page(seen), 'symbol-graphic-contrast').outcome, 'notApplicable');
});

test('color: revert on a link gives the browser’s link color (C12-14)', () => {
  for (const [body, want, ratio] of REVERT_LINK_CASES_C12_14) {
    const r = check(page(body), 'contrast-minimum');
    assert.equal(r.outcome, want, body);
    if (ratio)
      assert.equal(Math.round(r.occurrences[0].data.details.metrics.ratio * 100) / 100, ratio);
  }
});

test('text over a positioned ::before that paints is asked about, without a layout (C12-18)', () => {
  const overlay =
    '<style>.h{position:relative;color:#fff}.h::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style>';
  const r = check(page('<div class="h">Hello world</div>', overlay), 'contrast-computable');
  assert.equal(r.outcome, 'cantTell');
  assert.equal(r.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP');
  // Text inside the host too.
  const inner = check(
    page('<div class="h"><p>Hello <b>world</b></p></div>', overlay),
    'contrast-computable'
  );
  assert.equal(inner.outcome, 'cantTell');
  // A ::before that isn't positioned, or paints nothing, is not in the way.
  for (const css of [
    '.h{color:#000}.h::before{content:"";background:#000}',
    '.h{position:relative;color:#000}.h::before{content:"";position:absolute;inset:0}',
    '.h{position:relative;color:#000}.h::before{position:absolute;inset:0;background:#000}'
  ]) {
    const ok = check(
      page('<div class="h">Hello world</div>', `<style>${css}</style>`),
      'contrast-computable'
    );
    assert.equal(ok.outcome, 'pass', css);
  }
});

// A ::before that is not drawn (display: none, visibility: hidden), or one
// too small or too far off to lie under the text (a 4px corner badge, a box
// moved off its host), is no background: the text is measured, and light
// grey on white fails. One that covers its host is still asked about
// (round 12, F12-2).
test('a hidden, small or moved-off ::before leaves the text measured, without a layout (F12-2)', () => {
  const base = '.h{position:relative;color:#eee}';
  for (const pseudo of [
    'content:"";display:none;position:absolute;inset:0;background:#000;z-index:-1',
    'content:"";visibility:hidden;position:absolute;inset:0;background:#000;z-index:-1',
    'content:"";position:absolute;top:0;right:0;width:4px;height:4px;background:#000',
    'content:"";position:absolute;top:100%;left:0;width:100%;height:20px;background:#000',
    'content:"";position:absolute;left:-9999px;top:0;width:200px;height:40px;background:#000'
  ]) {
    const css = `<style>${base}.h::before{${pseudo}}</style>`;
    const body = '<div class="h">Light on white</div>';
    assert.equal(check(page(body, css), 'contrast-computable').outcome, 'pass', pseudo);
    assert.equal(check(page(body, css), 'contrast-minimum').outcome, 'fail', pseudo);
  }
  for (const pseudo of [
    'content:"";position:absolute;top:0;left:0;right:0;bottom:0;background:#000;z-index:-1',
    'content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:#000;z-index:-1',
    'content:"";position:absolute;top:0;left:0;width:300px;height:40px;background:#000;z-index:-1'
  ]) {
    const css = `<style>${base}.h::before{${pseudo}}</style>`;
    const r = check(page('<div class="h">Light on white</div>', css), 'contrast-computable');
    assert.equal(r.outcome, 'cantTell', pseudo);
    assert.equal(r.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP', pseudo);
  }
});
