/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Normalizes a rule module's `meta` export into the stable shape CHECK_DEFS
 * entries use everywhere else (build-time rules and runtime-registered
 * custom rules alike).
 *
 * Zero free vars (besides its own params) -- this gets inlined into the
 * generated core.js runtime via inlineConstFunction, the same mechanism
 * dom-helpers.js/dom-runner.js use, so it must stay self-contained/embeddable
 * via .toString(). engineTag is a param (not a closed-over module constant)
 * for exactly that reason.
 */
function normalizeRuleMeta(ruleId, id, meta, engineTag) {
  function normalizeStringArray(value) {
    // A single string is a list of one or more, separated by commas or
    // spaces: tags: 'mytag' is ['mytag'], not no tags at all.
    if (typeof value === 'string') return value.split(/[\s,]+/).filter(Boolean);
    if (!Array.isArray(value)) return [];
    return value
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function normalizeObjectArray(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((v) => v && typeof v === 'object' && !Array.isArray(v))
      .map((v) => ({ ...v }));
  }

  function deriveWcagScFromNormativeMappings(normativeMappings) {
    const nm = Array.isArray(normativeMappings) ? normativeMappings : [];
    const out = new Set();
    for (const m of nm) {
      if (!m || typeof m !== 'object') continue;
      if (String(m.standard || '').toUpperCase() !== 'WCAG') continue;
      const req = String(m.requirement || '').trim();
      if (req) out.add(req);
    }
    return Array.from(out).sort();
  }

  const m = meta && typeof meta === 'object' ? meta : {};

  const title = typeof m.title === 'string' && m.title.trim() ? m.title.trim() : id;
  const description = typeof m.description === 'string' ? m.description : '';
  const helpUrl = typeof m.helpUrl === 'string' ? m.helpUrl : '';

  const i18n =
    m.i18n && typeof m.i18n === 'object' && !Array.isArray(m.i18n) ? { ...m.i18n } : null;

  const tags = normalizeStringArray(m.tags).map((t) => t.toLowerCase());
  if (!tags.includes(engineTag)) tags.push(engineTag);

  const normativeMappings = normalizeObjectArray(m.normativeMappings);
  const wcagSc = deriveWcagScFromNormativeMappings(normativeMappings);
  const informativeReferences = normalizeObjectArray(m.informativeReferences);

  // The sets the result types promise (src/index.d.ts): a value outside
  // them reached every result as is ('blocker'), and a type spelt 'Manual'
  // made a manual rule automatic, losing the manual-fail coercion.
  function oneOf(field, value, allowed, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    const v = String(value).trim().toLowerCase();
    if (!allowed.includes(v)) {
      throw new Error(
        `Rule ${ruleId}: meta.${field} must be one of ${allowed.join(', ')}, not ${JSON.stringify(value)}`
      );
    }
    return v;
  }
  const defaultSeverity = oneOf(
    'defaultSeverity',
    m.defaultSeverity,
    ['minor', 'moderate', 'serious', 'critical'],
    'moderate'
  );
  const defaultConfidence = oneOf(
    'defaultConfidence',
    m.defaultConfidence,
    ['high', 'medium', 'low'],
    'medium'
  );
  const type = oneOf('type', m.type, ['automatic', 'manual'], 'automatic');

  const coverage =
    m.coverage === null || typeof m.coverage === 'string' || typeof m.coverage === 'object'
      ? m.coverage
      : null;

  const ruleInterfaceVersion =
    typeof m.ruleInterfaceVersion === 'string' && m.ruleInterfaceVersion.trim()
      ? m.ruleInterfaceVersion.trim()
      : '1.0.0';

  const ruleVersion =
    typeof m.ruleVersion === 'string' && m.ruleVersion.trim() ? m.ruleVersion.trim() : '0.0.0';

  const normative = typeof m.normative === 'boolean' ? m.normative : true;
  const atomic = typeof m.atomic === 'boolean' ? m.atomic : true;

  // Deprecation signal for the rule catalog (see docs/API_STABILITY.md).
  // Purely informational -- a deprecated rule still runs and produces
  // results completely normally; this is a catalog-level migration signal
  // for integrators, not an automatic exclusion.
  const deprecated = typeof m.deprecated === 'boolean' ? m.deprecated : false;
  const deprecation =
    deprecated &&
    m.deprecation &&
    typeof m.deprecation === 'object' &&
    !Array.isArray(m.deprecation)
      ? {
          replacedBy:
            typeof m.deprecation.replacedBy === 'string' && m.deprecation.replacedBy.trim()
              ? m.deprecation.replacedBy.trim()
              : null,
          reason: typeof m.deprecation.reason === 'string' ? m.deprecation.reason.trim() : '',
          sinceVersion:
            typeof m.deprecation.sinceVersion === 'string' ? m.deprecation.sinceVersion.trim() : ''
        }
      : null;

  if (deprecated && (!deprecation || !deprecation.reason || !deprecation.sinceVersion)) {
    throw new Error(
      `Rule ${ruleId}: meta.deprecated:true requires meta.deprecation.reason and meta.deprecation.sinceVersion`
    );
  }

  const category = typeof m.category === 'string' && m.category.trim() ? m.category.trim() : null;
  const standard = typeof m.standard === 'string' && m.standard.trim() ? m.standard.trim() : null;

  const applicability = typeof m.applicability === 'string' ? m.applicability : '';
  const expectation = typeof m.expectation === 'string' ? m.expectation : '';

  const references = Array.isArray(m.references) ? m.references.slice() : [];
  const requirements =
    m.requirements === null ||
    typeof m.requirements === 'string' ||
    typeof m.requirements === 'object'
      ? m.requirements
      : null;

  const mappings =
    m.mappings === null || typeof m.mappings === 'string' || typeof m.mappings === 'object'
      ? m.mappings
      : null;

  // What the rule measures against a threshold, when it reports a margin
  // (src/core/margin.js): { measure, unit, limit }. Malformed = no margin;
  // scripts/validate-rule.js rejects one on a built-in rule.
  const margin = (() => {
    const g = m.margin;
    if (!g || typeof g !== 'object' || Array.isArray(g)) return null;
    const measure = typeof g.measure === 'string' ? g.measure.trim() : '';
    if (!measure) return null;
    if (['px', 'ratio'].indexOf(g.unit) === -1) return null;
    if (['min', 'max'].indexOf(g.limit) === -1) return null;
    return { measure, unit: g.unit, limit: g.limit };
  })();

  if (i18n) {
    if (typeof i18n.titleKey !== 'string' || !i18n.titleKey.trim()) {
      throw new Error(`Rule ${ruleId}: meta.i18n.titleKey must be a non-empty string`);
    }
    if (
      i18n.descriptionKey != null &&
      (typeof i18n.descriptionKey !== 'string' || !i18n.descriptionKey.trim())
    ) {
      throw new Error(
        `Rule ${ruleId}: meta.i18n.descriptionKey must be a non-empty string when provided`
      );
    }
  }

  return {
    title,
    description,
    i18n,
    helpUrl,
    tags,
    wcagSc,
    normativeMappings,
    informativeReferences,
    defaultSeverity,
    defaultConfidence,
    type,
    coverage,

    ruleInterfaceVersion,
    ruleVersion,
    normative,
    atomic,
    deprecated,
    deprecation,
    category,
    standard,
    applicability,
    expectation,
    references,
    requirements,
    mappings,
    margin
  };
}

module.exports = { normalizeRuleMeta };
