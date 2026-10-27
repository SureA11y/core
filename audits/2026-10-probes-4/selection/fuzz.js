'use strict';
const L = require('./lib');
const PK = require('./packs');
const { core } = L;
let seed = Number(process.argv[2] || 1);
const N = Number(process.argv[3] || 200);
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
const pick = (a) => a[Math.floor(rnd() * a.length)];
const some = (a, max = 3) => { const n = 1 + Math.floor(rnd() * max); const o = []; for (let i = 0; i < n; i++) o.push(pick(a)); return [...new Set(o)]; };
const chance = (p) => rnd() < p;

const baseChecks = core.getChecksCatalog();
const ruleIds = baseChecks.map((c) => c.ruleId);
const rollupIds = core.getRulesCatalog().map((r) => r.id);
const sampleRuleIds = L.samplePack.rules.map((r) => r.id);
const sampleRollups = ['sample-1.0-S1', 'sample-2.0-S7', 'sample-1.0-S6', 'sample-2.0-S4'];
const tagPool = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'wcag22aaa', 'wcag244', 'wcag111', 'wcag146', 'wcag411', 'wcag412', 'wcag143', 'wcag258', 'best-practice', 'images', 'links', 'contrast', 'forms', 'aria', 'headings', 'org'];
const levels = ['A', 'AA', 'AAA', 'aa', 'a', 'Aaa'];
const versions = ['2.0', '2.1', '2.2'];

function mangle(id) {
  const r = rnd();
  if (r < 0.6) return id;
  if (r < 0.75) return id.toUpperCase();
  if (r < 0.85) return id.replace(/(^|-)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  if (r < 0.95) return 'a11ycore-' + id;
  return ('A11YCORE-' + id).toUpperCase();
}

const customPool = [
  L.custom('org-chart-alt', { wcagSc: ['1.1.1'], tags: ['org'] }, 'fail'),
  L.custom('org-contrast-aaa', { wcagSc: ['1.4.6'], tags: ['org', 'wcag2aaa', 'wcag146'] }, 'pass'),
  L.custom('org-parsing', { wcagSc: ['4.1.1'], tags: ['org', 'wcag2a', 'wcag411'] }, 'fail'),
  L.custom('org-target', { wcagSc: ['2.5.8'], tags: ['org'] }, 'pass'),
  L.custom('org-bp', { tags: ['org', 'best-practice'] }, 'fail'),
  L.custom('org-name', { wcagSc: ['4.1.2', '2.4.4'], tags: ['org'] }, 'cantTell')
];

function genRunOnly(withPack, customIds, extra) {
  if (chance(0.12)) return null;
  const ids = ruleIds.concat(withPack ? sampleRuleIds : []).concat(customIds);
  const rids = rollupIds.concat(withPack ? sampleRollups : []).concat(extra === PK.standardPack ? ['probe-1.0-P1','probe-2.0-P3','probe-2.0-P4'] : extra === PK.waivePack ? ['wv-links'] : []);
  if (extra === PK.standardPack) ids.push('probe-statement');
  if (chance(0.08)) return some(ids, 3).map(mangle); // shorthand rule array
  if (chance(0.05)) return { type: 'rule', values: some(ids, 2).map(mangle) };
  const r = {};
  if (chance(0.45)) r.includeRuleIds = some(chance(0.2) ? rids : ids, 3).map(mangle);
  if (chance(0.3)) r.tags = some(tagPool.concat(withPack ? ['sample'] : []).concat(extra === PK.standardPack ? ['probe','probe'] : []), 3);
  if (chance(0.25)) r.wcag = { version: pick(versions), level: pick(levels) };
  if (chance(0.2)) r.bestPractices = true;
  if (chance(0.2)) r.excludeRuleIds = some(chance(0.3) ? rids : ids, 2).map(mangle);
  if (chance(0.1)) r.excludeTags = some(['best-practice', 'wcag2aaa', 'contrast', 'links'], 1);
  if (chance(0.1)) r.includeMode = 'or';
  if (chance(0.06)) r.includeTestIds = some(ids, 2).map(mangle);
  if (chance(0.06)) r.excludeTestIds = some(ids, 2).map(mangle);
  if (!Object.keys(r).length) return chance(0.5) ? null : { bestPractices: true };
  return r;
}

function genOptions() {
  const eo = {};
  const pk = rnd();
  const withPack = pk < 0.2;
  const extra = pk >= 0.2 && pk < 0.6 ? (chance(0.5) ? PK.standardPack : PK.waivePack) : null;
  if (withPack) eo.packs = chance(0.3) ? [L.samplePack, PK.waivePack] : [L.samplePack];
  else if (extra) eo.packs = [extra];
  const extraProfiles = extra === PK.standardPack ? ['probe-1.0', 'probe-2.0', 'probe-2.0-plus', 'probe-2.0-wcag', 'PROBE-2.0'] : extra === PK.waivePack ? ['wv-244', 'wv-412', 'wv-rules', 'wv-mixed', 'wv-ruleex'] : [];
  if (chance(0.3)) eo.wcagVersion = pick(versions);
  if (chance(0.4)) eo.wcagLevel = pick(levels);
  if (chance(extraProfiles.length ? 0.7 : 0.35)) eo.profile = pick(['wcag22-aa', 'section508', 'en301549-v4.1.1', 'en301549-v3.2.1'].concat(withPack ? ['sample-1.0', 'sample-2.0', 'SAMPLE-2.0'] : []).concat(extraProfiles, extraProfiles));
  if (extra === PK.standardPack && chance(0.2)) eo.optInRules = 'probe';
  if (extra === PK.standardPack && chance(0.2)) eo.mappings = ['probe'];
  if (chance(0.15)) eo.optInRules = pick(['all', ['sample'], 'sample']);
  if (chance(0.3)) eo.customRules = some(customPool, 3);
  if (chance(0.08)) eo.bogus = 1;
  return { eo, withPack, extra };
}

function genEoSelection(eo, withPack, customIds) {
  const ids = ruleIds.concat(withPack ? sampleRuleIds : []).concat(customIds);
  const r = chance(0.5);
  if (r) eo.rules = { include: some(ids, 2).map(mangle), ...(chance(0.3) ? { exclude: some(ids, 1).map(mangle) } : {}) };
  if (chance(0.3)) eo.tags = { include: some(tagPool, 2) };
  if (chance(0.15)) eo.tests = { exclude: some(ids, 1).map(mangle) };
}

const LR = { A: 1, AA: 2, AAA: 3 };
const findings = []; const stats = { err: 0, msgs: {} };
function note(kind, label, detail) { findings.push({ kind, label, detail }); }

for (let i = 0; i < N; i++) {
  const { eo, withPack, extra } = genOptions();
  const customIds = (eo.customRules || []).map((c) => c.id);
  let runOnly = genRunOnly(withPack, customIds, extra);
  if (runOnly === null && chance(0.6)) genEoSelection(eo, withPack, customIds);
  const label = JSON.stringify({ runOnly, eo: { ...eo, packs: eo.packs ? eo.packs.map((p) => p.name) : undefined, customRules: customIds.length ? customIds : undefined } });
  const listed = L.capture(() => core.getRulesForRunOnly(runOnly, eo));
  const listedChecks = L.capture(() => core.getChecksForRunOnly(runOnly, eo));
  const s = L.scan(runOnly, eo);
  if (!!listed.error !== !!s.error || !!listedChecks.error !== !!s.error) {
    note('throw-parity', label, { listed: listed.error && listed.error.message, checks: listedChecks.error && listedChecks.error.message, scan: s.error && s.error.message });
    continue;
  }
  if (s.error) { stats.err++; stats.msgs[s.error.message.slice(0,90)] = (stats.msgs[s.error.message.slice(0,90)]||0)+1;
    if (!['INVALID_RUN_ONLY', 'INVALID_ENGINE_OPTIONS'].includes(s.error.code)) note('crash', label, s.error.stack);
    continue;
  }
  const res = s.value;
  const scanIds = res.rulesResults.map((r) => r.ruleId);
  const listIds = listed.value.map((x) => x.id);
  if (JSON.stringify(scanIds) !== JSON.stringify(listIds)) {
    note('rules-diff', label, { onlyScan: scanIds.filter((x) => !listIds.includes(x)), onlyList: listIds.filter((x) => !scanIds.includes(x)), orderOnly: scanIds.length === listIds.length && scanIds.every((x) => listIds.includes(x)) });
  }
  const scanChecks = res.checksResults.map((r) => r.ruleId);
  const listChecks = listedChecks.value.map((x) => x.ruleId);
  if (JSON.stringify([...scanChecks].sort()) !== JSON.stringify([...listChecks].sort())) {
    note('checks-diff', label, { onlyScan: scanChecks.filter((x) => !listChecks.includes(x)), onlyList: listChecks.filter((x) => !scanChecks.includes(x)) });
  }
  // warnings parity (list vs scan) - informational
  // invariants
  const lvl = res.engine.wcagLevel;
  const ver = res.engine.wcagVersion;
  const byId = Object.fromEntries(res.checksResults.map((c) => [c.ruleId, c]));
  for (const r of res.rulesResults) {
    const d = r.data.details;
    const outs = d.contributors.map((c) => c.outcome);
    let exp;
    if (outs.includes('fail')) exp = 'fail';
    else if (outs.includes('cantTell') || outs.includes('missing')) exp = 'cantTell';
    else if (outs.length && outs.every((o) => o === 'notApplicable')) exp = 'notApplicable';
    else if (!outs.length) exp = 'cantTell';
    else exp = 'pass';
    if (exp !== r.outcome && !(r.policyOutcome)) note('outcome-vs-children', label, { id: r.ruleId, outcome: r.outcome, contributors: d.contributors });
    // contributor outcomes must match the checks' outcomes
    for (const c of d.contributors) {
      if (c.outcome !== 'missing' && byId[c.testId] && byId[c.testId].outcome !== c.outcome) note('contrib-mismatch', label, { id: r.ruleId, c, check: byId[c.testId].outcome });
      if (c.outcome === 'missing' && byId[c.testId]) note('missing-but-ran', label, { id: r.ruleId, c });
    }
    const notSel = d.contributors.filter((c) => c.notSelected).length;
    if ((d.reasonCode === 'composite.rollup.cantTell.notSelectedChild') !== (notSel > 0 && r.outcome === 'cantTell' && !outs.includes('cantTell'))) note('notSelected-reason', label, { id: r.ruleId, reason: d.reasonCode, notSel });
    const lv = d.level || (r.meta && r.meta.level);
    const sc = d.wcagSc || [];
    const det = r.data.details;
    const wsc = (r.meta && r.meta.normativeMappings || []).filter((m) => m.standard === 'WCAG');
    const rl = wsc[0] && wsc[0].level;
    if (lvl && rl && LR[rl] > LR[lvl]) {
      const named = runOnly && (Array.isArray(runOnly) ? runOnly : (runOnly.includeRuleIds || runOnly.values || [])).some((x) => String(x).toLowerCase().replace(/^a11ycore-/, '') === r.ruleId);
      if (!named) note('above-level', label, { id: r.ruleId, rl, lvl });
    }
    if (ver === '2.2' && r.ruleId === 'wcag-4.1.1-parsing' && notSel > 0) note('411-added-under-22', label, { id: r.ruleId });
    if (ver !== '2.2' && /2\.5\.8|2\.4\.11|3\.3\.8|2\.5\.7|3\.2\.6|3\.3\.7/.test(r.ruleId) && notSel > 0) note('22-added-under-old', label, { id: r.ruleId, ver });
    const stdm = /^(sample|probe)-\d/.exec(r.ruleId);
    if (stdm) {
      const ns = stdm[1];
      const inPlay = (res.engine.profile || '').startsWith(ns) || (eo.optInRules && JSON.stringify(eo.optInRules).match(new RegExp(ns + '|all'))) || (runOnly && !Array.isArray(runOnly) && ((runOnly.tags || []).includes(ns) || (runOnly.includeRuleIds || runOnly.values || []).some((x) => new RegExp('^' + ns + '-\\d', 'i').test(x)))) || (Array.isArray(runOnly) && runOnly.some((x) => new RegExp('^' + ns + '-\\d', 'i').test(x)));
      if (!inPlay) note('standard-not-in-play', label, { id: r.ruleId });
    }
  }
  if (res.engine.profile && /^probe-[12]\.0$/.test(res.engine.profile)) {
    const w = res.rulesResults.filter((r) => /^wcag-/.test(r.ruleId));
    if (w.length) note('mapped-profile-wcag', label, { ids: w.map((r) => r.ruleId) });
  }
  // rollupIds consistency
  for (const c of res.checksResults) {
    const expected = res.rulesResults.filter((r) => r.data.details.checksIds.includes(c.ruleId)).map((r) => r.ruleId);
    if (JSON.stringify(expected) !== JSON.stringify(c.rollupIds)) note('rollupIds', label, { id: c.ruleId, expected, got: c.rollupIds });
  }
  if (i % 5 === 0) {
    const s2 = L.scan(runOnly, eo);
    const strip = (x) => JSON.stringify({ r: x.rulesResults.map((r) => [r.ruleId, r.outcome, r.data.details.reasonCode]), c: x.checksResults.map((r) => [r.ruleId, r.outcome]) });
    if (strip(s2.value) !== strip(res)) note('nondeterministic', label, {});
  }
}
const byKind = {};
for (const f of findings) (byKind[f.kind] = byKind[f.kind] || []).push(f);
for (const [k, list] of Object.entries(byKind)) {
  console.log('==', k, list.length);
  for (const f of list.slice(0, 4)) console.log('  ', f.label, '\n    ', JSON.stringify(f.detail).slice(0, 600));
}
console.log(JSON.stringify(stats,null,1)); if (process.env.W) console.log([...new Set(allWarn)].join('\n')); console.log('done', N, 'findings', findings.length);
