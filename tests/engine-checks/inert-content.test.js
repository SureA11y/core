'use strict';

/**
 * An [inert] subtree is out of the accessibility tree and takes no focus and
 * no click, as the page behind an open modal dialog is (the browser makes it
 * inert). Every rule leaves it out through one exclusion, the shared
 * hidden-content policy (isHiddenContent, queryAllSmart), instead of each
 * rule deciding it alone: img-alt-decorative asked about an inert image that
 * img-alt-present skipped (#226), and the ARIA, list, table, language and
 * keyboard rules judged inert content.
 *
 * Each failing or flagged example of docs/RULE_EXAMPLES.md is scanned with
 * its body inside <div inert>: nothing in it is reported, except by the
 * rules left alone on purpose below.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { readExamples, toPage } = require('../../src/rule-docs.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const { JUDGED_WHEN_INERT, inertPage } = require('../helpers/inertContent.js');

function outcome(html, ruleId) {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const result = runa11yCoreOnHtml(html, {
      runOnly: { includeRuleIds: [ruleId] },
      entryPointParity: false
    });
    return result.checksResults.find((c) => c.ruleId === ruleId);
  } finally {
    console.warn = warn;
  }
}

const examples = readExamples(path.join(__dirname, '../../docs/RULE_EXAMPLES.md')).filter(
  (e) => e.expected === 'fail' || e.expected === 'cantTell'
);

test('no rule reports what is inside an inert subtree, but the ones left alone on purpose', () => {
  const judged = [];
  for (const ex of examples) {
    const page = toPage(ex.html);
    const inert = outcome(inertPage(page), ex.ruleId);
    if (JUDGED_WHEN_INERT[ex.ruleId]) {
      // Left alone: as without inert.
      assert.equal(inert.outcome, outcome(page, ex.ruleId).outcome, `${ex.ruleId}: ${ex.label}`);
      continue;
    }
    if (inert.outcome !== 'notApplicable' && inert.outcome !== 'pass')
      judged.push(`${ex.ruleId} (${ex.label}): ${inert.outcome}`);
  }
  assert.deepEqual(judged, []);
});

test('img-alt-decorative asks about an aria-hidden image, and not an inert one, as img-alt-present skips it', () => {
  const page = (attr) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div ${attr}><img src="a.png"></div></main></body></html>`;
  assert.equal(outcome(page('aria-hidden="true"'), 'img-alt-decorative').outcome, 'cantTell');
  assert.equal(outcome(page('inert'), 'img-alt-decorative').outcome, 'notApplicable');
  assert.equal(outcome(page('inert'), 'img-alt-present').outcome, 'notApplicable');
});

test('includeHiddenElements: true judges inert content, as other hidden content', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<div inert><span lang="xx-invalid-tag-zz">Text</span></div></main></body></html>';
  assert.equal(outcome(html, 'valid-lang').outcome, 'notApplicable');
  const kept = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['valid-lang'] },
    engineOptions: { includeHiddenElements: true },
    entryPointParity: false
  });
  assert.equal(kept.checksResults[0].outcome, 'fail');
});

test('inert content inside an open modal dialog is left out, and so is the page behind it', () => {
  const page = (modal) =>
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Shop</h1>' +
    '<p id="behind" lang="xx-invalid-tag-zz">Text</p></main>' +
    modal +
    '</body></html>';
  const modal =
    '<dialog open aria-modal="true" aria-label="Sign in"><p id="in" lang="yy-invalid-tag-zz">Sign in</p>' +
    '<div inert><p id="inert-in" lang="zz-invalid-tag-zz">Later</p></div></dialog>';
  // A rule about how content looks judges inert content, but not behind a modal.
  const spaced =
    '<div inert><p id="spaced" style="line-height:1.2 !important">The toy brought back fond memories of being lost in the rain forest.</p></div>';
  assert.equal(outcome(page(spaced), 'avoid-inline-spacing').outcome, 'fail');
  assert.equal(outcome(page(spaced + modal), 'avoid-inline-spacing').outcome, 'notApplicable');

  const rule = outcome(page(modal), 'valid-lang');
  assert.deepEqual(
    rule.occurrences.map((o) => /id="([^"]+)"/.exec(o.html)[1]),
    ['in']
  );
});
