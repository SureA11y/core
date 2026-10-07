/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The standards besides WCAG that a result's `meta.normativeMappings` can name.
 *
 * PURPOSE
 * -------
 * Every rule is written against WCAG. Other standards restate or reorganise
 * those criteria under their own numbers, and a caller auditing against one of
 * them wants its numbers on each result. This registry is the one place that
 * knows which standards exist; the build, the runner's `engineOptions.mappings`
 * and the reporters all read it. A standard that renumbers WCAG (EN 301 549)
 * is a table of its own plus one entry here. A standard with verdicts of its
 * own is a profile under profiles/, which brings its entry, tables,
 * rules and tests with it; the registry appends the entries of
 * profiles/index.js after its own.
 *
 * ENTRY SHAPE
 * -----------
 * - key: the name a caller writes in `engineOptions.mappings` ('en301549'),
 *   also the SARIF tag prefix and the JUnit property name. Lowercase, no ':'.
 * - standard: the `standard` its entries carry ('EN 301 549'), also the label
 *   the HTML report shows.
 * - versions: the versions it has a table for, oldest first. An entry's
 *   `version` is always one of these.
 * - profiles: optional named conformance targets it brings, each the WCAG
 *   version-origin tags it runs and the version of the standard it targets.
 *   A profile switches its own version's mappings on. With `mappedRules`, it
 *   also runs every rule this standard maps for that version, which matters
 *   when the standard checks things WCAG leaves to best practice (heading
 *   hierarchy, say): those rules carry no WCAG tag to select them by.
 *   A profile may also have `exclude: { rules, criteria }`: rules it does not
 *   run, and WCAG criteria it waives (their WCAG rollups go, and so does a rule
 *   whose every criterion is waived). See profileExclusions below.
 * - mappingsFor({ id, wcagSc, checksIds }): the entries for a rule or a
 *   composite, given its id and the WCAG criteria it maps to; a composite also
 *   passes `checksIds`, its rules. Each entry is
 *   { standard, version, requirement, title, wcagSc, ...extra }, where
 *   `wcagSc` lists the WCAG criteria the requirement corresponds to, so a
 *   per-criterion view can tell which entries belong under which criterion.
 *   It is empty for a requirement WCAG does not make; a per-criterion view
 *   then shows the entry under every criterion of the rule that names it. A
 *   standard may add fields of its own (a `criterion`, say).
 * - ruleTag: optional; a tag that marks rules checking this standard's own
 *   requirements, ones WCAG does not make (a doctype or presentational
 *   attributes, say). A rule carrying it is opt-in: it runs only when a
 *   selection asks for it by that tag or by id, typically through one of this
 *   standard's profiles, so a scan that targets WCAG never reports a failure
 *   WCAG does not define. Must not be a WCAG tag.
 * - ruleMapped: optional; true when the standard's entries come from each
 *   rule rather than from the WCAG criterion. A rollup then names only
 *   the entries of the rules that produced its outcome; a standard that
 *   restates the criterion itself (EN 301 549) names the same entry
 *   whichever rule decided.
 * - restatedPrefixes: optional, with ruleMapped; the prefixes of requirement
 *   ids that restate a WCAG criterion one for one (['A.'] for a standard whose
 *   part A renumbers WCAG). A rollup names those entries whatever rule decided
 *   its outcome, as it names a standard's that is not rule-mapped (EN 301
 *   549), and the others only for the rules that decided it.
 * - composites(): optional; rollups of the standard's own, shaped like the
 *   entries of src/catalogs/composites.wcag.js and carrying the standard's
 *   ruleTag in meta.tags so only a run that asks for the standard produces
 *   them (one per requirement, say).
 * - validate(rules): optional; given every rule ([{ ruleId, wcagSc }]),
 *   returns a list of problems with the standard's own tables. The build
 *   fails on any.
 * - report: optional; how the HTML report shows the standard's own rollups.
 *   `noteKey` is a dictionary key for the note above their table, and
 *   `titleLang` the language their titles are written in when that is not
 *   the scan's (titles written in French whatever the locale, say).
 *
 * Mappings state a correspondence between published documents, nothing more:
 * which standard or version applies to whom is not an engine question.
 */

const { EN301549_VERSIONS, en301549MappingsForScs } = require('./en301549-map');
const { wcagTags } = require('../wcag');
const { wcagLinks } = require('./wcag-criteria');
const PROFILES = require('../../profiles');

// The WCAG A and AA tags of the WCAG version an EN 301 549 version is built on.
const en301549Tags = (version) =>
  wcagTags(EN301549_VERSIONS.find((v) => v.version === version).wcagVersion);

const NORMATIVE_STANDARDS = [
  {
    key: 'en301549',
    standard: 'EN 301 549',
    versions: EN301549_VERSIONS.map((v) => v.version),
    // Chapter 9 restates WCAG A and AA: V4.1.1 is built on 2.2, V3.2.1 on 2.1
    // (which keeps 4.1.1 Parsing).
    profiles: {
      'en301549-v4.1.1': { version: 'V4.1.1', tags: en301549Tags('V4.1.1') },
      'en301549-v3.2.1': { version: 'V3.2.1', tags: en301549Tags('V3.2.1') }
    },
    mappingsFor: ({ wcagSc }) => en301549MappingsForScs(wcagSc)
  },
  // The standards that bring their own verdicts, each from its profile
  // (profiles/).
  ...PROFILES.map((p) => p.standard)
];

// The entries every registered standard gives a rule or composite, in
// registry order.
function standardMappingsFor({ id, wcagSc, checksIds }) {
  const out = [];
  for (const s of NORMATIVE_STANDARDS) out.push(...s.mappingsFor({ id, wcagSc, checksIds }));
  return out;
}

// For each profile with `mappedRules`, the ids of the rules its standard maps
// for the profile's version, given every rule ([{ ruleId, wcagSc }]).
function profileRuleIds(rules) {
  const out = {};
  for (const s of NORMATIVE_STANDARDS) {
    for (const [name, p] of Object.entries(s.profiles || {})) {
      if (!p.mappedRules) continue;
      out[name] = rules
        .filter((r) =>
          s.mappingsFor({ id: r.ruleId, wcagSc: r.wcagSc }).some((m) => m.version === p.version)
        )
        .map((r) => r.ruleId)
        .sort();
    }
  }
  return out;
}

// Every registered standard's own rollups, in registry order.
function standardComposites() {
  return NORMATIVE_STANDARDS.flatMap((s) => (typeof s.composites === 'function' ? s.composites() : []));
}

// Every registered standard's problems with its own tables, given every rule.
function validateStandards(rules) {
  return NORMATIVE_STANDARDS.flatMap((s) =>
    typeof s.validate === 'function' ? s.validate(rules).map((p) => `${s.key}: ${p}`) : []
  );
}

// A rule's `normativeMappings` with every registered standard's entries for it
// appended. An entry the rule already declares is not repeated. Only WCAG
// criteria are followed: an Understanding-document entry, or one for another
// standard, shares a `requirement` with a criterion without being one.
function withStandardMappings(normativeMappings, id) {
  // A WCAG criterion entry links its criterion and its Understanding
  // document in its version, unless the rule gave its own.
  const list = (Array.isArray(normativeMappings) ? normativeMappings : []).map((m) => {
    if (!m || m.type || (m.standard != null && m.standard !== 'WCAG')) return m;
    // Only for a stated version: a link to another version's page would be wrong.
    const links = m.version ? wcagLinks(m.requirement, String(m.version)) : null;
    if (!links) return m;
    return {
      ...m,
      url: m.url || links.url,
      understandingUrl: m.understandingUrl || links.understandingUrl
    };
  });
  const wcagSc = list
    .filter((m) => m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type)
    .map((m) => String(m.requirement).trim());
  const key = (m) => `${m.standard}|${m.version}|${m.requirement}`;
  const seen = new Set(list.filter(Boolean).map(key));
  const added = standardMappingsFor({ id, wcagSc }).filter((m) => {
    if (seen.has(key(m))) return false;
    seen.add(key(m));
    return true;
  });
  return list.concat(added);
}

// The registry as plain data, for what cannot call functions: the generated
// core (inlined as JSON) and the reporters.
function standardsData() {
  return NORMATIVE_STANDARDS.map((s) => ({
    key: s.key,
    standard: s.standard,
    versions: s.versions.slice(),
    profiles: Object.fromEntries(
      Object.entries(s.profiles || {}).map(([name, p]) => [
        name,
        {
          version: p.version,
          tags: p.tags.slice(),
          ...(p.mappedRules ? { mappedRules: true } : {}),
          ...(p.exclude ? { exclude: normalizeExclude(p.exclude) } : {})
        }
      ])
    ),
    ...(s.ruleTag ? { ruleTag: s.ruleTag } : {}),
    ...(s.ruleMapped ? { ruleMapped: true } : {}),
    ...(s.ruleMapped && Array.isArray(s.restatedPrefixes) && s.restatedPrefixes.length
      ? { restatedPrefixes: s.restatedPrefixes.map(String) }
      : {})
  }));
}

// A profile's `exclude`, as lists: { rules: [...], criteria: [...] }.
function normalizeExclude(exclude) {
  const list = (v) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
  return { rules: list(exclude && exclude.rules), criteria: list(exclude && exclude.criteria) };
}

// What each profile with `exclude` leaves out, given every rule
// ([{ ruleId, wcagSc }]) and every WCAG rollup ([{ id, wcagSc }]):
// { [profile]: { rules, criteria, ruleIds, rollupIds } }. `rules` and
// `criteria` are what it declared; `ruleIds` the rules it does not run (the
// ones it names, and those whose every WCAG criterion it waives) and
// `rollupIds` the WCAG rollups of the criteria it waives. A rule that also
// checks a criterion it keeps still runs. Throws, naming every problem, on an
// unknown rule or criterion, or on a rule the profile excludes and also maps.
function profileExclusions(rules, rollups) {
  const known = new Set(rules.map((r) => r.ruleId));
  const knownSc = new Set(rules.flatMap((r) => r.wcagSc || []).concat(rollups.flatMap((r) => r.wcagSc || [])));
  const mapped = profileRuleIds(rules);
  const problems = [];
  const out = {};
  for (const s of NORMATIVE_STANDARDS) {
    for (const [name, p] of Object.entries(s.profiles || {})) {
      if (!p.exclude) continue;
      const { rules: ids, criteria } = normalizeExclude(p.exclude);
      for (const id of ids) {
        if (!known.has(id)) problems.push(`${name}: exclude.rules names ${id}, which is no rule`);
        else if ((mapped[name] || []).includes(id)) {
          problems.push(`${name}: excludes ${id}, which its standard maps for the same version`);
        }
      }
      for (const sc of criteria) {
        if (!knownSc.has(sc)) problems.push(`${name}: exclude.criteria names ${sc}, which no rule or rollup checks`);
      }
      const waived = (list) => list.length > 0 && list.every((sc) => criteria.includes(sc));
      const ruleIds = [...new Set(ids.concat(rules.filter((r) => waived(r.wcagSc || [])).map((r) => r.ruleId)))].sort();
      const rollupIds = rollups.filter((r) => waived(r.wcagSc || [])).map((r) => r.id).sort();
      out[name] = { rules: ids, criteria, ruleIds, rollupIds };
    }
  }
  if (problems.length) throw new Error(`profile exclusions:\n  ${problems.join('\n  ')}`);
  return out;
}

// A profile depends on core only, never on another profile: the rules a
// standard maps, and the bases of its rules' variants, are core's or its own,
// not another standard's opt-in rules. A rule two standards need belongs in
// core. Given every rule ([{ ruleId, wcagSc, tags, variantOf }]), the problems.
function validateProfileIndependence(rules) {
  const byId = new Map(rules.map((r) => [r.ruleId, r]));
  const ownerTag = (r) =>
    NORMATIVE_STANDARDS.map((s) => s.ruleTag).find((t) => t && (r.tags || []).includes(t)) || null;
  const problems = [];
  for (const s of NORMATIVE_STANDARDS) {
    for (const r of rules) {
      const tag = ownerTag(r);
      if (!tag || tag === s.ruleTag) continue;
      if (s.mappingsFor({ id: r.ruleId, wcagSc: r.wcagSc || [] }).length) {
        problems.push(
          `${s.key} maps ${r.ruleId}, a rule of the standard tagged ${tag}: map a core rule or one of its own`
        );
      }
    }
    for (const r of rules) {
      if (!s.ruleTag || !r.variantOf || ownerTag(r) !== s.ruleTag) continue;
      const base = byId.get(r.variantOf);
      const tag = base && ownerTag(base);
      if (tag && tag !== s.ruleTag) {
        problems.push(`${s.key}'s ${r.ruleId} is a variant of ${base.ruleId}, a rule of the standard tagged ${tag}`);
      }
    }
  }
  return problems;
}

// The registered standard an entry belongs to, or null (WCAG itself, or a
// standard the engine does not know, such as one a custom rule declares).
function standardOfEntry(m) {
  if (!m || typeof m !== 'object' || !m.requirement) return null;
  return NORMATIVE_STANDARDS.find((s) => s.standard === m.standard) || null;
}

module.exports = {
  NORMATIVE_STANDARDS,
  profileExclusions,
  validateProfileIndependence,
  standardMappingsFor,
  withStandardMappings,
  validateStandards,
  standardComposites,
  profileRuleIds,
  standardsData,
  standardOfEntry
};
