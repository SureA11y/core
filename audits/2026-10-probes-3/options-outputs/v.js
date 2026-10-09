'use strict';
// A validator of a scan result against docs/OUTPUT_SCHEMA.md and the
// invariants it states. Returns a list of problems as strings.
const OUTCOMES = ['pass', 'fail', 'cantTell', 'notApplicable'];
const NORM = { pass: 'pass', fail: 'fail', cantTell: 'cantTell', notApplicable: 'inapplicable' };
const SEV = ['minor', 'moderate', 'serious', 'critical'];
const CONF = ['high', 'medium', 'low'];
const UNC = ['not-computable', 'runtime-dependent', 'spec-only', 'equivalence-unknown', 'judgement-required', 'out-of-scope'];
const TOP = ['engine', 'url', 'title', 'timestamp', 'perfStats', 'contextSelector', 'contextMatch', 'checksResults', 'rulesResults', 'overriddenBuiltinIds', 'skippedCustomRules', 'standards', 'skippedPacks', 'ruleTimings'];
const ENGINE = ['tag', 'version', 'schemaVersion', 'locale', 'wcagVersion', 'environment', 'profile', 'profileExcludes', 'optInRules', 'mappings', 'outputDetail', 'packs'];
const CHECK = ['ruleId', 'outcome', 'outcomeNormalized', 'severity', 'ruleSeverity', 'confidence', 'type', 'occurrences', 'title', 'description', 'i18n', 'meta', 'engineOptions', 'schemaVersion', 'rollupIds', 'data', 'margin', 'wcagVersionScope', 'error'];
const META = ['ruleId', 'ruleInterfaceVersion', 'ruleVersion', 'normative', 'atomic', 'deprecated', 'deprecation', 'category', 'helpUrl', 'tags', 'normativeMappings', 'standard', 'applicability', 'expectation', 'references', 'requirements', 'mappings'];
const OCC = ['selector', 'html', 'structuralPath', 'shadowHostSelectors', 'summary', 'hint', 'i18n', 'occurrenceOutcome', 'uncertainty', 'data'];
const COMPACT = ['ruleId', 'outcome', 'type', 'margin', 'error'];

function validate(r, { doc, pkgVersion } = {}) {
  const p = [];
  const err = (m) => p.push(m);
  const extra = (obj, allowed, where) => {
    for (const k of Object.keys(obj || {})) if (!allowed.includes(k)) err(`${where}: undocumented field "${k}"`);
  };
  const isStr = (v) => typeof v === 'string';
  if (!r || typeof r !== 'object') return ['not an object'];
  extra(r, TOP, 'top');
  for (const k of ['engine', 'url', 'title', 'timestamp', 'perfStats', 'contextSelector', 'contextMatch', 'checksResults', 'rulesResults', 'overriddenBuiltinIds', 'skippedCustomRules']) if (!(k in r)) err(`top: missing "${k}"`);
  const e = r.engine || {};
  extra(e, ENGINE, 'engine');
  for (const k of ['tag', 'version', 'schemaVersion', 'locale', 'wcagVersion', 'environment']) if (!(k in e)) err(`engine: missing ${k}`);
  if (pkgVersion && e.version !== pkgVersion) err(`engine.version ${e.version} != package ${pkgVersion}`);
  if (!['2.0', '2.1', '2.2'].includes(e.wcagVersion)) err('engine.wcagVersion ' + e.wcagVersion);
  if (e.locale && !['ok', 'primary-subtag', 'dictionary-not-loaded', 'unknown-locale', 'partial-dictionary'].includes(e.locale.reason)) err('locale.reason ' + e.locale.reason);
  const compact = e.outputDetail === 'findings';
  const ruleIds = new Set();
  const rollIds = new Set((r.rulesResults || []).map((x) => x.ruleId));
  for (const c of r.checksResults || []) {
    const w = `check ${c.ruleId}`;
    if (ruleIds.has(c.ruleId)) err(`${w}: duplicate ruleId`);
    ruleIds.add(c.ruleId);
    if (!OUTCOMES.includes(c.outcome)) err(`${w}: outcome ${c.outcome}`);
    const isCompact = compact && !c.meta;
    if (isCompact) {
      extra(c, COMPACT, w + ' (compact)');
      if (!['pass', 'notApplicable'].includes(c.outcome)) err(`${w}: compact but outcome ${c.outcome}`);
      continue;
    }
    if (compact && (c.outcome === 'pass' || c.outcome === 'notApplicable') && !(c.occurrences || []).length) err(`${w}: findings detail but full pass/NA without occurrences`);
    extra(c, CHECK, w);
    for (const k of ['outcomeNormalized', 'severity', 'confidence', 'type', 'occurrences', 'title', 'description', 'i18n', 'meta', 'engineOptions', 'schemaVersion', 'rollupIds']) if (!(k in c)) err(`${w}: missing ${k}`);
    if (c.outcomeNormalized !== NORM[c.outcome]) err(`${w}: outcomeNormalized ${c.outcomeNormalized} for ${c.outcome}`);
    if (!SEV.includes(c.severity)) err(`${w}: severity ${c.severity}`);
    if ('ruleSeverity' in c && !SEV.includes(c.ruleSeverity)) err(`${w}: ruleSeverity ${c.ruleSeverity}`);
    if (!CONF.includes(c.confidence)) err(`${w}: confidence ${c.confidence}`);
    if (!['automatic', 'manual'].includes(c.type)) err(`${w}: type ${c.type}`);
    if (c.type === 'manual' && c.outcome === 'fail') err(`${w}: manual fail`);
    if (!isStr(c.title) || !c.title.trim()) err(`${w}: empty title`);
    if (!Array.isArray(c.rollupIds)) err(`${w}: rollupIds not array`);
    else for (const id of c.rollupIds) if (!rollIds.has(id)) err(`${w}: rollupId ${id} not in rulesResults`);
    if (c.meta) {
      extra(c.meta, META, w + ' meta');
      for (const k of META) if (!(k in c.meta)) err(`${w} meta: missing ${k}`);
      if (c.meta.ruleId !== c.ruleId) err(`${w}: meta.ruleId ${c.meta.ruleId}`);
      if (!Array.isArray(c.meta.tags)) err(`${w}: meta.tags not array`);
      if (!isStr(c.meta.helpUrl)) err(`${w}: helpUrl not string`);
    }
    const occs = c.occurrences || [];
    if (c.outcome === 'fail' && !occs.length) err(`${w}: fail without occurrences`);
    if (c.outcome === 'fail' && occs.length && !occs.some((o) => !o.occurrenceOutcome || o.occurrenceOutcome === 'fail')) err(`${w}: fail with no fail-tier occurrence`);
    if (c.outcome === 'pass' && occs.length && !/^contrast-/.test(c.ruleId)) err(`${w}: pass with ${occs.length} occurrences`);
    if (c.error && c.outcome !== 'cantTell' && !/coerc|ignored|depth/i.test(c.error)) err(`${w}: error on ${c.outcome}: ${c.error.slice(0, 80)}`);
    if (c.wcagVersionScope && c.outcome !== 'cantTell') err(`${w}: wcagVersionScope on ${c.outcome}`);
    occs.forEach((o, i) => {
      const ow = `${w} occ#${i}`;
      extra(o, OCC, ow);
      for (const k of ['selector', 'html', 'structuralPath', 'summary', 'hint', 'i18n']) if (!(k in o)) err(`${ow}: missing ${k}`);
      if (!isStr(o.selector) || !isStr(o.html)) err(`${ow}: selector/html not strings`);
      if (!isStr(o.summary) || !o.summary.trim()) err(`${ow}: empty summary`);
      if (o.structuralPath !== null && !Array.isArray(o.structuralPath)) err(`${ow}: structuralPath type`);
      if (o.occurrenceOutcome && !['fail', 'cantTell'].includes(o.occurrenceOutcome)) err(`${ow}: occurrenceOutcome ${o.occurrenceOutcome}`);
      if (o.uncertainty) {
        if (!UNC.includes(o.uncertainty.code)) err(`${ow}: uncertainty.code ${o.uncertainty.code}`);
        if (o.occurrenceOutcome === 'fail') err(`${ow}: uncertainty on fail tier`);
      }
      if (o.html && o.html.length > 2000) err(`${ow}: html longer than 2000 (${o.html.length})`);
      // Selector resolves to the element at structuralPath, in the light DOM.
      if (doc && o.selector && !o.shadowHostSelectors && Array.isArray(o.structuralPath)) {
        let byPath = doc.documentElement;
        for (const ix of o.structuralPath) byPath = byPath && byPath.children[ix];
        let bySel = null;
        try { bySel = doc.querySelector(o.selector); } catch { err(`${ow}: selector invalid ${o.selector}`); }
        if (bySel && byPath && bySel !== byPath) err(`${ow}: selector and structuralPath disagree (${o.selector})`);
        if (!bySel && c.ruleId !== 'page-title-present') err(`${ow}: selector resolves to nothing (${o.selector})`);
      }
    });
  }
  for (const c of r.rulesResults || []) {
    const w = `rollup ${c.ruleId}`;
    if (!OUTCOMES.includes(c.outcome)) err(`${w}: outcome`);
    if (c.outcomeNormalized !== NORM[c.outcome]) err(`${w}: outcomeNormalized`);
    if (!Array.isArray(c.occurrences) || c.occurrences.length) err(`${w}: occurrences not []`);
    const d = c.data && c.data.details;
    if (!d) { err(`${w}: no data.details`); continue; }
    const m = d.metrics || {};
    const contributors = d.contributors || [];
    const sum = (m.failCount || 0) + (m.cantTellCount || 0) + (m.notApplicableCount || 0) + (m.passCount || 0) + (m.missingCount || 0);
    if (sum !== (d.checksIds || []).length) err(`${w}: metrics sum ${sum} != checksIds ${(d.checksIds || []).length}`);
    for (const ct of contributors) {
      if (!ruleIds.has(ct.testId) && ct.outcome !== 'missing') err(`${w}: contributor ${ct.testId} not in checksResults`);
      const cr = (r.checksResults || []).find((x) => x.ruleId === ct.testId);
      if (cr && cr.outcome !== ct.outcome) err(`${w}: contributor ${ct.testId} outcome ${ct.outcome} != check ${cr.outcome}`);
      if (cr && !(cr.rollupIds || [c.ruleId]).includes(c.ruleId) && cr.meta) err(`${w}: check ${ct.testId} rollupIds lacks ${c.ruleId}`);
    }
    const outs = contributors.map((x) => x.outcome);
    const expect = outs.includes('fail') ? 'fail' : outs.includes('cantTell') || m.missingCount > 0 ? 'cantTell' : outs.length && outs.every((o) => o === 'notApplicable') ? 'notApplicable' : outs.length ? 'pass' : null;
    if (expect && expect !== c.outcome) err(`${w}: outcome ${c.outcome}, precedence says ${expect}`);
  }
  // Round trips.
  try {
    const s = JSON.stringify(r);
    if (JSON.stringify(JSON.parse(s)) !== s) err('JSON round trip changes the result');
  } catch (x) { err('JSON.stringify throws: ' + x.message); }
  try { structuredClone(r); } catch (x) { err('structuredClone throws: ' + x.message); }
  return p;
}
module.exports = { validate };
