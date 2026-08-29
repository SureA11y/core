'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

const SHELL = '<!doctype html><html lang="en"><head><title>t</title></head><body>';

function scan(html, excludeSelectors) {
  const result = runa11yCoreOnHtml(html, {
    engineOptions: { perfStats: true, excludeSelectors }
  });
  return { counters: result.perfStats.counters };
}

function elementCount(html) {
  return new JSDOM(html).window.document.querySelectorAll('*').length;
}

function body(keepGroups, dropGroups) {
  return (
    SHELL +
    '<div class="keep"><img src="x.png"><button></button></div>'.repeat(keepGroups) +
    '<div class="drop"><img src="y.png"></div>'.repeat(dropGroups) +
    '</body></html>'
  );
}

test('an element resolves its exclusion state once, however many rules query it', () => {
  const html = body(40, 10);
  const { counters } = scan(html, ['.drop', '.other', '.more']);

  assert.strictEqual(
    counters['excluded.miss'],
    elementCount(html),
    'every element should be resolved exactly once'
  );
  assert.ok(
    counters['excluded.hit'] > counters['excluded.miss'] * 10,
    `expected the memo to serve most queries, got ${counters['excluded.hit']} hits for ${counters['excluded.miss']} misses`
  );
});

test('exclusion cost does not grow with the number of selectors', () => {
  const html = body(40, 10);
  const few = scan(html, ['.drop']);
  const many = scan(html, ['.drop', ...Array.from({ length: 60 }, (_, i) => `.c${i}`)]);

  assert.strictEqual(few.counters['excluded.miss'], many.counters['excluded.miss']);
});

test('a deep chain is walked once, not once per element in it', () => {
  const depth = 200;
  const html =
    SHELL + '<div>'.repeat(depth) + '<img src="x.png">' + '</div>'.repeat(depth) + '</body></html>';
  const { counters } = scan(html, ['.nothing-matches']);

  assert.strictEqual(counters['excluded.miss'], elementCount(html));
});

test('rule-scoped excludes do not reuse the global exclude list cache', () => {
  const html =
    SHELL + '<div id="a"><img src="x.png"></div><div id="b"><img src="y.png"></div></body></html>';

  const globalOnly = runa11yCoreOnHtml(html, { engineOptions: { excludeSelectors: ['#a'] } });
  const ruleScoped = runa11yCoreOnHtml(html, {
    engineOptions: {
      excludeSelectors: ['#a'],
      rules: { 'img-alt-present': { excludeSelectors: ['#b'] } }
    }
  });

  const occurrences = (result) => {
    const rule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
    return rule ? (rule.occurrences || []).length : 0;
  };

  assert.strictEqual(occurrences(globalOnly), 1);
  assert.strictEqual(occurrences(ruleScoped), 0);
});
