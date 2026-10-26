'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULES = ['contrast-computable', 'contrast-minimum', 'contrast-enhanced'];

// Text on a plain background (a measurable failure), on a gradient, under a
// blend mode, and with no opaque background up to the root, coloured by a
// prefers-color-scheme rule jsdom doesn't apply.
const html = `<!doctype html><html><head><title>t</title>
  <style>@media (prefers-color-scheme: light) { #bare { color: #000 } }</style></head><body>
  <div style="background:#fff"><p id="low" style="color:#999;background:#fff">Low contrast</p></div>
  <div style="background:#fff"><p id="grad" style="color:#000;background-image:linear-gradient(#fff,#000)">Gradient</p></div>
  <div style="background:#fff"><p id="blend" style="color:#000;background:#fff;mix-blend-mode:multiply">Blend</p></div>
  <p id="bare" style="color:#000">No background</p>
</body></html>`;

function findings(locale) {
  const result = runa11yCoreOnHtml(html, { runOnly: RULES, engineOptions: { locale } });
  return result.checksResults
    .filter((r) => RULES.includes(r.ruleId))
    .flatMap((r) =>
      r.occurrences
        .filter(
          (o) =>
            (o.occurrenceOutcome || r.outcome) === 'fail' ||
            (o.occurrenceOutcome || r.outcome) === 'cantTell'
        )
        .map((o) => ({ ruleId: r.ruleId, occ: o }))
    );
}

test('contrast findings exercise both fail and cantTell hints', () => {
  const keys = new Set(findings('en').map(({ occ }) => occ.i18n.hintKey));
  assert.ok(keys.has('contrastMinimum_hint_fail'), [...keys].join(', '));
  assert.ok(keys.has('contrastComputable_hint_cantTell_background'), [...keys].join(', '));
  // Text whose colours jsdom can't read in the page's scheme is measured
  // by hand (contrast_hint_cantTell_manual). The hint for a page with no
  // background is given where its canvas can't be known: in a frame or
  // under forced colors (tests/engine-checks/contrast-light-canvas-chromium.test.js).
  assert.ok(keys.has('contrast_hint_cantTell_manual'), [...keys].join(', '));
});

for (const locale of ['en', 'de', 'es', 'fr', 'ja']) {
  test(`every contrast fail and cantTell finding has a hint (${locale})`, () => {
    const empty = findings(locale)
      .filter(({ occ }) => !occ.hint || !occ.hint.trim())
      .map(({ ruleId, occ }) => `${ruleId}:${occ.i18n.summaryKey}`);
    assert.deepEqual(empty, []);
  });
}

test('the fail hint names the ratio the text has to reach', () => {
  const fail = findings('ja').find(({ occ }) => occ.i18n.hintKey === 'contrastMinimum_hint_fail');
  assert.match(fail.occ.hint, /4\.5:1 以上/);
});
