'use strict';

// WCAG's criterion titles (src/coverage/wcag-criteria.js), which a custom
// rule's meta.wcagSc entry takes, are the titles every built-in rule states.

const test = require('node:test');
const assert = require('node:assert/strict');

const { WCAG_CRITERIA, wcagTitle } = require('../../src/coverage/wcag-criteria.js');
const { getChecksCatalog } = require('../../src/index.js');

test('every criterion has a title', () => {
  for (const c of WCAG_CRITERIA) assert.ok(wcagTitle(c.sc), c.sc);
  assert.equal(wcagTitle('2.5.5', '2.1'), 'Target Size');
  assert.equal(wcagTitle('2.5.5'), 'Target Size (Enhanced)');
  assert.equal(wcagTitle('9.9.9'), null);
});

test("the titles are those every built-in rule's WCAG entries state", () => {
  let checked = 0;
  for (const rule of getChecksCatalog()) {
    for (const m of rule.normativeMappings || []) {
      if (m.type || m.standard !== 'WCAG' || !m.title) continue;
      checked += 1;
      assert.equal(wcagTitle(m.requirement, m.version), m.title, `${rule.ruleId} ${m.requirement}`);
    }
  }
  assert.ok(checked > 100, `${checked}`);
});
