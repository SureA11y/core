'use strict';

/**
 * jsdom's CSS parser drops the space-separated `clip: rect(0 0 0 0)` of the
 * visually hidden pattern: it computes as `auto`, and a style rule keeps
 * only its first edge. Where the page has no layout, the engine reads the
 * clip as declared, in the style attribute or a <style> element, so a
 * visually hidden label is taken as clipped in jsdom as in Chromium.
 *
 * The Chromium test is skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { addBundle } = require('../helpers/browserBundle');

const FIXTURE = fs.readFileSync(
  path.join(
    __dirname,
    '../fixtures/form-control-programmatic-label-quality-manual-all-scenarios.html'
  ),
  'utf8'
);

// Two fields with the same label text, each label visually hidden: by the
// style attribute, by a style rule, and by a rule inside @media.
const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
const PAGES = {
  inline:
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    `<label for="a" style="${SR}">Search</label><input id="a">` +
    `<label for="b" style="${SR}">Search</label><input id="b"></main></body></html>`,
  stylesheet:
    `<!doctype html><html lang="en"><head><title>t</title><style>.sr{${SR}}</style></head>` +
    '<body><main><label for="a" class="sr">Search</label><input id="a">' +
    '<label for="b" class="sr">Search</label><input id="b"></main></body></html>',
  media:
    `<!doctype html><html lang="en"><head><title>t</title><style>/* x */ @media all { .sr { ${SR} !important } }</style></head>` +
    '<body><main><label for="a" class="sr">Search</label><input id="a">' +
    '<label for="b" class="sr">Search</label><input id="b"></main></body></html>'
};

const RULE = 'form-control-label-quality';
const flagged = (result) =>
  result.checksResults.find((c) => c.ruleId === RULE).occurrences.map((o) => o.selector);

test('a label clipped by a space-separated rect() is visually hidden in jsdom', () => {
  for (const [name, html] of Object.entries(PAGES)) {
    const { window } = new JSDOM(html, { pretendToBeVisual: true });
    const { document } = window;
    const helpers = createDomHelpers({ window, document, root: document });
    for (const label of document.querySelectorAll('label')) {
      assert.ok(helpers.getVisibilityHintsInfo(label).hints.includes('clipped'), name);
      assert.equal(helpers.isVisuallyHidden(label), true, name);
    }
    // A label clipped by nothing stays visible.
    document.querySelector('label').removeAttribute('style');
    document.querySelector('label').removeAttribute('class');
    // The helpers keep computed styles for the run on the window.
    window.__a11ycoreSharedCache = {};
    const fresh = createDomHelpers({ window, document, root: document });
    assert.equal(fresh.isVisuallyHidden(document.querySelector('label')), false, name);
    assert.deepEqual(flagged(runa11yCoreOnHtml(html, { runOnly: [RULE] })), [], name);
  }
});

test('the fixture’s clipped labels (cases 16 and 18) are not flagged in jsdom', () => {
  const found = flagged(runa11yCoreOnHtml(FIXTURE, { runOnly: [RULE] }));
  assert.ok(!found.includes('#fcq_case_16'), found.join(', '));
  assert.ok(!found.includes('#fcq_case_18'), found.join(', '));
});

test('jsdom and Chromium agree on clipped labels', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [name, html] of Object.entries({ fixture: FIXTURE, ...PAGES })) {
    const page = await browser.newPage();
    await page.setContent(html);
    await addBundle(page);
    const inChromium = await page.evaluate(
      (rule) =>
        window.a11ycore
          .runa11yCoreInPage(null, null, {}, [rule])
          .checksResults[0].occurrences.map((o) => o.selector),
      RULE
    );
    await page.close();
    const inJsdom = flagged(runa11yCoreOnHtml(html, { runOnly: [RULE] }));
    for (const sel of ['#fcq_case_16', '#fcq_case_18', '#a', '#b'])
      assert.equal(inJsdom.includes(sel), inChromium.includes(sel), `${name} ${sel}`);
  }
});

// The declared clip is the one the cascade applies, read from every sheet
// core can read: !important over normal, the style attribute over a rule of
// the same importance, a declaration outside a cascade layer over one in it,
// then specificity and order; a rule under @media print doesn't apply. Each
// page has two labels, #a and #b, with the same text, under `.sr`, which
// positions them; `hidden` says whether the cascade's clip hides them.
const BOX = 'position:absolute';
const cascadePage = (css, attr = '') =>
  `<!doctype html><html lang="en"><head><title>t</title><style>.sr{${BOX}} ${css}</style></head>` +
  `<body><main><label for="x" id="a" class="sr"${attr}>Search</label><input id="x">` +
  `<label for="y" id="b" class="sr"${attr}>Search</label><input id="y"></main></body></html>`;
const CASCADE = {
  'a more specific rule wins over a later one': [
    cascadePage('label[id]{clip:auto} .sr{clip:rect(0 0 0 0)}'),
    false
  ],
  '!important wins over a more specific rule': [
    cascadePage('.sr{clip:rect(0 0 0 0) !important} label[id]{clip:auto}'),
    true
  ],
  'an !important rule wins over the style attribute': [
    cascadePage('.sr{clip:rect(0 0 0 0) !important}', ' style="clip:auto"'),
    true
  ],
  'the style attribute wins over a rule': [
    cascadePage('label.sr[id]{clip:auto}', ' style="clip:rect(0 0 0 0)"'),
    true
  ],
  'a rule outside a cascade layer wins over a later one in it': [
    cascadePage('.sr{clip:rect(0 0 0 0)} @layer base { label.sr[id] { clip: auto } }'),
    true
  ],
  'a later cascade layer wins': [
    cascadePage(
      '@layer one, two; @layer two { .sr { clip: rect(0 0 0 0) } } @layer one { label.sr[id] { clip: auto } }'
    ),
    true
  ],
  'a rule for print does not apply': [
    cascadePage('.sr{clip:rect(0 0 0 0)} @media print { .sr { clip: auto } }'),
    true
  ]
};

function hiddenInJsdom(html, styleSheetTexts) {
  const { window } = new JSDOM(html, { pretendToBeVisual: true, url: 'https://site.example/' });
  const { document } = window;
  const helpers = createDomHelpers({ window, document, root: document, styleSheetTexts });
  return [...document.querySelectorAll('label')].map((l) => helpers.isVisuallyHidden(l));
}

test('the declared clip is the one the cascade applies, in jsdom', () => {
  for (const [name, [html, hidden]] of Object.entries(CASCADE))
    assert.deepEqual(hiddenInJsdom(html), [hidden, hidden], name);
});

test('the declared clip is read from a sheet engineOptions.styleSheetTexts gives', () => {
  const html = cascadePage('', '').replace(
    '<style>',
    '<style>@import "https://cdn.example/sr.css";'
  );
  const texts = [{ href: 'https://cdn.example/sr.css', text: '.sr { clip: rect(0 0 0 0) }' }];
  assert.deepEqual(hiddenInJsdom(html), [false, false]);
  assert.deepEqual(hiddenInJsdom(html, texts), [true, true]);
  const { window } = new JSDOM(html, { pretendToBeVisual: true, url: 'https://site.example/' });
  const helpers = createDomHelpers({
    window,
    document: window.document,
    root: window.document,
    styleSheetTexts: texts
  });
  const hints = helpers.getVisibilityHintsInfo(window.document.getElementById('a'));
  assert.ok(hints.hints.includes('clipped'));
  assert.equal(hints.metrics.clip, 'rect(0 0 0 0)');
});

test('jsdom and Chromium agree on the cascade of clip', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [name, [html, hidden]] of Object.entries(CASCADE)) {
    const page = await browser.newPage();
    await page.setContent(html);
    const inChromium = await page.evaluate(() =>
      [...document.querySelectorAll('label')].map((l) => getComputedStyle(l).clip !== 'auto')
    );
    await page.close();
    assert.deepEqual(inChromium, [hidden, hidden], `${name}: Chromium`);
    assert.deepEqual(hiddenInJsdom(html), inChromium, name);
  }
});
