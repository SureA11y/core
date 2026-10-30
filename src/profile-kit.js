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
 * - requirements[version][id]: { title, wcagSc, partial }. `id` is the
 *   standard's own number ('1.2', 'B4'...), `title` its wording, and `wcagSc`
 *   the WCAG criteria it corresponds to, each one a criterion of that WCAG
 *   version. `partial: true`, optional, says the rules mapped to it don't
 *   check all it asks: its rollup is then cantTell
 *   (composite.rollup.cantTell.partialCoverage) where they are all
 *   notApplicable, since they only found none of the cases they look for,
 *   and cantTell (composite.rollup.cantTell.partialCheck) where they pass,
 *   since they checked only part of it, as a WCAG criterion's is.
 * - ruleMap[version][ruleId]: { requirements: [id, ...], reasonCodes, note },
 *   the requirements a rule checks: a core rule or one of the profile's own.
 *   `reasonCodes`, optional, sends a rule's findings of a reason code
 *   elsewhere: { [code]: { requirements, outcome } }, where `requirements`
 *   (default: the row's) are those its findings count toward, [] for none,
 *   and `outcome: 'cantTell'` makes a failing one a question there. A
 *   requirement's rollup then judges the rule by the findings that count
 *   toward it, not by the rule's outcome as a whole.
 *   `findings`, optional, does the same by what a finding records:
 *   [{ when, requirements, outcome }], where `when` gives values that fields
 *   of the finding's data.details must equal ({ 'typography.isBold': true }),
 *   by dotted path. A finding goes by the first entry it matches, else by
 *   its reason code, else by the row.
 *
 * `applicability: 'wcag'`, for a standard whose requirements restate WCAG
 * criteria one for one (EN 301 549's chapter 9): a requirement's rollup is
 * notApplicable only where the WCAG rollup of its criteria would be, the
 * criteria in src/coverage/complete-applicability.js, and otherwise cantTell
 * (composite.rollup.cantTell.partialCoverage), as WCAG's own rollup is; and
 * it passes only where that rollup would (the same file). A
 * standard whose requirements are narrower than a criterion leaves it out.
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
 * { mappingsFor, composites, validate, wcagTagsOf, procedures } for the
 * registry entry of a standard named `standard`, whose rules and rollups
 * carry `tag`. `procedures`, with applicability 'wcag', has each requirement
 * that restates one criterion take its procedures (standard.procedures).
 */
function ruleMappedStandard({ standard, tag, versions, requirements, ruleMap, applicability }) {
  if (applicability !== undefined && applicability !== 'wcag') {
    throw new TypeError(`${standard}: applicability can only be 'wcag'`);
  }
  function rowOf(version, ruleId) {
    return (ruleMap[version] || {})[ruleId] || null;
  }
  const codesOf = (row) =>
    row && row.reasonCodes && typeof row.reasonCodes === 'object' ? row.reasonCodes : null;
  const findingsOf = (row) => (row && Array.isArray(row.findings) ? row.findings : null);

  // Every requirement a rule's findings count toward: the row's, and those
  // its reason codes and findings entries send findings to.
  function requirementsOf(version, ruleId) {
    const row = rowOf(version, ruleId);
    const own = row && Array.isArray(row.requirements) ? row.requirements : [];
    const routes = [...Object.values(codesOf(row) || {}), ...(findingsOf(row) || [])];
    if (!routes.length) return own;
    const all = new Set(own);
    for (const c of routes) {
      for (const id of c && Array.isArray(c.requirements) ? c.requirements : []) all.add(id);
    }
    return [...all];
  }

  // For a rule whose row sends some findings elsewhere: what a finding does
  // in requirement `id`'s rollup, 'count', 'cantTell' (a failing one is a
  // question) or 'ignore': by the first of `findings` it matches, else by
  // its code, else `default`. null for a rule without reasonCodes or
  // findings, which is judged whole.
  function contributionOf(version, ruleId, id) {
    const row = rowOf(version, ruleId);
    const codes = codesOf(row);
    const findings = findingsOf(row);
    if (!codes && !findings) return null;
    const own = Array.isArray(row.requirements) ? row.requirements : [];
    const act = (c) => {
      const reqs = c && Array.isArray(c.requirements) ? c.requirements : own;
      return !reqs.includes(id) ? 'ignore' : c && c.outcome === 'cantTell' ? 'cantTell' : 'count';
    };
    const out = { default: own.includes(id) ? 'count' : 'ignore', codes: {} };
    for (const [code, c] of Object.entries(codes || {})) out.codes[code] = act(c);
    if (findings) out.findings = findings.map((f) => ({ when: { ...f.when }, act: act(f) }));
    return out;
  }

  function entry(version, id) {
    const req = (requirements[version] || {})[id];
    if (!req) {
      throw new Error(
        `${standard} ${version}: the rule map names requirement ${id}, which its requirements don't list`
      );
    }
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
        // The rules judged by their findings' reason codes in this rollup.
        const contributions = {};
        for (const ruleId of ruleIds) {
          const c = contributionOf(version, ruleId, id);
          if (c) contributions[ruleId] = c;
        }
        out.push({
          id: `${tag}-${version}-${id}`,
          checksIds: ruleIds,
          meta: {
            ...(Object.keys(contributions).length ? { contributions } : {}),
            ...(applicability ? { applicability } : {}),
            ...(requirements[version][id].partial === true ? { partial: true } : {}),
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
        if (req && req.partial !== undefined && typeof req.partial !== 'boolean') {
          problems.push(`${version} ${id}: partial must be true or false`);
        }
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
        if (row.reasonCodes !== undefined) {
          const codes = row.reasonCodes;
          if (!codes || typeof codes !== 'object' || Array.isArray(codes)) {
            problems.push(`${version} ${ruleId}: reasonCodes must be an object of reason codes`);
            continue;
          }
          for (const [code, c] of Object.entries(codes)) {
            const at = `${version} ${ruleId} ${code}`;
            if (!c || typeof c !== 'object' || Array.isArray(c)) {
              problems.push(`${at}: must be { requirements, outcome }`);
              continue;
            }
            if (c.requirements !== undefined) {
              if (!Array.isArray(c.requirements))
                problems.push(`${at}: requirements must be a list`);
              else
                for (const id of c.requirements) {
                  if (!requirements[version] || !requirements[version][id])
                    problems.push(`${at}: no requirement ${id}`);
                }
            }
            if (c.outcome !== undefined && c.outcome !== 'cantTell') {
              problems.push(`${at}: outcome can only be 'cantTell'`);
            }
          }
        }
        if (row.findings !== undefined) {
          if (!Array.isArray(row.findings)) {
            problems.push(`${version} ${ruleId}: findings must be a list`);
            continue;
          }
          row.findings.forEach((f, i) => {
            const at = `${version} ${ruleId} findings[${i}]`;
            if (!f || typeof f !== 'object' || Array.isArray(f)) {
              problems.push(`${at}: must be { when, requirements, outcome }`);
              return;
            }
            const when = f.when;
            if (
              !when ||
              typeof when !== 'object' ||
              Array.isArray(when) ||
              !Object.keys(when).length
            ) {
              problems.push(`${at}: when must name at least one field`);
            } else {
              for (const [path, value] of Object.entries(when)) {
                if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
                  problems.push(`${at}: when.${path} must be a string, number, boolean or null`);
                }
              }
            }
            if (f.requirements !== undefined) {
              if (!Array.isArray(f.requirements))
                problems.push(`${at}: requirements must be a list`);
              else
                for (const id of f.requirements) {
                  if (!requirements[version] || !requirements[version][id])
                    problems.push(`${at}: no requirement ${id}`);
                }
            }
            if (f.outcome !== undefined && f.outcome !== 'cantTell') {
              problems.push(`${at}: outcome can only be 'cantTell'`);
            }
          });
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

  // How a person assesses each requirement (standard.procedures,
  // docs/PROCEDURES.md): with applicability 'wcag', a requirement restates
  // its criterion and takes its procedures. Without it, a requirement's
  // criteria are only related, and there are none.
  function proceduresOf() {
    if (applicability !== 'wcag') return undefined;
    const out = {};
    for (const { version } of versions) {
      const reqs = requirements[version] || {};
      const own = {};
      for (const id of Object.keys(reqs).sort(compareIds)) {
        const { title, wcagSc } = reqs[id];
        if (!Array.isArray(wcagSc) || wcagSc.length !== 1) continue;
        own[id] = typeof title === 'string' ? { title, wcag: wcagSc[0] } : { wcag: wcagSc[0] };
      }
      out[version] = own;
    }
    return out;
  }

  return { mappingsFor, composites, validate, wcagTagsOf, procedures: proceduresOf() };
}

module.exports = { ruleMappedStandard };
