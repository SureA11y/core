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
