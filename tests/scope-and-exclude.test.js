'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

test('contextSelector scopes evaluation to a subtree', () => {
  const html = `
    <!doctype html>
    <html><body>
      <section id="outside">
        <img src="x.png">
      </section>

      <section id="inside">
        <img src="y.png" alt="">
      </section>
    </body></html>
  `;

  // If contextSelector works, only #inside is scanned, so img-alt-attr-present should PASS
  // because the only img in scope has alt (even empty counts as present).
  const result = runa11yCoreOnHtml(html, { contextSelector: '#inside' });

  assertRule(result, 'img-alt-present', 'pass', { maxOccurrences: 0 });
});

test('contextSelector: a single string matching multiple elements scans ALL of them, not just the first', () => {
  // Regression for a real gap found while scoping multi-region support
  // (2026-07-22): contextSelector used to resolve via document.querySelector
  // (first match only) -- a selector matching several elements silently
  // scanned only the first, dropping the rest with no indication anything
  // was skipped. Switched to querySelectorAll semantics for both the
  // single-string and array forms, so "matches this selector" means all
  // matches, consistently -- same as a reference engine's own .include() behavior.
  const html = `
    <!doctype html>
    <html><body>
      <section class="card"><img src="a.png"></section>
      <section class="card"><img src="b.png" alt=""></section>
      <section class="card"><img src="c.png"></section>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, { contextSelector: '.card' });

  const rule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.strictEqual(rule.outcome, 'fail');
  // Both a.png and c.png (missing alt) must be found -- not just the first card.
  assert.strictEqual(rule.occurrences.length, 2);
});

test('contextSelector: an array of selector strings scans the union of all matched regions', () => {
  const html = `
    <!doctype html>
    <html><body>
      <section id="a"><img src="a.png"></section>
      <section id="b"><img src="b.png"></section>
      <section id="c"><img src="c.png" alt="decorative"></section>
    </body></html>
  `;

  // #a and #b's images (both missing alt) should both be found; #c is out of scope.
  const result = runa11yCoreOnHtml(html, { contextSelector: ['#a', '#b'] });

  const rule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences.length, 2);
  assert.ok(rule.occurrences.some((o) => o.html.includes('a.png')));
  assert.ok(rule.occurrences.some((o) => o.html.includes('b.png')));
  assert.ok(!rule.occurrences.some((o) => o.html.includes('c.png')));
});

test('contextSelector: overlapping/nested selector regions do not double-report the same element', () => {
  const html = `
    <!doctype html>
    <html><body>
      <main id="outer">
        <section id="inner">
          <img src="a.png">
        </section>
      </main>
    </body></html>
  `;

  // #outer contains #inner entirely -- the <img> is reachable from both
  // regions, but must only be reported once, not twice.
  const result = runa11yCoreOnHtml(html, { contextSelector: ['#outer', '#inner'] });

  const rule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences.length, 1);
});

test('contextSelector: multi-region contrast scanning does not double-count text in overlapping regions', () => {
  // Dedicated regression for contrast-helpers.js's getTextScan, which builds
  // its own TreeWalker(s) independent of queryAllSmart/queryAll -- confirms
  // the multi-root fix there also guards against double-walking the same
  // text nodes when regions overlap.
  const html = `
    <!doctype html>
    <html><body>
      <main id="outer" style="background:#fff;color:#fff;">
        <p id="inner" style="background:#fff;color:#fff;">Low contrast text</p>
      </main>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    contextSelector: ['#outer', '#inner'],
    runOnly: { includeRuleIds: ['contrast-minimum'] }
  });

  const rule = result.checksResults.find((r) => r.ruleId === 'contrast-minimum');
  assert.ok(rule, 'contrast-minimum should have run');
  if (rule.outcome === 'fail') {
    assert.strictEqual(rule.occurrences.length, 1, 'the same paragraph must only be reported once, not once per overlapping region');
  }
});

test('excludeSelectors skips elements inside excluded subtrees', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div id="excluded">
        <img src="x.png">
      </div>
      <div id="included">
        <img src="y.png" alt="">
      </div>
    </body></html>
  `;

  // Excluding #excluded should remove the failing <img> from consideration.
  const result = runa11yCoreOnHtml(html, { excludeSelectors: ['#excluded'] });

  assertRule(result, 'img-alt-present', 'pass', { maxOccurrences: 0 });
});

test('excludeSelectors + contextSelector: exclusions still apply within context', () => {
  const html = `
    <!doctype html>
    <html><body>
      <main id="app">
        <div class="modal">
          <img src="x.png">
        </div>
        <div class="content">
          <img src="y.png" alt="">
        </div>
      </main>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    contextSelector: '#app',
    excludeSelectors: ['.modal']
  });

  assertRule(result, 'img-alt-present', 'pass', { maxOccurrences: 0 });
});

test('excludeSelectors accepts comma-separated string selectors', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div id="excluded">
        <img src="x.png">
      </div>
      <div class="also-excluded">
        <img src="z.png">
      </div>
      <div id="included">
        <img src="y.png" alt="">
      </div>
    </body></html>
  `;

  // String form should behave like ['#excluded', '.also-excluded']
  const result = runa11yCoreOnHtml(html, {
    excludeSelectors: '#excluded, .also-excluded'
  });

  assertRule(result, 'img-alt-present', 'pass', { maxOccurrences: 0 });
});
