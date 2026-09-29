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

function rowOf(version, ruleId) {
  return (RGAA_RULE_TESTS[version] || {})[ruleId] || null;
}

function testsOfRule(version, ruleId) {
  const row = rowOf(version, ruleId);
  return row && Array.isArray(row.tests) ? row.tests : [];
}

// Tests a rule is linked to although RGAA relates their criterion to none of
// the rule's WCAG criteria, each with the reason it is linked anyway.
function exceptionsOf(version, ruleId) {
  const row = rowOf(version, ruleId);
  const out = row && row.outsideCorrespondence;
  return out && typeof out === 'object' && !Array.isArray(out) ? out : {};
}

// One entry per test. `wcagSc` is the WCAG criteria the entry belongs under:
// those of the rule (or composite) that RGAA relates to the test's criterion,
// or all of the criterion's when the rule has no WCAG mapping of its own. A
// test linked outside RGAA's correspondence goes under the rule's own
// criteria, next to its other findings.
function entry(version, test, wcagSc, outside) {
  const t = RGAA_TESTS[version][test];
  const criterionSc = RGAA_CRITERIA[version][t.criterion].wcagSc;
  const own = Array.isArray(wcagSc) ? wcagSc.map((s) => String(s).trim()) : [];
  let shared = own.length ? criterionSc.filter((sc) => own.includes(sc)) : criterionSc.slice();
  if (outside && !shared.length) shared = own.slice();
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
    const byTest = new Map();
    for (const ruleId of Array.isArray(checksIds) ? checksIds : [id]) {
      const outside = exceptionsOf(version, ruleId);
      for (const test of testsOfRule(version, ruleId)) {
        const e = entry(version, test, wcagSc, Object.prototype.hasOwnProperty.call(outside, test));
        if (e.wcagSc.length && !byTest.has(test)) byTest.set(test, e);
      }
    }
    for (const test of [...byTest.keys()].sort(compareIds)) out.push(byTest.get(test));
  }
  return out;
}

const REVIEW_PRIORITIES = ['high', 'medium', 'low'];

// A row's review mark: { priority, question?, proposed? }. The question is
// required except for a low-priority check of the linked tests, and proposed
// lists tests the rule is not linked to yet but might be.
function reviewProblems(version, ruleId, row) {
  const review = row.review;
  const where = `${version} ${ruleId}: review`;
  if (!review || typeof review !== 'object') return [`${where} must be an object`];
  const problems = [];
  if (!REVIEW_PRIORITIES.includes(review.priority)) {
    problems.push(`${where}.priority must be one of ${REVIEW_PRIORITIES.join(', ')}`);
  }
  const proposed = review.proposed === undefined ? [] : review.proposed;
  if (!Array.isArray(proposed)) problems.push(`${where}.proposed must be an array`);
  const hasQuestion = typeof review.question === 'string' && review.question.trim();
  if (!hasQuestion && (review.priority !== 'low' || (Array.isArray(proposed) && proposed.length))) {
    problems.push(`${where} needs a question`);
  }
  for (const test of Array.isArray(proposed) ? proposed : []) {
    if (!RGAA_TESTS[version][test]) problems.push(`${where} proposes no such test ${test}`);
    else if (row.tests.includes(test)) problems.push(`${where} proposes ${test}, already linked`);
  }
  return problems;
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
      if (row.review !== undefined) problems.push(...reviewProblems(version, ruleId, row));
      for (const test of Object.keys(exceptionsOf(version, ruleId))) {
        if (!row.tests.includes(test)) {
          problems.push(`${version} ${ruleId}: outsideCorrespondence names ${test}, which is not linked`);
        }
      }
      if (new Set(row.tests).size !== row.tests.length) {
        problems.push(`${version} ${ruleId}: lists a test twice`);
      }
      for (const test of row.tests) {
        if (!RGAA_TESTS[version][test]) {
          problems.push(`${version} ${ruleId}: no such test ${test}`);
          continue;
        }
        const outside = exceptionsOf(version, ruleId);
        const related = !(rule.wcagSc || []).length || entry(version, test, rule.wcagSc).wcagSc.length;
        const reason = outside[test];
        if (!related && !(typeof reason === 'string' && reason.trim())) {
          const crit = RGAA_TESTS[version][test].criterion;
          problems.push(
            `${version} ${ruleId}: test ${test} belongs to criterion ${crit}, which RGAA relates to ` +
              `WCAG ${RGAA_CRITERIA[version][crit].wcagSc.join(', ')}, none of the rule's (${rule.wcagSc.join(', ')}); ` +
              `link it only with a reason in outsideCorrespondence`
          );
        }
        if (related && reason !== undefined) {
          problems.push(
            `${version} ${ruleId}: outsideCorrespondence names ${test}, which RGAA already relates to the rule's criteria`
          );
        }
      }
    }
  }
  return problems;
}

module.exports = { rgaaMappingsFor, validateRgaaRuleTests };
