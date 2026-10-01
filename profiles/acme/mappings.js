/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME's entries for a rule or a rollup, its rollups, and the checks the
 * build runs on its tables (index.js passes them to the registry).
 */

const { VERSIONS, REQUIREMENTS } = require('./requirements');
const { RULE_REQUIREMENTS } = require('./rule-map');
const { ACME_PART_A } = require('./part-a');

const STANDARD = 'ACME';
const TAG = 'acme';

// Requirement ids in their natural order: '1.2' before '1.10'.
function compareIds(a, b) {
  return String(a).localeCompare(String(b), 'en', { numeric: true });
}

function requirementsOf(version, ruleId) {
  const row = (RULE_REQUIREMENTS[version] || {})[ruleId];
  return row && Array.isArray(row.requirements) ? row.requirements : [];
}

function entry(version, id) {
  const req = REQUIREMENTS[version][id];
  return {
    standard: STANDARD,
    version,
    requirement: id,
    title: req.title,
    wcagSc: Array.isArray(req.wcagSc) ? req.wcagSc.slice() : []
  };
}

// Part A restates each WCAG criterion, so its entries come from the WCAG
// criteria of a rule or rollup, as EN 301 549's do.
function partAFor(version, wcagSc) {
  const out = [];
  for (const sc of Array.isArray(wcagSc) ? wcagSc : []) {
    const row = ACME_PART_A[version][String(sc).trim()];
    if (row) {
      out.push({
        standard: STANDARD,
        version,
        requirement: row.requirement,
        title: row.title,
        wcagSc: [String(sc).trim()]
      });
    }
  }
  return out;
}

// The entries for a rule ({ id, wcagSc }) or, given `checksIds`, for a rollup:
// Part A from its WCAG criteria, then the Part B requirements its rules check,
// oldest version first.
function mappingsFor({ id, wcagSc, checksIds }) {
  const out = [];
  for (const { version } of VERSIONS) {
    out.push(...partAFor(version, wcagSc));
    const ids = new Set();
    for (const ruleId of Array.isArray(checksIds) ? checksIds : [id]) {
      for (const req of requirementsOf(version, ruleId)) ids.add(req);
    }
    for (const req of [...ids].sort(compareIds)) out.push(entry(version, req));
  }
  return out;
}

// One rollup per requirement a rule checks, grouping those rules. They carry
// the standard's tag, so only a run that asks for it produces them.
function composites() {
  const out = [];
  for (const { version } of VERSIONS) {
    const table = RULE_REQUIREMENTS[version] || {};
    for (const id of Object.keys(REQUIREMENTS[version]).sort(compareIds)) {
      const ruleIds = Object.keys(table)
        .filter((ruleId) => requirementsOf(version, ruleId).includes(id))
        .sort();
      if (!ruleIds.length) continue;
      out.push({
        id: `${TAG}-${version}-${id}`,
        checksIds: ruleIds,
        meta: {
          title: REQUIREMENTS[version][id].title,
          description: '',
          wcagSc: [],
          level: null,
          standard: STANDARD,
          version,
          criterion: id,
          tags: [TAG],
          standardMappings: [entry(version, id)]
        }
      });
    }
  }
  return out;
}

// Problems with the tables, given every rule ([{ ruleId, wcagSc }]). The build
// fails on any.
function validate(rules) {
  const known = new Set(rules.map((r) => r.ruleId));
  const problems = [];
  const versions = VERSIONS.map((v) => v.version);
  for (const version of versions) {
    if (!REQUIREMENTS[version]) problems.push(`version ${version} has no requirements table`);
  }
  for (const [version, table] of Object.entries(RULE_REQUIREMENTS)) {
    if (!versions.includes(version)) {
      problems.push(`rule-map.js names version ${version}, which VERSIONS does not list`);
      continue;
    }
    for (const [ruleId, row] of Object.entries(table)) {
      if (!known.has(ruleId)) problems.push(`${version} ${ruleId}: no such rule`);
      const reqs = row && Array.isArray(row.requirements) ? row.requirements : null;
      if (!reqs) {
        problems.push(`${version} ${ruleId}: requirements must be a list`);
        continue;
      }
      for (const id of reqs) {
        if (!REQUIREMENTS[version] || !REQUIREMENTS[version][id]) {
          problems.push(`${version} ${ruleId}: no requirement ${id}`);
        }
      }
      if (new Set(reqs).size !== reqs.length) {
        problems.push(`${version} ${ruleId}: a requirement is listed twice`);
      }
    }
  }
  return problems;
}

module.exports = { mappingsFor, composites, validate };
