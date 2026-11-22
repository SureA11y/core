'use strict';

/**
 * Text contrast: what the twelfth stress test found (C12-n), under jsdom.
 * The same cases run in Chromium in contrast-round-12-chromium.test.js,
 * where they apply, and the two agree, except where jsdom, which has no
 * layout, asks or reads boxes from the markup alone (SVG text over a shape,
 * a ::before that may lie under text, a sign in a flex or grid item).
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
  // Drawn, the rect may lie under the text, and without a layout that
  // can't be measured: the text is asked about.
  const drawn = check(
    svgPage('<rect width="300" height="100" fill="#000"/>' + label),
    'contrast-computable'
  );
  assert.equal(drawn.outcome, 'cantTell');
  assert.equal(drawn.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP');
  assert.equal(drawn.occurrences[0].data.details.blockerNoLayout, true);
});

// Without a layout, no SVG text over a drawn shape is measured, whatever
// its geometry: the text is asked about, and Chromium measures it.
test('SVG text over a drawn shape is asked about, without a layout', () => {
  for (const inner of [
    '<rect width="300" height="60" fill="#000"/><text x="10" y="30" font-size="20" fill="#fff">Sales</text>',
    '<rect width="300" height="100" fill="#000"/><text x="100" y="50" fill="#fff">Sales</text>',
    '<circle cx="120" cy="45" r="100" fill="#000"/><text x="100" y="50" fill="#fff">Sales</text>',
    '<rect width="190" height="40" fill="#000"/><text x="4" y="27" font-size="16" fill="#fff">MMMMMMMMMM</text>'
  ]) {
    const r = check(svgPage(inner), 'contrast-computable');
    assert.equal(r.outcome, 'cantTell', inner);
    assert.equal(r.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP', inner);
    assert.equal(
      r.occurrences[0].i18n.summaryKey,
      'contrastComputable_cantTell_backgroundOverlapNoLayout',
      inner
    );
  }
});

// Without a layout, a flex or grid item, a float and a positioned box are
// not taken as block boundaries: jsdom doesn't blockify their display, and
// the box structure is not guessed. A sign there is read with the digits
// beside it, as text; Chromium, which computes their display as block,
// keeps it a graphic (docs/LIMITATIONS.md).
test('a sign that is a flex or grid item, or beside a float or a positioned box, is read with its text, without a layout (C12-1)', () => {
  for (const body of SIGN_CASES_C12_1) {
    assert.equal(check(page(body), 'contrast-minimum').outcome, 'fail', body);
    assert.equal(check(page(body), 'symbol-graphic-contrast').outcome, 'notApplicable', body);
  }
  // Across a block element, the sign is a graphic.
  const block = '<div style="color:#000"><div style="color:#aaa">$</div><div>45.00</div></div>';
  assert.equal(check(page(block), 'contrast-minimum').outcome, 'pass');
  assert.equal(check(page(block), 'symbol-graphic-contrast').outcome, 'cantTell');
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
  assert.equal(r.occurrences[0].data.details.blockerNoLayout, true);
  // Text inside the host, where the host gives it its background.
  const inner = check(
    page(
      '<div class="h"><p>Hello <b>world</b></p></div>',
      overlay.replace('.h{', '.h{background:#fff;')
    ),
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

// A ::before that is not drawn (display: none, visibility: hidden) is no
// background: the text is measured, and light grey on white fails. Its size
// and offsets are not read: where it lies needs a layout, so one that is
// drawn is asked about, a small corner badge too (round 12, F12-2). Only the
// text's own element and the one that gives it its background count: a
// badge on another ancestor between them doesn't (docs/LIMITATIONS.md).
test('a hidden ::before leaves the text measured, a drawn one is asked about, without a layout (F12-2)', () => {
  const base = '.h{position:relative;color:#eee}';
  for (const pseudo of [
    'content:"";display:none;position:absolute;inset:0;background:#000;z-index:-1',
    'content:"";visibility:hidden;position:absolute;inset:0;background:#000;z-index:-1'
  ]) {
    const css = `<style>${base}.h::before{${pseudo}}</style>`;
    const body = '<div class="h">Light on white</div>';
    assert.equal(check(page(body, css), 'contrast-computable').outcome, 'pass', pseudo);
    assert.equal(check(page(body, css), 'contrast-minimum').outcome, 'fail', pseudo);
  }
  for (const pseudo of [
    'content:"";position:absolute;top:0;left:0;right:0;bottom:0;background:#000;z-index:-1',
    'content:"";position:absolute;top:0;right:0;width:4px;height:4px;background:#000',
    'content:"";position:absolute;top:100%;left:0;width:100%;height:20px;background:#000'
  ]) {
    const css = `<style>${base}.h::before{${pseudo}}</style>`;
    const r = check(page('<div class="h">Light on white</div>', css), 'contrast-computable');
    assert.equal(r.outcome, 'cantTell', pseudo);
    assert.equal(r.occurrences[0].data.details.reasonCode, 'BACKGROUND_OVERLAP', pseudo);
  }
  // A badge on an ancestor that gives the text no background.
  const badge =
    '<style>.card{position:relative}.card::after{content:"";position:absolute;top:0;right:0;width:8px;height:8px;background:#c00}p{color:#eee}</style>';
  const r = check(page('<div class="card"><p>Light on white</p></div>', badge), 'contrast-minimum');
  assert.equal(r.outcome, 'fail');
});

// Text the flat tree leaves out is not rendered, so not measured: a light
// child of a shadow host that no slot takes, and the fallback of a slot that
// has nodes assigned (CSS Scoping 1; round 12, F12-7).
test('text no slot takes, and slot fallback that is not shown, are left out of the contrast scan (F12-7)', () => {
  const run = (host, shadow) => {
    const dom = createDom(page(host));
    dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = shadow;
    const result = runa11yCoreOnDom(dom, { runOnly: ['contrast-minimum'] });
    return result.checksResults.find((c) => c.ruleId === 'contrast-minimum');
  };
  // No slot: the host's grey text is not rendered.
  assert.notEqual(
    run('<x-s id="h" style="color:#bbb">Unrendered grey</x-s>', '<p>Shadow only</p>').outcome,
    'fail'
  );
  // Only a named slot: the unassigned grey text is not rendered.
  assert.notEqual(
    run(
      '<x-s id="h" style="color:#bbb">Unassigned grey<b slot="a" style="color:#000">Bold</b></x-s>',
      '<slot name="a"></slot>'
    ).outcome,
    'fail'
  );
  // Text assigned to the slot: its grey fallback is not rendered.
  assert.notEqual(
    run(
      '<x-s id="h">Assigned text</x-s>',
      '<slot style="color:#000"><span style="color:#bbb">fallback</span></slot>'
    ).outcome,
    'fail'
  );
  // With nothing assigned, the fallback is rendered and measured.
  assert.equal(
    run(
      '<x-s id="h"></x-s>',
      '<slot style="color:#000"><span style="color:#bbb">fallback</span></slot>'
    ).outcome,
    'fail'
  );
  // Slotted grey text is still measured.
  assert.equal(
    run('<x-s id="h">Slotted grey</x-s>', '<slot style="color:#bbb"></slot>').outcome,
    'fail'
  );
});
