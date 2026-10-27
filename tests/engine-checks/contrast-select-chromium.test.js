'use strict';

// A drop-down <select> (#219) is measured as the closed control draws it:
// its shown option in the select's own color, font and background. Its
// other options are shown only in the list it opens, which the platform
// draws, so one with colors of its own is asked about
// (SELECT_OPTION_COLOR) rather than measured. A list box and a
// customizable select draw their options as styled, and are measured so.
// The options' colors were measured instead: a black select with #bbb
// options failed, and a #bbb select with black options passed. A select in
// the browser's own background is measured against both the computed
// background and the Field color Chromium paints, and the lower counts.

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

const { addBundle } = require('../helpers/browserBundle');
const RULES = ['contrast-computable', 'contrast-minimum'];

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}select{background:#fff}</style></head><body><main>${body}</main></body></html>`;

const BODY = [
  // Drawn black, with #bbb options.
  '<label>A <select id="a" style="color:#000"><option style="color:#bbb">One</option><option style="color:#bbb">Two</option></select></label>',
  // Drawn #bbb, with black options.
  '<label>B <select id="b" style="color:#bbb"><option style="color:#000">One</option><option style="color:#000">Two</option></select></label>',
  // The shown option is the selected one; the other has the select's colors.
  '<label>C <select id="c" style="color:#000"><option>One</option><option selected style="color:#bbb">Two</option></select></label>',
  // An option's own background is asked about too.
  '<label>D <select id="d" style="color:#000"><option>One</option><option style="background:#ff0">Two</option></select></label>',
  // A list box draws its options.
  '<label>E <select id="e" size="3" style="color:#000"><option style="color:#bbb">One</option><option>Two</option></select></label>'
].join('');

const summarize = (results) => {
  const by = (id) => results.find((r) => r.ruleId === id);
  const computable = by('contrast-computable');
  return {
    asked: computable.occurrences
      .filter((o) => o.selector)
      .map((o) => [
        o.selector,
        o.data.details.reasonCode,
        o.data.details.blockerProperty,
        o.i18n.summaryKey
      ]),
    failed: by('contrast-minimum')
      .occurrences.filter((o) => o.selector)
      .map((o) => [o.selector, Math.round(o.data.details.metrics.ratio * 100) / 100])
  };
};

const EXPECTED = {
  asked: [
    [
      '#a > option:nth-of-type(2)',
      'SELECT_OPTION_COLOR',
      'color',
      'contrastComputable_cantTell_selectOption'
    ],
    [
      '#b > option:nth-of-type(2)',
      'SELECT_OPTION_COLOR',
      'color',
      'contrastComputable_cantTell_selectOption'
    ],
    [
      '#d > option:nth-of-type(2)',
      'SELECT_OPTION_COLOR',
      'background-color',
      'contrastComputable_cantTell_selectOption'
    ]
  ],
  failed: [
    ['#b', 1.92],
    ['#e > option:nth-of-type(1)', 1.92]
  ]
};

test(
  'a drop-down select is measured as the closed control draws it, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const p = await browser.newPage();
    await p.setContent(page(BODY));
    await addBundle(p);
    const results = await p.evaluate(
      (rules) => window.a11ycore.runa11yCoreInPage(null, null, {}, rules).checksResults,
      RULES
    );
    assert.deepEqual(summarize(results), EXPECTED);

    // A select in the browser's own background: Chromium paints its field
    // white (Field), though the computed background is #efefef, which other
    // browsers may paint. Text that fails on either fails, at the lower
    // ratio, and the finding gives both colors.
    const q = await browser.newPage();
    await q.setContent(
      '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head><body><main><label>G <select id="g" style="color:#767676"><option>One</option></select></label></main></body></html>'
    );
    await addBundle(q);
    const g = await q.evaluate(
      () =>
        window.a11ycore.runa11yCoreInPage(null, null, {}, ['contrast-minimum']).checksResults[0]
          .occurrences[0].data.details
    );
    assert.equal(Math.round(g.metrics.ratio * 100) / 100, 3.95);
    assert.deepEqual(g.selectField, { backgroundHex: '#efefef', fieldHex: '#ffffff' });
  }
);

test('a customizable select is measured by its options, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const p = await browser.newPage();
  await p.setContent(
    page(
      '<style>#f, #f::picker(select) { appearance: base-select; }</style><label>F <select id="f" style="color:#000"><button><selectedcontent></selectedcontent></button><option style="color:#bbb">One</option><option>Two</option></select></label>'
    )
  );
  await addBundle(p);
  const results = await p.evaluate(
    (rules) => window.a11ycore.runa11yCoreInPage(null, null, {}, rules).checksResults,
    RULES
  );
  assert.deepEqual(summarize(results), {
    asked: [],
    failed: [['#f > option:nth-of-type(1)', 1.92]]
  });

  // With no <button> of the page's own, the closed control shows the
  // selected option in the select's colors, as a drop-down does; the
  // other options, in the list, in their own.
  const q = await browser.newPage();
  await q.setContent(
    page(
      '<style>#g, #g::picker(select) { appearance: base-select; }</style><label>G <select id="g" style="color:#aaa"><option>One</option><option style="color:#bbb">Two</option></select></label>'
    )
  );
  await addBundle(q);
  const plain = await q.evaluate(
    (rules) => window.a11ycore.runa11yCoreInPage(null, null, {}, rules).checksResults,
    RULES
  );
  assert.deepEqual(summarize(plain), {
    asked: [],
    failed: [
      ['#g', 2.32],
      ['#g > option:nth-of-type(2)', 1.92]
    ]
  });
});

test('a drop-down select is measured as the closed control draws it, in jsdom', () => {
  const result = runa11yCoreOnHtml(page(BODY), { runOnly: RULES });
  assert.deepEqual(summarize(result.checksResults), EXPECTED);
});
