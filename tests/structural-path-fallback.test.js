'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

// A rule that hand-builds occurrences makes the engine re-find each element
// with document.querySelector. One such occurrence is fine and a few
// document-level rules produce one; a count that grows with the page is
// quadratic, since every occurrence costs a document-wide query.
const FALLBACK_COUNTER = 'structuralPath.selectorFallback';

function fallbacksFor(elementCount) {
  const body = '<img src="x.png">'.repeat(elementCount);
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  const result = runa11yCoreOnHtml(html, { engineOptions: { perfStats: true } });

  return {
    fallbacks: result.perfStats.counters[FALLBACK_COUNTER] || 0,
    occurrences: result.checksResults.reduce((n, r) => n + (r.occurrences || []).length, 0)
  };
}

test('selector fallbacks do not grow with the size of the page', () => {
  const small = fallbacksFor(20);
  const large = fallbacksFor(400);

  assert.ok(
    large.occurrences > small.occurrences * 5,
    `the larger page should produce many more occurrences (${small.occurrences} -> ${large.occurrences})`
  );

  assert.equal(
    large.fallbacks,
    small.fallbacks,
    `a rule is hand-building occurrences instead of using helpers.reportOccurrence: ` +
      `fallbacks went ${small.fallbacks} -> ${large.fallbacks} while occurrences went ` +
      `${small.occurrences} -> ${large.occurrences}`
  );
});

test('region reports its elements rather than re-finding them', () => {
  const body = '<img src="x.png">'.repeat(200);
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

  const withRegion = runa11yCoreOnHtml(html, {
    engineOptions: { perfStats: true, rules: { include: 'region' } }
  });
  const rule = withRegion.checksResults.find((r) => r.ruleId === 'region');

  assert.equal(rule.outcome, 'cantTell');
  assert.equal(rule.occurrences.length, 200, 'still one occurrence per unplaced element');
  assert.equal(
    withRegion.perfStats.counters[FALLBACK_COUNTER] || 0,
    0,
    'region must not fall back to re-resolving its own elements'
  );

  for (const occurrence of rule.occurrences) {
    assert.ok(Array.isArray(occurrence.structuralPath), 'structuralPath is still populated');
    assert.equal(typeof occurrence.selector, 'string');
    assert.ok(occurrence.selector.length > 0);
  }
});
