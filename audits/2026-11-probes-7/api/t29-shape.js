const fs = require('fs');
const src = fs.readFileSync('/home/user/core/src/index.d.ts', 'utf8');
function fields(name) {
  const i = src.indexOf('export interface ' + name + ' ');
  let depth = 0, j = src.indexOf('{', i), start = j; const out = new Set(); let idx = false;
  for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}') { depth--; if (!depth) break; } }
  const body = src.slice(start + 1, j);
  let d = 0; let line = '';
  for (const ch of body) { if (ch === '{' || ch === '(' || ch === '<') d++; if (ch === '}' || ch === ')' || ch === '>') d--; if (ch === '\n') { if (d === 0) { const m = line.match(/^\s*(?:readonly\s+)?['"]?([A-Za-z_$][\w$]*)['"]?\??\s*:/); if (m) out.add(m[1]); if (/^\s*\[/.test(line)) idx = true; } line = ''; } else line += ch; }
  // multi-line members: also catch "name?: {" at depth 0 starting lines
  for (const m of body.matchAll(/\n  (?:readonly )?([A-Za-z_$][\w$]*)\??:/g)) out.add(m[1]);
  return { out, idx: /\n  \[[a-zA-Z]+: string\]/.test(body) };
}
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
(async () => {
  const seen = { ScanResult: new Set(), CheckResult: new Set(), Occurrence: new Set(), EngineInfo: new Set(), CompositeResult: new Set() };
  const rule = { id: 'org-x', meta: { title: 'T', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] }, runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('nav a'), summary: 's', hint: 'h', occurrenceOutcome: 'pass' }, { __node: ctx.document.querySelector('img'), summary: 's', hint: 'h' }] }; } };
  for (const eo of [{ profile: ['wcag22-aa', 'sample-1.0', 'nope-1'], packs: [sample], excludeSelectors: ['nav'], customRules: [rule], perfStats: true, timestamp: 'x' }, { profile: 'en301549-v3.2.1', customRules: [{ id: 'bad' }], packs: [{ name: 'zz', version: '1.0.0', namespace: 'zz', core: '>=9' }] }, { profile: 'wcag22-aaa', margin: true }]) {
    const r = await runa11yCoreOnHtml(require('./page.js'), { engineOptions: eo, runOnly: eo.profile === 'wcag22-aaa' ? { bestPractices: true } : undefined });
    Object.keys(r).forEach(k => seen.ScanResult.add(k));
    Object.keys(r.engine).forEach(k => seen.EngineInfo.add(k));
    for (const c of r.checksResults) { if ('summaryKey' in c) console.log('HAS summaryKey', c.ruleId, c.outcome, JSON.stringify(eo.profile), c.summaryKey, c.i18nKey); Object.keys(c).forEach(k => seen.CheckResult.add(k)); for (const o of c.occurrences) Object.keys(o).forEach(k => seen.Occurrence.add(k)); }
    for (const c of r.rulesResults) Object.keys(c).forEach(k => seen.CompositeResult.add(k));
    await new Promise(s => setImmediate(s));
  }
  for (const n of Object.keys(seen)) { const f = fields(n); const undeclared = [...seen[n]].filter(k => !f.out.has(k)); console.log(n, 'index sig', f.idx, 'undeclared:', undeclared); }
})();
