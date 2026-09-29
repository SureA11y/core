/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA entries for a rule or composite, shaped as `normativeMappings`
 * entries, for the registry in src/coverage/standards.js.
 */

const { RGAA_VERSIONS, RGAA_CRITERIA, RGAA_TESTS } = require('./rgaa-map');
const { RGAA_RULE_TESTS } = require('./rgaa-rule-map');

function compareIds(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function testsOfRule(version, ruleId) {
  const row = (RGAA_RULE_TESTS[version] || {})[ruleId];
  return row && Array.isArray(row.tests) ? row.tests : [];
}

// One entry per test. `wcagSc` is the WCAG criteria the entry belongs under:
// those of the rule (or composite) that RGAA relates to the test's criterion,
// or all of the criterion's when the rule has no WCAG mapping of its own.
function entry(version, test, wcagSc) {
  const t = RGAA_TESTS[version][test];
  const criterionSc = RGAA_CRITERIA[version][t.criterion].wcagSc;
  const own = Array.isArray(wcagSc) ? wcagSc.map((s) => String(s).trim()) : [];
  const shared = own.length ? criterionSc.filter((sc) => own.includes(sc)) : criterionSc.slice();
  return {
    standard: 'RGAA',
    version,
    requirement: test,
    title: t.title,
    criterion: t.criterion,
    wcagSc: shared
  };
}

/**
 * The RGAA entries for a rule ({ id, wcagSc }) or, given `checksIds`, for a
 * composite: the tests of its rules that RGAA relates to the composite's own
 * criteria. Oldest version first, tests in RGAA order.
 */
function rgaaMappingsFor({ id, wcagSc, checksIds }) {
  const out = [];
  for (const { version } of RGAA_VERSIONS) {
    let tests;
    if (Array.isArray(checksIds)) {
      tests = [...new Set(checksIds.flatMap((ruleId) => testsOfRule(version, ruleId)))];
    } else {
      tests = testsOfRule(version, id).slice();
    }
    for (const test of tests.sort(compareIds)) {
      const e = entry(version, test, wcagSc);
      if (e.wcagSc.length) out.push(e);
    }
  }
  return out;
}

/**
 * Problems with the mapping table, given the rules that exist
 * ([{ ruleId, wcagSc }]). Empty means the table is sound.
 */
function validateRgaaRuleTests(rules) {
  const byId = new Map(rules.map((r) => [r.ruleId, r]));
  const problems = [];
  for (const [version, table] of Object.entries(RGAA_RULE_TESTS)) {
    if (!RGAA_TESTS[version]) {
      problems.push(`RGAA version ${version} has no test table`);
      continue;
    }
    for (const [ruleId, row] of Object.entries(table)) {
      const rule = byId.get(ruleId);
      if (!rule) {
        problems.push(`${version} ${ruleId}: no such rule`);
        continue;
      }
      if (!row || !Array.isArray(row.tests) || typeof row.note !== 'string' || !row.note.trim()) {
        problems.push(`${version} ${ruleId}: needs { tests: [...], note: '...' }`);
        continue;
      }
      if (new Set(row.tests).size !== row.tests.length) {
        problems.push(`${version} ${ruleId}: lists a test twice`);
      }
      for (const test of row.tests) {
        if (!RGAA_TESTS[version][test]) {
          problems.push(`${version} ${ruleId}: no such test ${test}`);
          continue;
        }
        if ((rule.wcagSc || []).length && !entry(version, test, rule.wcagSc).wcagSc.length) {
          const crit = RGAA_TESTS[version][test].criterion;
          problems.push(
            `${version} ${ruleId}: test ${test} belongs to criterion ${crit}, which RGAA relates to ` +
              `WCAG ${RGAA_CRITERIA[version][crit].wcagSc.join(', ')}, none of the rule's (${rule.wcagSc.join(', ')})`
          );
        }
      }
    }
  }
  return problems;
}

module.exports = { rgaaMappingsFor, validateRgaaRuleTests };
