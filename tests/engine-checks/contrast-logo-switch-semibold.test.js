'use strict';

// Logo-like text and a page's contrast switch still fail the contrast rules,
// as in other engines, with a hint that says why they might not: WCAG 1.4.3
// exempts logo text, and a switch to sufficient contrast meets it (G174). A
// pack's variant of contrast-minimum may ask about them instead, exempt logo
// text, and ask about semi-bold text that would pass as bold.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { definePack } = require('../../src/pack.js');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff">${body}</body></html>`;
const GREY = 'color:#aaa;font-size:16px';

function details(result, ruleId, id) {
  const rule = result.checksResults.find((r) => r.ruleId === ruleId);
  const occ = rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  return occ
    ? {
        ...occ.data.details,
        hintKey: occ.i18n.hintKey,
        outcome: occ.occurrenceOutcome || 'fail',
        hint: occ.hint
      }
    : null;
}

test('logo-like text still fails, with a hint that logo text is exempt', () => {
  const html = page(
    `<div class="navbar-brand"><span id="brand" style="${GREY}">Acme</span></div>` +
      `<div class="Header_logo__x1"><span id="module" style="${GREY}">Acme</span></div>` +
      `<div class="logout"><span id="logout" style="${GREY}">Sign out</span></div>`
  );
  for (const ruleId of ['contrast-minimum', 'contrast-enhanced']) {
    const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
    for (const id of ['brand', 'module']) {
      const d = details(result, ruleId, id);
      assert.equal(d.reasonCode, 'BELOW_THRESHOLD');
      assert.equal(d.looksLikeLogo, true);
      assert.equal(d.hintKey, 'contrast_hint_logo');
      assert.match(d.hint, /logo or brand name/);
    }
    assert.equal(details(result, ruleId, 'logout').looksLikeLogo, undefined);
  }
});

// A brand's colour classes and sections, a nav link to the home page and a
// language switcher are not logos: only a logo word, or a token about the
// site's name, near the text or on its link counts, and a banner's home
// link only with an image or the site's name in it.
test('text in a brand’s style or a navigation link is not taken for a logo', () => {
  const html = page(
    `<button class="btn btn-brand" id="btn" style="${GREY}">Buy now</button>` +
      `<p class="text-brand-500" id="colour" style="${GREY}">Text</p>` +
      `<section class="brand-story"><div><div><div><p id="deep" style="${GREY}">Story</p></div></div></div></section>` +
      `<div class="site-branding"><p id="tagline" style="${GREY}">Just another site</p></div>` +
      `<header><nav><a href="/" id="home" style="${GREY}">Home</a></nav></header>` +
      `<a class="site-logo" href="/"><span id="logo" style="${GREY}">Acme</span></a>`
  );
  const result = runa11yCoreOnHtml(html, { runOnly: ['contrast-minimum'] });
  for (const id of ['btn', 'colour', 'deep', 'tagline', 'home'])
    assert.equal(details(result, 'contrast-minimum', id).looksLikeLogo, undefined, id);
  assert.equal(details(result, 'contrast-minimum', 'logo').looksLikeLogo, true);
});

test('on a page with a contrast switch, failures name it in the hint', () => {
  const html = page(
    `<button>Enable high contrast colors</button><p id="grey" style="${GREY}">Grey text</p>`
  );
  const result = runa11yCoreOnHtml(html, { runOnly: ['contrast-minimum'] });
  const d = details(result, 'contrast-minimum', 'grey');
  assert.equal(d.reasonCode, 'BELOW_THRESHOLD');
  assert.equal(d.contrastSwitch, 'Enable high contrast colors');
  assert.equal(d.hintKey, 'contrast_hint_contrastSwitch');
  // No switch: the ordinary hint.
  const plain = runa11yCoreOnHtml(page(`<p id="grey" style="${GREY}">Grey text</p>`), {
    runOnly: ['contrast-minimum']
  });
  assert.equal(details(plain, 'contrast-minimum', 'grey').hintKey, 'contrastMinimum_hint_fail');
});

const variant = (config) =>
  definePack({
    name: 'settings',
    version: '1.0.0',
    namespace: 'set',
    core: '*',
    rules: [
      {
        id: 'set-contrast',
        from: 'contrast-minimum',
        config,
        meta: {
          title: 'Contrast',
          tags: ['set'],
          i18n: { titleKey: 'setContrast_title', descriptionKey: 'setContrast_description' }
        }
      }
    ]
  });
const scanWith = (html, config) =>
  runa11yCoreOnHtml(html, {
    runOnly: ['set-contrast'],
    engineOptions: { packs: [variant(config)], optInRules: ['set'] }
  });

test("a variant can ask about or exempt logo-like text, and ask on a switch's page", () => {
  const logo = page(`<div id="site-logo"><span id="t" style="${GREY}">Acme</span></div>`);
  const asked = details(scanWith(logo, { logoText: 'ask' }), 'set-contrast', 't');
  assert.equal(asked.reasonCode, 'LOGO_TEXT_BELOW_THRESHOLD');
  assert.equal(asked.outcome, 'cantTell');
  const exempt = scanWith(logo, { logoText: 'exempt' });
  assert.equal(details(exempt, 'set-contrast', 't'), null);
  assert.notEqual(exempt.checksResults.find((r) => r.ruleId === 'set-contrast').outcome, 'fail');

  const sw = page(`<a href="#c">Contraste renforcé</a><p id="t" style="${GREY}">Texte</p>`);
  const s = details(scanWith(sw, { contrastSwitch: 'ask' }), 'set-contrast', 't');
  assert.equal(s.reasonCode, 'CONTRAST_SWITCH_OFFERED');
  assert.equal(s.outcome, 'cantTell');
});

test('a variant can ask about semi-bold text that would pass as bold', () => {
  // #777 on white is 4.48:1: enough for large text, not for other text.
  const html = page(
    '<p id="semi" style="color:#777;font-size:20px;font-weight:600">Semi-bold</p>' +
      '<p id="small" style="color:#777;font-size:16px;font-weight:600">Too small</p>'
  );
  assert.equal(details(scanWith(html, {}), 'set-contrast', 'semi').reasonCode, 'BELOW_THRESHOLD');
  const d = details(scanWith(html, { semiBold: 'ask' }), 'set-contrast', 'semi');
  assert.equal(d.reasonCode, 'SEMIBOLD_BELOW_THRESHOLD');
  assert.equal(d.outcome, 'cantTell');
  assert.equal(
    details(scanWith(html, { semiBold: 'ask' }), 'set-contrast', 'small').reasonCode,
    'BELOW_THRESHOLD'
  );
});

test('a variant given a value its setting does not take is refused', () => {
  assert.throws(
    () => variant({ logoText: 'ignore' }),
    /logoText must be one of "fail", "ask", "exempt"/
  );
});
