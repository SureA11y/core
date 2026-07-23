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
    if (!Array.isArray(value)) return [];
    return value.map(String).map((s) => s.trim()).filter(Boolean);
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

  const m = (meta && typeof meta === 'object') ? meta : {};

  const title = (typeof m.title === 'string' && m.title.trim()) ? m.title.trim() : id;
  const description = (typeof m.description === 'string') ? m.description : '';
  const helpUrl = (typeof m.helpUrl === 'string') ? m.helpUrl : '';

  const i18n = (m.i18n && typeof m.i18n === 'object' && !Array.isArray(m.i18n))
      ? { ...m.i18n }
      : null;

  const tags = normalizeStringArray(m.tags).map((t) => t.toLowerCase());
  if (!tags.includes(engineTag)) tags.push(engineTag);

  const normativeMappings = normalizeObjectArray(m.normativeMappings);
  const wcagSc = deriveWcagScFromNormativeMappings(normativeMappings);
  const informativeReferences = normalizeObjectArray(m.informativeReferences);

  const defaultSeverity = (typeof m.defaultSeverity === 'string' && m.defaultSeverity.trim())
      ? m.defaultSeverity.trim()
      : 'moderate';

  const defaultConfidence = (typeof m.defaultConfidence === 'string' && m.defaultConfidence.trim())
      ? m.defaultConfidence.trim()
      : 'medium';

  const type = (m.type === 'manual' || m.type === 'automatic')
      ? m.type
      : 'automatic';

  const coverage = (m.coverage === null || typeof m.coverage === 'string' || typeof m.coverage === 'object')
      ? m.coverage
      : null;

  const ruleInterfaceVersion = (typeof m.ruleInterfaceVersion === 'string' && m.ruleInterfaceVersion.trim())
      ? m.ruleInterfaceVersion.trim()
      : '1.0.0';

  const ruleVersion = (typeof m.ruleVersion === 'string' && m.ruleVersion.trim())
      ? m.ruleVersion.trim()
      : '0.0.0';

  const normative = (typeof m.normative === 'boolean') ? m.normative : true;
  const atomic = (typeof m.atomic === 'boolean') ? m.atomic : true;

  const category = (typeof m.category === 'string' && m.category.trim()) ? m.category.trim() : null;
  const standard = (typeof m.standard === 'string' && m.standard.trim()) ? m.standard.trim() : null;

  const applicability = (typeof m.applicability === 'string') ? m.applicability : '';
  const expectation = (typeof m.expectation === 'string') ? m.expectation : '';

  const references = Array.isArray(m.references) ? m.references.slice() : [];
  const requirements = (m.requirements === null || typeof m.requirements === 'string' || typeof m.requirements === 'object')
      ? m.requirements
      : null;

  const mappings = (m.mappings === null || typeof m.mappings === 'string' || typeof m.mappings === 'object')
      ? m.mappings
      : null;

  if (!Array.isArray(tags)) throw new Error(`Rule ${ruleId}: meta.tags must be an array`);
  if (!Array.isArray(normativeMappings)) throw new Error(`Rule ${ruleId}: meta.normativeMappings must be an array`);
  if (!Array.isArray(informativeReferences)) throw new Error(`Rule ${ruleId}: meta.informativeReferences must be an array`);
  if (type !== 'automatic' && type !== 'manual') throw new Error(`Rule ${ruleId}: meta.type must be "automatic" or "manual"`);

  if (i18n) {
    if (typeof i18n.titleKey !== 'string' || !i18n.titleKey.trim()) {
      throw new Error(`Rule ${ruleId}: meta.i18n.titleKey must be a non-empty string`);
    }
    if (i18n.descriptionKey != null && (typeof i18n.descriptionKey !== 'string' || !i18n.descriptionKey.trim())) {
      throw new Error(`Rule ${ruleId}: meta.i18n.descriptionKey must be a non-empty string when provided`);
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
    category,
    standard,
    applicability,
    expectation,
    references,
    requirements,
    mappings
  };
}

module.exports = { normalizeRuleMeta };
