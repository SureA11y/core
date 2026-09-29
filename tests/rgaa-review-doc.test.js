'use strict';

/**
 * docs/RGAA_TO_REVIEW.md is built from the review marks in
 * src/coverage/rgaa-rule-map.js. These pin how a mark turns into an item:
 * grouped by priority, highest first, with its question, and gone once the
 * mark is removed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { renderReviewDoc } = require('../scripts/generate-rgaa-mapping-doc.js');
const { RGAA_VERSIONS, RGAA_TESTS } = require('../src/coverage/rgaa-map');

function render(rows) {
  return renderReviewDoc({
    versions: RGAA_VERSIONS,
    tests: RGAA_TESTS,
    ruleTests: { '4.1.2': rows }
  });
}

test('items are grouped by priority, highest first, each with its question', () => {
  const doc = render({
    'rule-low': { tests: ['1.1.1'], note: 'low note', review: { priority: 'low' } },
    'rule-high': {
      tests: ['1.1.2'],
      note: 'high note',
      review: { priority: 'high', question: 'Is it?' }
    },
    'rule-medium': {
      tests: ['1.1.3'],
      note: 'medium note',
      review: { priority: 'medium', question: 'Maybe?' }
    }
  });
  const high = doc.indexOf('### High priority');
  const medium = doc.indexOf('### Medium priority');
  const low = doc.indexOf('### Low priority');
  assert.ok(high > 0 && high < medium && medium < low);
  assert.ok(doc.indexOf('`rule-high`') > high && doc.indexOf('`rule-high`') < medium);
  assert.match(doc, /Is it\?/);
  assert.match(doc, /1\.1\.2 « Chaque zone/);
  assert.match(doc, /Does a failure of this rule show what the linked test check\?/);
  assert.match(doc, /3 item\(s\): 1 high, 1 medium, 1 low, and 0 possible link\(s\)\./);
});

test('proposed tests go under possible links, not under a priority', () => {
  const doc = render({
    'rule-maybe': {
      tests: [],
      note: 'n',
      review: { priority: 'medium', question: 'Link it?', proposed: ['7.1.1'] }
    }
  });
  assert.ok(!doc.includes('### Medium priority'));
  const section = doc.slice(doc.indexOf('### Possible links'));
  assert.match(section, /`rule-maybe` \| medium \| 7\.1\.1 « Chaque script/);
});

test('a row without a mark is not listed', () => {
  const doc = render({ 'rule-done': { tests: ['1.1.1'], note: 'n' } });
  assert.ok(!doc.includes('rule-done'));
  assert.match(doc, /0 item\(s\)/);
});
