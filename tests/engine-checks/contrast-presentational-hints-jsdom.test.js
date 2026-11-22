'use strict';

// Under jsdom, the contrast helpers read the colours HTML's presentational
// hints and SVG's fill attribute set, as a browser draws them, and a style
// or CSS rule still wins over a hint (round 11, B11-1).

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'contrast-minimum';

function contrast(body, { head = '', bodyAttrs = '' } = {}) {
  const r = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>Hints</title>${head}</head><body${bodyAttrs}><main>${body}</main></body></html>`,
    { runOnly: [RULE_ID] }
  ).checksResults.find((c) => c.ruleId === RULE_ID);
  return [
    r.outcome,
    // Each pair of colours measured, once.
    [
      ...new Set(
        r.occurrences
          .map((o) => /foreground: (#\w+), background: (#\w+)/.exec(o.summary || ''))
          .filter(Boolean)
          .map((m) => `${m[1]} on ${m[2]}`)
      )
    ]
  ];
}

test(`${RULE_ID}: presentational colour hints are read under jsdom`, () => {
  const faint = ['fail', ['#eeeeee on #ffffff']];
  assert.deepStrictEqual(contrast('<p><font color="#eeeeee">Old font tag text</font></p>'), faint);
  assert.deepStrictEqual(contrast('<p><font color="eeeeee">Legacy colour</font></p>'), faint);
  assert.deepStrictEqual(
    contrast('<p><font color="#eeeeee">Outer <span>inner text</span></font></p>'),
    ['fail', ['#eeeeee on #ffffff']]
  );
  assert.deepStrictEqual(
    contrast('<p>Body text attribute</p>', { bodyAttrs: ' text="#eeeeee"' }),
    faint
  );
  assert.deepStrictEqual(
    contrast('<p>Go to <a href="/x">the faint link</a> now please.</p>', {
      bodyAttrs: ' link="#eeeeee"'
    }),
    faint
  );
  assert.deepStrictEqual(
    contrast('<table><tr><td bgcolor="#222222">Dark cell with default text</td></tr></table>'),
    ['fail', ['#000000 on #222222']]
  );
  assert.deepStrictEqual(
    contrast('<table bgcolor="#111111"><tr><td>Dark table default text</td></tr></table>'),
    ['fail', ['#000000 on #111111']]
  );
  assert.deepStrictEqual(
    contrast(
      '<svg width="200" height="30"><text x="0" y="20" fill="#eee">SVG text label</text></svg>'
    ),
    faint
  );
  assert.deepStrictEqual(
    contrast(
      '<svg width="200" height="30"><g fill="#eee"><text x="0" y="20">SVG text label</text></g></svg>'
    ),
    faint
  );
});

test(`${RULE_ID}: a style or CSS rule wins over a presentational hint under jsdom`, () => {
  const pass = ['pass', []];
  assert.deepStrictEqual(
    contrast('<p><font color="#eeeeee" style="color:#000">Font with style</font></p>'),
    pass
  );
  assert.deepStrictEqual(
    contrast('<p><font color="#eeeeee" class="k">Font with class</font></p>', {
      head: '<style>.k{color:#000}</style>'
    }),
    pass
  );
  assert.deepStrictEqual(
    contrast('<table><tr><td bgcolor="#222222" style="background:#fff">Cell</td></tr></table>'),
    pass
  );
  assert.deepStrictEqual(
    contrast(
      '<svg width="200" height="30"><text x="0" y="20" fill="#eee" style="fill:#000">SVG text</text></svg>'
    ),
    pass
  );
});

// Without a layout, where an SVG shape paints can't be told: text painted
// after a shape in its <svg> is asked about, not measured against white
// (round 11, R11F-1), unless the shape certainly covers it (round 11, D11,
// below).
test(`${RULE_ID}: SVG text after a painted SVG shape is asked about under jsdom`, () => {
  const svgPage = (inner) =>
    `<!doctype html><html lang="en"><head><title>Hints</title></head><body><main><svg width="200" height="40">${inner}</svg></main></body></html>`;
  const outcomes = (inner) => {
    const r = runa11yCoreOnHtml(svgPage(inner), {
      runOnly: [RULE_ID, 'contrast-computable']
    }).checksResults;
    const of = (id) => r.find((c) => c.ruleId === id);
    return [
      of(RULE_ID).outcome,
      of('contrast-computable').outcome,
      of('contrast-computable')
        .occurrences.map((o) => o.reasonCode || '')
        .join()
    ];
  };
  const text = (attrs) => `<text x="10" y="25" ${attrs}>Revenue 2026</text>`;
  for (const inner of [
    `<g><circle cx="60" cy="20" r="60" fill="#333"/></g>${text('fill="#aaaaaa"')}`,
    `<rect width="200" height="40" fill="none" stroke="#000"/>${text('fill="#aaaaaa"')}`
  ]) {
    assert.deepStrictEqual(outcomes(inner).slice(0, 2), ['notApplicable', 'cantTell'], inner);
  }
  // Nothing painted before the text: measured as before.
  for (const inner of [
    `${text('fill="#eeeeee"')}<rect width="200" height="40" fill="#000"/>`,
    `<defs><rect id="r" width="200" height="40" fill="#000"/></defs>${text('fill="#eeeeee"')}`,
    `<rect width="200" height="40" fill="none"/>${text('fill="#eeeeee"')}`
  ]) {
    assert.deepStrictEqual(outcomes(inner).slice(0, 2), ['fail', 'pass'], inner);
  }
});

// Without a layout, the simple, certain case is measured: an opaque <rect>,
// <circle> or <ellipse>, with no transform, opacity, filter, mask or clip,
// whose geometry covers the text's area, is its background. The last such
// shape counts; an uncertain shape painted after it keeps the text asked
// about (round 11, D11).
test(`${RULE_ID}: SVG text over a shape that certainly covers it is measured under jsdom (round 11, D11)`, () => {
  const svgPage = (inner, attrs = 'width="200" height="40"') =>
    `<!doctype html><html lang="en"><head><title>Hints</title></head><body><main><svg ${attrs}>${inner}</svg></main></body></html>`;
  const outcomes = (inner, attrs) => {
    const r = runa11yCoreOnHtml(svgPage(inner, attrs), {
      runOnly: [RULE_ID, 'contrast-computable']
    }).checksResults;
    const of = (id) => r.find((c) => c.ruleId === id);
    const occ = of(RULE_ID).occurrences[0];
    return [
      of(RULE_ID).outcome,
      of('contrast-computable').outcome,
      occ && occ.data && occ.data.details ? occ.data.details.colors.backgroundHex : null
    ];
  };
  const text = (attrs) => `<text x="10" y="25" ${attrs}>Revenue 2026</text>`;
  // Measured: black under the text, so #333 fails and #aaa passes.
  for (const [inner, attrs] of [
    [`<rect width="200" height="40" fill="#000"/>${text('fill="#333"')}`],
    [`<rect width="200" height="40" style="fill:#000"/>${text('style="fill:#333"')}`],
    [`<rect width="100%" height="100%" fill="#000"/>${text('fill="#333"')}`],
    [`<rect width="100" height="20" fill="#000"/>${text('fill="#333"')}`, 'viewBox="0 0 100 20"'],
    [
      `<rect x="5" y="5" width="190" height="30" fill="#000"/>${text('fill="#333" font-size="12"')}`
    ],
    [`<g><rect width="200" height="40" fill="#000"/></g>${text('fill="#333"')}`],
    [
      `<circle cx="100" cy="100" r="200" fill="#000"/>${text('fill="#333" font-size="10"')}`,
      'width="400" height="400"'
    ],
    [`<ellipse cx="60" cy="20" rx="100" ry="40" fill="#000"/>${text('fill="#333" font-size="8"')}`],
    // An uncertain shape under the certain one is hidden by it.
    [
      `<circle cx="5" cy="5" r="3" fill="#fff"/><rect width="200" height="40" fill="#000"/>${text('fill="#333"')}`
    ],
    // The last certain shape is the background.
    [
      `<rect width="200" height="40" fill="#fff"/><rect width="200" height="40" fill="#000"/>${text('fill="#333"')}`
    ]
  ]) {
    assert.deepStrictEqual(outcomes(inner, attrs), ['fail', 'pass', '#000000'], inner);
  }
  // Asked about: not certain, or an uncertain shape painted after the
  // certain one.
  for (const inner of [
    `<rect x="5" y="5" width="100" height="30" fill="#000"/>${text('fill="#333" font-size="12"')}`,
    `<rect width="200" height="40" fill="#000" transform="rotate(5)"/>${text('fill="#333"')}`,
    `<rect width="200" height="40" fill="#000" opacity=".5"/>${text('fill="#333"')}`,
    `<rect width="200" height="40" fill="#000" fill-opacity=".5"/>${text('fill="#333"')}`,
    `<rect width="200" height="40" fill="rgba(0,0,0,.5)"/>${text('fill="#333"')}`,
    `<g opacity=".5"><rect width="200" height="40" fill="#000"/></g>${text('fill="#333"')}`,
    `<g filter="url(#f)"><rect width="200" height="40" fill="#000"/></g>${text('fill="#333"')}`,
    `<rect width="200" height="40" rx="20" fill="#000"/>${text('fill="#333"')}`,
    `<rect x="5" y="5" width="190" height="30" fill="#000"/>${text('fill="#333" font-size="12" dx="3"')}`,
    `<rect width="200" height="40" fill="#000"/><circle cx="5" cy="5" r="3" fill="#fff"/>${text('fill="#333"')}`,
    `<rect width="200" height="40" fill="#000"/><path d="M0 0h10v10z" fill="#fff"/>${text('fill="#333"')}`
  ]) {
    assert.deepStrictEqual(outcomes(inner).slice(0, 2), ['notApplicable', 'cantTell'], inner);
  }
});
