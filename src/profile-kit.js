/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The mapping of a standard whose requirements are linked to rules one by one,
 * as a profile made with `npm run profile:new` describes it: what each result
 * names, one rollup per requirement, and the checks the build runs on the
 * tables. A profile hands it its tables and puts what it returns in its
 * registry entry (ENTRY SHAPE in src/coverage/standards.js), so the code is
 * core's, tested once, and a fix reaches every profile that uses it.
 *
 * The tables:
 *
 * - versions: [{ version, wcagVersion }], oldest first: the standard's version
 *   and the WCAG version it is built on ('2.0', '2.1' or '2.2').
 * - requirements[version][id]: { title, wcagSc }. `id` is the standard's own
 *   number ('1.2', 'B4'...), `title` its wording, and `wcagSc` the WCAG
 *   criteria it corresponds to, each one a criterion of that WCAG version.
 * - ruleMap[version][ruleId]: { requirements: [id, ...], note }, the
 *   requirements a rule checks: a core rule or one of the profile's own.
 *
 * A standard whose mapping needs more (tests grouped into criteria, related
 * to WCAG many to many, say) writes its own functions instead.
 *
 * It loads no engine code, so a profile's own files may require it
 * (profiles/README.md, "What a profile may use").
 */

const { WCAG_VERSIONS, wcagCriterion, wcagTags } = require('./wcag.js');

// Requirement ids in their natural order: '1.2' before '1.10'.
function compareIds(a, b) {
  return String(a).localeCompare(String(b), 'en', { numeric: true });
}

/**
 * { mappingsFor, composites, validate, wcagTagsOf } for the registry entry of
 * a standard named `standard`, whose rules and rollups carry `tag`.
 */
function ruleMappedStandard({ standard, tag, versions, requirements, ruleMap }) {
  function requirementsOf(version, ruleId) {
    const row = (ruleMap[version] || {})[ruleId];
    return row && Array.isArray(row.requirements) ? row.requirements : [];
  }

  function entry(version, id) {
    const req = requirements[version][id];
    return {
      standard,
      version,
      requirement: id,
      title: req.title,
      wcagSc: Array.isArray(req.wcagSc) ? req.wcagSc.slice() : []
    };
  }

  // The entries for a rule ({ id }) or, given `checksIds`, for a rollup: the
  // requirements its rules check, oldest version first.
  function mappingsFor({ id, checksIds }) {
    const out = [];
    for (const { version } of versions) {
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
    for (const { version } of versions) {
      const table = ruleMap[version] || {};
      for (const id of Object.keys(requirements[version] || {}).sort(compareIds)) {
        const ruleIds = Object.keys(table)
          .filter((ruleId) => requirementsOf(version, ruleId).includes(id))
          .sort();
        if (!ruleIds.length) continue;
        out.push({
          id: `${tag}-${version}-${id}`,
          checksIds: ruleIds,
          meta: {
            title: requirements[version][id].title,
            description: '',
            wcagSc: [],
            level: null,
            standard,
            version,
            criterion: id,
            tags: [tag],
            standardMappings: [entry(version, id)]
          }
        });
      }
    }
    return out;
  }

  // Problems with the tables, given every rule ([{ ruleId, wcagSc }]). The
  // build fails on any.
  function validate(rules) {
    const known = new Set(rules.map((r) => r.ruleId));
    const problems = [];
    const listed = versions.map((v) => v.version);
    for (const { version, wcagVersion } of versions) {
      if (!requirements[version]) {
        problems.push(`version ${version} has no requirements table`);
        continue;
      }
      if (!WCAG_VERSIONS.includes(wcagVersion)) {
        problems.push(`version ${version}: wcagVersion must be one of ${WCAG_VERSIONS.join(', ')}`);
        continue;
      }
      // A requirement corresponds to criteria of the WCAG version it is built on.
      for (const [id, req] of Object.entries(requirements[version])) {
        for (const sc of (req && req.wcagSc) || []) {
          if (!wcagCriterion(sc, wcagVersion)) {
            problems.push(`${version} ${id}: WCAG ${wcagVersion} has no criterion ${sc}`);
          }
        }
      }
    }
    for (const [version, table] of Object.entries(ruleMap)) {
      if (!listed.includes(version)) {
        problems.push(`the rule map names version ${version}, which versions does not list`);
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
          if (!requirements[version] || !requirements[version][id]) {
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

  // The WCAG A and AA tags of the WCAG version a version is built on, for its
  // profile in the registry entry.
  function wcagTagsOf(version) {
    const v = versions.find((x) => x.version === version);
    if (!v) throw new Error(`${standard} has no version ${version}`);
    return wcagTags(v.wcagVersion);
  }

  return { mappingsFor, composites, validate, wcagTagsOf };
}

module.exports = { ruleMappedStandard };
