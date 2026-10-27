'use strict';
// Scan one case and run all oracles. Exports runCase(caseObj) -> {issues:[], ms, ruleTimings}
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
const { attachShadows } = require('./gen.js');

function build(html, shadows) {
  const dom = createDom(html);
  if (shadows && shadows.length) attachShadows(dom.window.document, shadows);
  return dom;
}

function scan(c, { profile = false, parity = false } = {}) {
  const dom = build(c.html, c.shadows);
  const engineOptions = { ...(c.engineOptions || {}) };
  if (profile) {
    engineOptions.perfStats = true;
    engineOptions.profileRules = true;
  }
  dom.window.__a11ycoreEngineOptions = engineOptions;
  dom.window.document.__a11ycoreEngineOptions = engineOptions;
  const t = process.hrtime.bigint();
  let result, error;
  try {
    result = runa11yCoreOnDom(dom, { engineOptions, entryPointParity: parity });
  } catch (e) {
    error = e;
  }
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  return { dom, result, error, ms };
}

function stripVolatile(res) {
  const o = JSON.parse(JSON.stringify(res));
  delete o.timestamp;
  delete o.perfStats;
  delete o.ruleTimings;
  for (const c of o.checksResults || []) {
    if (c.engineOptions) {
      delete c.engineOptions.perfStats;
      delete c.engineOptions.profileRules;
    }
  }
  for (const c of o.rulesResults || []) {
    if (c.engineOptions) {
      delete c.engineOptions.perfStats;
      delete c.engineOptions.profileRules;
    }
  }
  return o;
}

function findBadNumbers(v, path, out) {
  if (typeof v === 'number' && !Number.isFinite(v)) out.push(path + '=' + v);
  else if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) findBadNumbers(v[k], path + '.' + k, out);
  } else if (typeof v === 'function' || typeof v === 'symbol' || typeof v === 'bigint') out.push(path + ':' + typeof v);
}

const BAD_TEXT = /\{\{|\}\}|\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;

function textIssues(res, locale) {
  const issues = [];
  const scanText = (ruleId, field, s, params) => {
    if (typeof s !== 'string') return;
    const m = BAD_TEXT.exec(s);
    if (!m) return;
    // ignore if it is literally carried in user params
    const pv = params ? JSON.stringify(params) : '';
    if (pv.includes(m[0]) && m[0] !== '[object Object]') return;
    issues.push({ kind: 'badText', ruleId, field, locale, match: m[0], text: s.slice(0, 300) });
  };
  for (const c of res.checksResults || []) {
    scanText(c.ruleId, 'title', c.title);
    scanText(c.ruleId, 'description', c.description);
    for (const o of c.occurrences || []) {
      const p = o.i18n && o.i18n.params;
      scanText(c.ruleId, 'summary', o.summary, p);
      scanText(c.ruleId, 'hint', o.hint, p);
      if (o.uncertainty) scanText(c.ruleId, 'uncertainty.needed', o.uncertainty.needed, p);
      if (o.summary === '' && o.selector) issues.push({ kind: 'emptySummary', ruleId: c.ruleId, locale });
    }
  }
  return issues;
}

function resolveSel(doc, o) {
  let root = doc;
  for (const h of o.shadowHostSelectors || []) {
    let host;
    try { host = root.querySelector(h); } catch (e) { return { err: 'hostSelectorThrows: ' + h }; }
    if (!host) return { err: 'hostNotFound: ' + h };
    if (!host.shadowRoot) return { err: 'hostNoOpenShadow: ' + h };
    root = host.shadowRoot;
  }
  let el;
  try { el = root.querySelector(o.selector); } catch (e) { return { err: 'selectorThrows: ' + e.message }; }
  return { el, count: -1 };
}

function pathOf(doc, el) {
  const p = [];
  let n = el;
  while (n && n !== doc.documentElement) {
    const par = n.parentElement;
    if (!par) return null;
    let i = 0;
    for (let q = n.previousElementSibling; q; q = q.previousElementSibling) i++;
    p.unshift(i);
    n = par;
  }
  return n === doc.documentElement ? p : null;
}

function structuralIssues(res, doc) {
  const issues = [];
  for (const c of res.checksResults || []) {
    const occ = c.occurrences || [];
    const tiers = occ.map((o) => o.occurrenceOutcome || c.outcome);
    if (!['pass', 'fail', 'cantTell', 'notApplicable'].includes(c.outcome)) issues.push({ kind: 'badOutcome', ruleId: c.ruleId, outcome: c.outcome });
    if (c.error) issues.push({ kind: 'ruleError', ruleId: c.ruleId, outcome: c.outcome, error: String(c.error).slice(0, 400) });
    if (c.outcome === 'fail' && occ.length === 0) issues.push({ kind: 'failNoOcc', ruleId: c.ruleId });
    if (c.outcome === 'fail' && !tiers.includes('fail')) issues.push({ kind: 'tierFailNoFailOcc', ruleId: c.ruleId });
    if (c.outcome === 'cantTell' && tiers.includes('fail')) issues.push({ kind: 'tierCantTellHasFail', ruleId: c.ruleId });
    if (c.type === 'manual' && c.outcome === 'fail') issues.push({ kind: 'manualFail', ruleId: c.ruleId });
    if (c.outcome === 'pass' && occ.some((o) => o.selector)) issues.push({ kind: 'passWithElementOcc', ruleId: c.ruleId });
    if (c.outcome === 'notApplicable' && occ.some((o) => o.selector)) issues.push({ kind: 'naWithElementOcc', ruleId: c.ruleId });
    for (const o of occ) {
      const tier = o.occurrenceOutcome || c.outcome;
      if (o.uncertainty && tier !== 'cantTell') issues.push({ kind: 'uncertaintyOnNonCantTell', ruleId: c.ruleId, tier });
      if (o.occurrenceOutcome && !['fail', 'cantTell'].includes(o.occurrenceOutcome)) issues.push({ kind: 'badOccTier', ruleId: c.ruleId, t: o.occurrenceOutcome });
      if (!o.selector) continue;
      if (c.ruleId === 'page-title-present' && o.selector === 'head > title') continue;
      const r = resolveSel(doc, o);
      if (r.err) { issues.push({ kind: 'selectorUnresolved', ruleId: c.ruleId, selector: o.selector.slice(0, 200), hosts: o.shadowHostSelectors, why: r.err }); continue; }
      if (!r.el) { issues.push({ kind: 'selectorNoMatch', ruleId: c.ruleId, selector: o.selector.slice(0, 200), hosts: o.shadowHostSelectors }); continue; }
      // identity check
      if (Array.isArray(o.structuralPath)) {
        const p = pathOf(doc, r.el);
        if (!p || p.join(',') !== o.structuralPath.join(',')) issues.push({ kind: 'selectorWrongElement', ruleId: c.ruleId, selector: o.selector.slice(0, 200), sp: o.structuralPath.join(','), got: p && p.join(','), count: r.count });
      } else if (typeof o.html === 'string' && o.html && !/^<(html|head|body)\b/.test(o.html)) {
        const oh = r.el.outerHTML.slice(0, Math.min(200, o.html.length));
        if (!o.html.startsWith(oh.slice(0, 60))) issues.push({ kind: 'selectorWrongElementHtml', ruleId: c.ruleId, selector: o.selector.slice(0, 200), hosts: o.shadowHostSelectors, want: o.html.slice(0, 80), got: oh.slice(0, 80), count: r.count });
      }
    }
  }
  return issues;
}

function runCase(c, { determinism = true, parity = false, profile = true } = {}) {
  const issues = [];
  const a = scan(c, { profile, parity });
  if (a.error) {
    issues.push({ kind: 'throw', msg: String(a.error && a.error.stack || a.error).slice(0, 800) });
    return { issues, ms: a.ms };
  }
  let ruleTimings = a.result.perfStats && a.result.perfStats.ruleTimings;
  let json;
  try {
    json = JSON.stringify(a.result);
  } catch (e) {
    issues.push({ kind: 'notSerializable', msg: e.message });
  }
  const bad = [];
  findBadNumbers(a.result, '$', bad);
  if (bad.length) issues.push({ kind: 'nonJsonValues', paths: bad.slice(0, 10) });
  const locale = (c.engineOptions && c.engineOptions.locale) || 'en';
  issues.push(...textIssues(a.result, locale));
  issues.push(...structuralIssues(a.result, a.dom.window.document));
  try { a.dom.window.close(); } catch (e) {}
  if (determinism && json) {
    const b = scan(c, { profile: false });
    if (b.error) issues.push({ kind: 'throwSecond', msg: String(b.error).slice(0, 400) });
    else {
      const sa = stripVolatile(a.result), sb = stripVolatile(b.result);
      const ja = sa.checksResults, jb = sb.checksResults;
      const diffs = [];
      for (let i = 0; i < Math.max(ja.length, jb.length); i++) {
        const x = JSON.stringify(ja[i]), y = JSON.stringify(jb[i]);
        if (x !== y) diffs.push((ja[i] || jb[i]).ruleId);
      }
      if (diffs.length) issues.push({ kind: 'nondeterministic', rules: diffs });
      try { b.dom.window.close(); } catch (e) {}
    }
  }
  return { issues, ms: a.ms, ruleTimings, result: a.result };
}

module.exports = { runCase, scan, build, stripVolatile };
