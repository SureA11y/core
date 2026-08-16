'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

// An occurrence that reaches the engine without its element makes the engine
// re-find one with document.querySelector, so a rule reporting many of them
// costs a document-wide query per occurrence. It also leaves the engine unable
// to reason about that element later -- the ancestor-walk downgrade in
// normalizeRuleResult can only act on occurrences that carry a node.
const CHECKS_DIR = path.join(__dirname, '..', 'src', 'checks');
const FALLBACK_COUNTER = 'structuralPath.selectorFallback';

// Rules still building occurrences by hand. This must only ever go down: it
// is the remaining migration, not an allowance for new rules.
const HAND_BUILDING_RULES = 0;

function ruleFiles() {
  return fs
    .readdirSync(CHECKS_DIR)
    .flatMap((dir) => {
      const full = path.join(CHECKS_DIR, dir);
      if (!fs.statSync(full).isDirectory()) return [];
      return fs
        .readdirSync(full)
        .filter((f) => f.endsWith('.js'))
        .map((f) => path.join(full, f));
    })
    .sort();
}

test('the number of rules bypassing reportOccurrence only shrinks', () => {
  const files = ruleFiles();
  const handBuilt = files.filter((f) => !fs.readFileSync(f, 'utf8').includes('reportOccurrence'));

  assert.ok(files.length > 100, 'sanity: the rule files were found');
  assert.ok(
    handBuilt.length <= HAND_BUILDING_RULES,
    `${handBuilt.length} rules build occurrences by hand, up from ${HAND_BUILDING_RULES}. ` +
      'Use helpers.reportOccurrence -- see docs/RULE_AUTHORING.md section 4.3.'
  );
});

function scanWith(ruleId, elementMarkup, count) {
  const body = elementMarkup.repeat(count);
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`,
    { engineOptions: { perfStats: true, rules: { include: ruleId } } }
  );

  return {
    rule: result.checksResults.find((r) => r.ruleId === ruleId),
    fallbacks: result.perfStats.counters[FALLBACK_COUNTER] || 0
  };
}

test('a rule that reports its element causes no selector fallback', () => {
  const { rule, fallbacks } = scanWith('img-alt-present', '<img src="x.png">', 200);

  assert.equal(rule.occurrences.length, 200);
  assert.equal(fallbacks, 0);
});

test('region reports its elements rather than re-finding them', () => {
  const { rule, fallbacks } = scanWith('region', '<img src="x.png">', 200);

  assert.equal(rule.outcome, 'cantTell');
  assert.equal(rule.occurrences.length, 200, 'still one occurrence per unplaced element');
  assert.equal(fallbacks, 0);

  for (const occurrence of rule.occurrences) {
    assert.ok(Array.isArray(occurrence.structuralPath), 'structuralPath is still populated');
    assert.ok(occurrence.selector.length > 0);
  }
});
