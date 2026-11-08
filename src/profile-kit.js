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
 *   `outcome: 'cantTell'` makes a failing one a question there, and
 *   `outcome: 'fail'` makes a question a failure there. A
 *   requirement's rollup then judges the rule by the findings that count
 *   toward it, not by the rule's outcome as a whole.
 *   `findings`, optional, does the same by what a finding records:
 *   [{ when, requirements, outcome }], where `when` gives values that fields
 *   of the finding's data.details must equal ({ 'typography.isBold': true }),
 *   by dotted path. A finding goes by the first entry it matches, else by
 *   its reason code, else by the row.
 *
 * - tests[version][testId], optional: { title, requirements: [id, ...],
 *   wcagSc }, the second level of a standard that judges tests under its
 *   requirements (RGAA's criteria and tests, BITV-Test's requirements and
 *   steps). A test belongs to one requirement or several. A requirement may
 *   list its tests (`tests`), which must then be the tests that name it. In a
 *   version with tests, a rule-map row names tests or requirements; `asks`,
 *   optional, names tests (or requirements) where the row's findings are
 *   questions; and a result names each test it counts toward, with the
 *   requirement it belongs to (`criterion`). A test's `wcagSc` defaults to
 *   its requirement's. Experimental (src/experimental.js).
 *
 * `wcagCorrespondence: true`, optional: a rule is linked to a test only
 * where the test's WCAG criteria share one with the rule's, or the row gives
 * the reason in `outsideCorrespondence: { [testId]: reason }`; and an entry
 * names only the criteria they share. Experimental.
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
function ruleMappedStandard({
  standard,
  tag,
  versions,
  requirements,
  tests: testTables,
  ruleMap,
  applicability,
  wcagCorrespondence
}) {
  if (applicability !== undefined && applicability !== 'wcag') {
    throw new TypeError(`${standard}: applicability can only be 'wcag'`);
  }
  if (wcagCorrespondence !== undefined && typeof wcagCorrespondence !== 'boolean') {
    throw new TypeError(`${standard}: wcagCorrespondence must be true or false`);
  }
  const tests = testTables && typeof testTables === 'object' ? testTables : {};
  function rowOf(version, ruleId) {
    return (ruleMap[version] || {})[ruleId] || null;
  }
  // Whether a version judges tests under its requirements.
  const twoLevel = (version) => !!tests[version] && Object.keys(tests[version]).length > 0;
  if (Object.keys(tests).some(twoLevel)) {
    return twoLevelStandard({
      standard,
      tag,
      versions,
      requirements,
      tests,
      ruleMap,
      applicability,
      wcagCorrespondence: wcagCorrespondence === true
    });
  }
  return oneLevelStandard();

  function oneLevelStandard() {
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
    // question), 'fail' (a question is a failure) or 'ignore': by the first of `findings` it matches, else by
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
        if (!reqs.includes(id)) return 'ignore';
        if (c && c.outcome === 'cantTell') return 'cantTell';
        return c && c.outcome === 'fail' ? 'fail' : 'count';
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
          problems.push(
            `version ${version}: wcagVersion must be one of ${WCAG_VERSIONS.join(', ')}`
          );
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
              if (c.outcome !== undefined && c.outcome !== 'cantTell' && c.outcome !== 'fail') {
                problems.push(`${at}: outcome can only be 'cantTell' or 'fail'`);
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
              if (f.outcome !== undefined && f.outcome !== 'cantTell' && f.outcome !== 'fail') {
                problems.push(`${at}: outcome can only be 'cantTell' or 'fail'`);
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
}

const listOf = (v) => (Array.isArray(v) ? v : []);
const objectOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const ACT_OF_OUTCOME = { cantTell: 'cantTell', fail: 'fail' };
const TWO_LEVEL = Symbol.for('surea11y.twoLevelStandard');
const ROW_KEYS = [
  'requirements',
  'asks',
  'reasonCodes',
  'findings',
  'note',
  'outsideCorrespondence'
];

// The functions of a standard that judges tests under its requirements
// (`tests` in ruleMappedStandard). Every version has a tests table. A unit
// is a test or a requirement; a row names units.
function twoLevelStandard({
  standard,
  tag,
  versions,
  requirements,
  tests,
  ruleMap,
  applicability,
  wcagCorrespondence
}) {
  const rowOf = (version, ruleId) => (ruleMap[version] || {})[ruleId] || null;
  const reqsOf = (version) => requirements[version] || {};
  const testsOf = (version) => tests[version] || {};
  const isTest = (version, id) => Object.prototype.hasOwnProperty.call(testsOf(version), id);
  const isReq = (version, id) => Object.prototype.hasOwnProperty.call(reqsOf(version), id);

  // The tests of a requirement, in the standard's order: its own list, else
  // those that name it.
  function testsOfRequirement(version, id) {
    const req = reqsOf(version)[id];
    if (req && Array.isArray(req.tests)) return req.tests.slice();
    return Object.keys(testsOf(version))
      .filter((t) => listOf(testsOf(version)[t].requirements).includes(id))
      .sort(compareIds);
  }
  // What a requirement's rollup groups: the requirement and its tests.
  const unitsOf = (version, id) => [id, ...testsOfRequirement(version, id)];

  const routesOf = (row) => [
    ...Object.values(objectOf(row && row.reasonCodes) || {}),
    ...listOf(row && row.findings)
  ];

  // Every unit a rule's findings count toward or are asked about.
  function unitsOfRule(version, ruleId) {
    const row = rowOf(version, ruleId);
    if (!row) return [];
    const all = new Set([...listOf(row.requirements), ...listOf(row.asks)]);
    for (const r of routesOf(row)) for (const u of listOf(r && r.requirements)) all.add(u);
    return [...all];
  }

  // What a finding going by `route` does in the rollup of a requirement whose
  // units are `units`: counted toward the route's units there (a failing one
  // as a question where the route says outcome 'cantTell', a question as a
  // failure where it says 'fail'), else a question in the units the row asks
  // about there, else left out.
  function actFor(route, asks, units) {
    const counted = listOf(route.requirements).filter((u) => units.includes(u));
    if (counted.length) {
      return { act: ACT_OF_OUTCOME[route.outcome] || 'count', requirements: counted };
    }
    const asked = listOf(asks).filter((u) => units.includes(u));
    return asked.length ? { act: 'cantTell', requirements: asked } : 'ignore';
  }

  // How a requirement's rollup judges a rule whose row asks or routes
  // findings (meta.contributions); null for a rule judged whole.
  function contributionOf(version, ruleId, units) {
    const row = rowOf(version, ruleId);
    if (!row || (!listOf(row.asks).length && !routesOf(row).length)) return null;
    const own = { requirements: listOf(row.requirements) };
    const out = { default: actFor(own, row.asks, units) };
    const codes = objectOf(row.reasonCodes);
    if (codes) {
      out.codes = {};
      for (const [code, r] of Object.entries(codes)) {
        out.codes[code] = actFor(
          { requirements: r.requirements || own.requirements, outcome: r.outcome },
          [],
          units
        );
      }
    }
    if (listOf(row.findings).length) {
      out.findings = row.findings.map((f) => ({
        when: { ...f.when },
        act: actFor(
          { requirements: f.requirements || own.requirements, outcome: f.outcome },
          [],
          units
        )
      }));
    }
    return out;
  }

  const outsideOf = (version, ruleId) =>
    objectOf((rowOf(version, ruleId) || {}).outsideCorrespondence) || {};

  // The WCAG criteria a unit corresponds to: a test's own, else those of the
  // requirement it is counted under.
  function scOf(version, id, criterion) {
    if (isTest(version, id)) {
      const t = testsOf(version)[id];
      if (Array.isArray(t.wcagSc)) return t.wcagSc.slice();
      const req = reqsOf(version)[criterion];
      return req && Array.isArray(req.wcagSc) ? req.wcagSc.slice() : [];
    }
    const req = reqsOf(version)[id];
    return req && Array.isArray(req.wcagSc) ? req.wcagSc.slice() : [];
  }

  // One entry for a unit. A test names the requirement it is counted under
  // (`criterion`): `under`, or its first. With wcagCorrespondence, given the
  // criteria of a rule or rollup (`wcagSc`), the entry names those it shares
  // with them; a test linked outside the correspondence keeps the rule's.
  function entry(version, id, { under, wcagSc, outside } = {}) {
    const test = isTest(version, id) ? testsOf(version)[id] : null;
    if (!test && !isReq(version, id)) {
      throw new Error(
        `${standard} ${version}: the rule map names ${id}, which is no test or requirement`
      );
    }
    const criterion = test ? under || listOf(test.requirements)[0] : null;
    const all = scOf(version, id, criterion);
    let sc = all;
    if (wcagCorrespondence) {
      const own = Array.isArray(wcagSc) ? wcagSc.map((x) => String(x).trim()) : [];
      sc = own.length ? all.filter((x) => own.includes(x)) : all.slice();
      if (outside && !sc.length) sc = own.slice();
    }
    return {
      standard,
      version,
      requirement: id,
      title: test ? test.title : reqsOf(version)[id].title,
      ...(test ? { criterion } : {}),
      wcagSc: sc
    };
  }

  function mappingsFor({ id, wcagSc, checksIds }) {
    const out = [];
    for (const { version } of versions) {
      const byUnit = new Map();
      for (const ruleId of Array.isArray(checksIds) ? checksIds : [id]) {
        const outside = outsideOf(version, ruleId);
        for (const unit of unitsOfRule(version, ruleId)) {
          const e = entry(version, unit, {
            wcagSc,
            outside: Object.prototype.hasOwnProperty.call(outside, unit)
          });
          if (wcagCorrespondence && !e.wcagSc.length) continue;
          if (!byUnit.has(unit)) byUnit.set(unit, e);
        }
      }
      for (const unit of [...byUnit.keys()].sort(compareIds)) out.push(byUnit.get(unit));
    }
    return out;
  }

  function composites() {
    const out = [];
    for (const { version } of versions) {
      const table = ruleMap[version] || {};
      for (const id of Object.keys(reqsOf(version)).sort(compareIds)) {
        const units = unitsOf(version, id);
        const ruleIds = Object.keys(table)
          .filter((ruleId) => unitsOfRule(version, ruleId).some((u) => units.includes(u)))
          .sort();
        if (!ruleIds.length) continue;
        const named = [
          ...new Set(
            ruleIds
              .flatMap((ruleId) => unitsOfRule(version, ruleId))
              .filter((u) => units.includes(u))
          )
        ].sort(compareIds);
        const contributions = {};
        for (const ruleId of ruleIds) {
          const c = contributionOf(version, ruleId, units);
          if (c) contributions[ruleId] = c;
        }
        const req = reqsOf(version)[id];
        out.push({
          id: `${tag}-${version}-${id}`,
          checksIds: ruleIds,
          meta: {
            ...(Object.keys(contributions).length ? { contributions } : {}),
            ...(applicability ? { applicability } : {}),
            ...(req.partial === true ? { partial: true } : {}),
            title: req.title,
            description: '',
            wcagSc: [],
            level: null,
            standard,
            version,
            criterion: id,
            tags: [tag],
            standardMappings: named.map((u) => entry(version, u, { under: id }))
          }
        });
      }
    }
    return out;
  }

  function validate(rules) {
    const byId = new Map(rules.map((r) => [r.ruleId, r]));
    const problems = [];
    const listed = versions.map((v) => v.version);
    for (const { version, wcagVersion } of versions) {
      if (!requirements[version]) {
        problems.push(`version ${version} has no requirements table`);
        continue;
      }
      if (!tests[version] || !Object.keys(tests[version]).length) {
        problems.push(
          `version ${version} has no tests table: a standard with tests has them in every version`
        );
        continue;
      }
      if (!WCAG_VERSIONS.includes(wcagVersion)) {
        problems.push(`version ${version}: wcagVersion must be one of ${WCAG_VERSIONS.join(', ')}`);
        continue;
      }
      for (const [id, req] of Object.entries(reqsOf(version))) {
        if (req && req.partial !== undefined && typeof req.partial !== 'boolean') {
          problems.push(`${version} ${id}: partial must be true or false`);
        }
        for (const sc of (req && req.wcagSc) || []) {
          if (!wcagCriterion(sc, wcagVersion)) {
            problems.push(`${version} ${id}: WCAG ${wcagVersion} has no criterion ${sc}`);
          }
        }
        if (req && req.tests !== undefined) {
          const naming = Object.keys(testsOf(version))
            .filter((t) => listOf(testsOf(version)[t].requirements).includes(id))
            .sort();
          const listedTests = listOf(req.tests).slice().sort();
          if (!Array.isArray(req.tests) || naming.join() !== listedTests.join()) {
            problems.push(
              `${version} ${id}: tests must list the tests that name it (${naming.join(', ') || 'none'})`
            );
          }
        }
      }
      for (const [t, test] of Object.entries(testsOf(version))) {
        if (isReq(version, t)) problems.push(`${version} ${t}: is both a test and a requirement`);
        const reqs = test && test.requirements;
        if (!Array.isArray(reqs) || !reqs.length) {
          problems.push(
            `${version} test ${t}: requirements must list the requirements it belongs to`
          );
          continue;
        }
        for (const id of reqs)
          if (!isReq(version, id)) problems.push(`${version} test ${t}: no requirement ${id}`);
        for (const sc of listOf(test.wcagSc)) {
          if (!wcagCriterion(sc, wcagVersion))
            problems.push(`${version} test ${t}: WCAG ${wcagVersion} has no criterion ${sc}`);
        }
      }
    }
    const isUnit = (version, id) => isTest(version, id) || isReq(version, id);
    for (const [version, table] of Object.entries(ruleMap)) {
      if (!listed.includes(version)) {
        problems.push(`the rule map names version ${version}, which versions does not list`);
        continue;
      }
      for (const [ruleId, row] of Object.entries(table)) {
        const at = `${version} ${ruleId}`;
        const rule = byId.get(ruleId);
        if (!rule) problems.push(`${at}: no such rule`);
        if (!objectOf(row) || !Array.isArray(row.requirements)) {
          problems.push(`${at}: requirements must be a list`);
          continue;
        }
        for (const key of Object.keys(row)) {
          if (!ROW_KEYS.includes(key)) problems.push(`${at}: unknown field ${key}`);
        }
        const unitList = (list, where, emptyAllowed = true) => {
          if (list === undefined) return;
          if (!Array.isArray(list) || (!emptyAllowed && !list.length)) {
            problems.push(`${at}: ${where} must be a ${emptyAllowed ? '' : 'non-empty '}list`);
            return;
          }
          for (const id of list)
            if (!isUnit(version, id))
              problems.push(`${at}: ${where} names ${id}, no test or requirement`);
          if (new Set(list).size !== list.length) problems.push(`${at}: ${where} lists one twice`);
        };
        unitList(row.requirements, 'requirements');
        unitList(row.asks, 'asks', false);
        for (const u of listOf(row.asks)) {
          if (row.requirements.includes(u))
            problems.push(`${at}: asks names ${u}, which requirements already counts`);
        }
        const outcome = (o, where) => {
          if (o !== undefined && o !== 'cantTell' && o !== 'fail')
            problems.push(`${at}: ${where}.outcome can only be 'cantTell' or 'fail'`);
        };
        if (row.reasonCodes !== undefined) {
          if (!objectOf(row.reasonCodes))
            problems.push(`${at}: reasonCodes must be an object of reason codes`);
          else
            for (const [code, r] of Object.entries(row.reasonCodes)) {
              if (!objectOf(r)) {
                problems.push(`${at}: reasonCodes.${code} must be { requirements, outcome }`);
                continue;
              }
              unitList(r.requirements, `reasonCodes.${code}.requirements`);
              outcome(r.outcome, `reasonCodes.${code}`);
            }
        }
        if (row.findings !== undefined) {
          if (!Array.isArray(row.findings)) problems.push(`${at}: findings must be a list`);
          else
            row.findings.forEach((f, i) => {
              const where = `findings[${i}]`;
              const when = objectOf(f) && objectOf(f.when);
              if (!when || !Object.keys(when).length) {
                problems.push(`${at}: ${where}.when must name at least one field`);
                return;
              }
              for (const [path, value] of Object.entries(when)) {
                if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
                  problems.push(
                    `${at}: ${where}.when.${path} must be a string, number, boolean or null`
                  );
                }
              }
              unitList(f.requirements, `${where}.requirements`);
              outcome(f.outcome, where);
            });
        }
        const linked = unitsOfRule(version, ruleId);
        const outside = outsideOf(version, ruleId);
        if (row.outsideCorrespondence !== undefined && !objectOf(row.outsideCorrespondence)) {
          problems.push(`${at}: outsideCorrespondence must be an object of reasons`);
        }
        for (const u of Object.keys(outside)) {
          if (!linked.includes(u))
            problems.push(`${at}: outsideCorrespondence names ${u}, which is not linked`);
        }
        if (!wcagCorrespondence || !rule) continue;
        for (const u of linked) {
          if (!isUnit(version, u)) continue;
          const related =
            !(rule.wcagSc || []).length || entry(version, u, { wcagSc: rule.wcagSc }).wcagSc.length;
          const reason = outside[u];
          if (!related && !(typeof reason === 'string' && reason.trim())) {
            problems.push(
              `${at}: ${u} corresponds to WCAG ${scOf(version, u, isTest(version, u) ? listOf(testsOf(version)[u].requirements)[0] : null).join(', ') || 'nothing'}, none of the rule's (${rule.wcagSc.join(', ')}); link it only with a reason in outsideCorrespondence`
            );
          }
          if (related && reason !== undefined) {
            problems.push(
              `${at}: outsideCorrespondence names ${u}, which already corresponds to the rule's criteria`
            );
          }
        }
      }
    }
    return problems;
  }

  function wcagTagsOf(version) {
    const v = versions.find((x) => x.version === version);
    if (!v) throw new Error(`${standard} has no version ${version}`);
    return wcagTags(v.wcagVersion);
  }

  // Marks the standard as using the second level, which is experimental
  // (src/experimental.js); a pack built on it is told so by checkPack.
  Object.defineProperty(composites, TWO_LEVEL, { value: true });
  return { mappingsFor, composites, validate, wcagTagsOf, procedures: undefined };
}

module.exports = { ruleMappedStandard };
