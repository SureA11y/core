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
 * and the reporters all read it, so adding a standard is a table of its own
 * plus one entry here.
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
 *   when the standard checks things WCAG leaves to best practice (RGAA's
 *   heading hierarchy, say): those rules carry no WCAG tag to select them by.
 * - mappingsFor({ id, wcagSc, checksIds }): the entries for a rule or a
 *   composite, given its id and the WCAG criteria it maps to; a composite also
 *   passes `checksIds`, its rules. Each entry is
 *   { standard, version, requirement, title, wcagSc, ...extra }, where
 *   `wcagSc` lists the WCAG criteria the requirement corresponds to, so a
 *   per-criterion view can tell which entries belong under which criterion. A
 *   standard may add fields of its own (RGAA adds `criterion`).
 * - ruleTag: optional; a tag that marks rules checking this standard's own
 *   requirements, ones WCAG does not make (RGAA's doctype or presentational
 *   attributes, say). A rule carrying it is opt-in: it runs only when a
 *   selection asks for it by that tag or by id, typically through one of this
 *   standard's profiles, so a scan that targets WCAG never reports a failure
 *   WCAG does not define. Must not be a WCAG tag.
 * - validate(rules): optional; given every rule ([{ ruleId, wcagSc }]),
 *   returns a list of problems with the standard's own tables. The build
 *   fails on any.
 *
 * Mappings state a correspondence between published documents, nothing more:
 * which standard or version applies to whom is not an engine question.
 */

const { EN301549_VERSIONS, en301549MappingsForScs } = require('./en301549-map');
const { RGAA_VERSIONS } = require('./rgaa-map');
const { rgaaMappingsFor, validateRgaaRuleTests } = require('./rgaa-mappings');

const WCAG21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const WCAG22_AA_TAGS = WCAG21_AA_TAGS.concat(['wcag22a', 'wcag22aa']);

const NORMATIVE_STANDARDS = [
  {
    key: 'en301549',
    standard: 'EN 301 549',
    versions: EN301549_VERSIONS.map((v) => v.version),
    // Chapter 9 restates WCAG A and AA: V4.1.1 is built on 2.2, V3.2.1 on 2.1
    // (which keeps 4.1.1 Parsing).
    profiles: {
      'en301549-v4.1.1': { version: 'V4.1.1', tags: WCAG22_AA_TAGS },
      'en301549-v3.2.1': { version: 'V3.2.1', tags: WCAG21_AA_TAGS }
    },
    mappingsFor: ({ wcagSc }) => en301549MappingsForScs(wcagSc)
  },
  {
    key: 'rgaa',
    standard: 'RGAA',
    versions: RGAA_VERSIONS.map((v) => v.version),
    // RGAA 4.1.2 is built on WCAG 2.1 A and AA; its profile also runs the
    // opt-in rules for RGAA's own requirements.
    profiles: {
      'rgaa-4.1.2': {
        version: '4.1.2',
        tags: WCAG21_AA_TAGS.concat(['rgaa']),
        mappedRules: true
      }
    },
    ruleTag: 'rgaa',
    // Mapped rule by rule (src/coverage/rgaa-rule-map.js): RGAA's criteria are
    // its own, related to WCAG many to many.
    mappingsFor: rgaaMappingsFor,
    validate: validateRgaaRuleTests
  }
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
  const list = Array.isArray(normativeMappings) ? normativeMappings : [];
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
        { version: p.version, tags: p.tags.slice(), ...(p.mappedRules ? { mappedRules: true } : {}) }
      ])
    ),
    ...(s.ruleTag ? { ruleTag: s.ruleTag } : {})
  }));
}

// The registered standard an entry belongs to, or null (WCAG itself, or a
// standard the engine does not know, such as one a custom rule declares).
function standardOfEntry(m) {
  if (!m || typeof m !== 'object' || !m.requirement) return null;
  return NORMATIVE_STANDARDS.find((s) => s.standard === m.standard) || null;
}

module.exports = {
  NORMATIVE_STANDARDS,
  standardMappingsFor,
  withStandardMappings,
  validateStandards,
  profileRuleIds,
  standardsData,
  standardOfEntry
};
