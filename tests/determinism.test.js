'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('./helpers/runDomRulesOnHtml');

test('engine output is deterministic for rule ordering and occurrence ordering', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img src="1.png">
      <img src="2.png">
      <a target="_blank" href="https://x.test/">X</a>
      <input type="text" id="a">
    </body></html>
  `;

  const a = runa11yCoreOnHtml(html, {
    engineOptions: { includeShadowDom: false, excludeSelectors: [] }
  });
  const b = runa11yCoreOnHtml(html, {
    engineOptions: { includeShadowDom: false, excludeSelectors: [] }
  });

  // Compare shape deterministically:
  // - checks order
  // - occurrences order per rule
  const aRuleIds = a.checksResults.map((r) => r.ruleId);
  const bRuleIds = b.checksResults.map((r) => r.ruleId);

  assert.deepEqual(aRuleIds, bRuleIds);

  for (let i = 0; i < a.checksResults.length; i++) {
    const ra = a.checksResults[i];
    const rb = b.checksResults[i];
    assert.equal(ra.ruleId, rb.ruleId);

    const occA = (ra.occurrences || []).map(
      (o) => `${o.selector}::${(o.summary || '').slice(0, 40)}`
    );
    const occB = (rb.occurrences || []).map(
      (o) => `${o.selector}::${(o.summary || '').slice(0, 40)}`
    );
    assert.deepEqual(occA, occB);
  }
});

test('every rule reaches the same verdict alone as it does in a full scan', () => {
  // Shared state that leaks a traversal-specific value between rules shows up
  // as a rule disagreeing with itself: run the whole ruleset, then run each
  // rule by itself against a fresh parse of the same page.
  //
  // An aria-labelledby pointing at an ancestor makes the name computation
  // re-enter the element. The cycle guard returns '' for that inner visit, and
  // caching that '' handed it to whichever rule asked next, so label-in-name
  // failed an element on a full scan that it passes on its own.
  //
  // entryPointParity: false is load-bearing. The shared cache hangs off the
  // window, so running both entry points over one document lets the first
  // populate what the second reads, and the two agree on a value neither
  // would have reached alone.
  const FIXTURES = [
    'presentational-children-focusable-absent-all-scenarios.html',
    'label-in-name-all-scenarios.html',
    'binary-control-name-present-all-scenarios.html'
  ];

  for (const name of FIXTURES) {
    const html = fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
    const whole = runa11yCoreOnHtml(html, { entryPointParity: false });

    for (const result of whole.checksResults) {
      // The object form is what actually scopes a run; a bare array is
      // accepted and then ignored, which would make this a second full scan.
      const alone = runa11yCoreOnHtml(html, {
        runOnly: { includeRuleIds: [result.ruleId] },
        entryPointParity: false
      }).checksResults.find((r) => r.ruleId === result.ruleId);

      assert.strictEqual(
        `${alone.outcome}:${alone.occurrences.length}`,
        `${result.outcome}:${result.occurrences.length}`,
        `${name}: ${result.ruleId} disagrees with itself depending on which other rules ran`
      );
    }
  }
});

test('scanning the same document twice gives the same result', () => {
  // The shared cache hangs off the window, so it survives one scan into the
  // next. A value only valid inside the traversal that produced it must not
  // reach the scan after.
  const html = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'presentational-children-focusable-absent-all-scenarios.html'),
    'utf8'
  );
  const dom = createDom(html);

  const shape = (r) =>
    r.checksResults.map((c) => `${c.ruleId}:${c.outcome}:${c.occurrences.length}`);
  assert.deepStrictEqual(
    shape(runa11yCoreOnDom(dom, { entryPointParity: false })),
    shape(runa11yCoreOnDom(dom, { entryPointParity: false }))
  );
});
