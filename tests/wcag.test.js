'use strict';

/**
 * @surea11y/core/wcag: WCAG's criteria as each version publishes them.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { WCAG_VERSIONS, wcagCriteria, wcagCriterion } = require('../src/wcag');

test('each version has the number of criteria WCAG publishes', () => {
  const count = (v, levels) => wcagCriteria(v, levels && { levels }).length;
  assert.deepEqual(
    WCAG_VERSIONS.map((v) => [v, count(v), count(v, ['A', 'AA'])]),
    [
      ['2.0', 61, 38],
      ['2.1', 78, 50],
      ['2.2', 86, 55]
    ]
  );
});

test('4.1.1 Parsing is a Level A criterion until 2.2 removes it', () => {
  for (const version of ['2.0', '2.1']) {
    assert.deepEqual(
      { ...wcagCriterion('4.1.1', version) },
      { sc: '4.1.1', title: 'Parsing', level: 'A', introduced: '2.0' }
    );
  }
  assert.equal(wcagCriterion('4.1.1', '2.2'), null);
});

test('a criterion appears from the version that introduced it', () => {
  assert.equal(wcagCriterion('1.4.10', '2.0'), null);
  assert.equal(wcagCriterion('1.4.10', '2.1').introduced, '2.1');
  assert.equal(wcagCriterion('2.5.8', '2.1'), null);
  assert.deepEqual(
    { ...wcagCriterion('2.5.8', '2.2') },
    {
      sc: '2.5.8',
      title: 'Target Size (Minimum)',
      level: 'AA',
      introduced: '2.2'
    }
  );
});

test('every criterion has a title and a level, in numeric order', () => {
  for (const version of WCAG_VERSIONS) {
    const list = wcagCriteria(version);
    for (const c of list) {
      assert.ok(c.title, `${version} ${c.sc}`);
      assert.ok(['A', 'AA', 'AAA'].includes(c.level), `${version} ${c.sc}: ${c.level}`);
    }
    const nums = list.map((c) => c.sc.split('.').map(Number));
    for (let i = 1; i < nums.length; i++) {
      const [a, b] = [nums[i - 1], nums[i]];
      assert.ok(a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2]))));
    }
  }
});

test('the lists and their entries are frozen', () => {
  const list = wcagCriteria('2.2');
  assert.ok(Object.isFrozen(list));
  assert.ok(Object.isFrozen(list[0]));
  assert.ok(Object.isFrozen(WCAG_VERSIONS));
});

test('an unknown version or level is refused', () => {
  assert.throws(() => wcagCriteria('3.0'), /unknown WCAG version "3.0"/);
  assert.throws(() => wcagCriteria('2.2', { levels: ['AAAA'] }), /unknown WCAG level AAAA/);
});
