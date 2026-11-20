'use strict';
// node fuzz-chrome.js <mode gen|mut|fix> <from> <to>
// In Chromium: invariants, DOM-not-mutated, rescan determinism, locale placeholders; then jsdom vs Chromium per rule.
const fs = require('fs');
const path = require('path');
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const G = require('./gen.js');
const [mode, from, to] = [process.argv[2], +process.argv[3], +process.argv[4]];
const FIX = '/home/user/core/tests/fixtures';
const fixtures = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const outFile = `/tmp/surea11y-audit/r7/robust/out/chrome-${mode}-${from}-${to}.jsonl`;
fs.writeFileSync(outFile, '');
console.warn = () => {};
const log = (o) => fs.appendFileSync(outFile, JSON.stringify(o) + '\n');
function pageFor(i) {
  if (mode === 'gen') return { name: 'gen' + i, html: G.make(i, { budget: 40 + (i % 7) * 40, maxDepth: 4 + (i % 9) }) };
  const f = fixtures[i % fixtures.length];
  const html = fs.readFileSync(path.join(FIX, f), 'utf8');
  if (mode === 'fix') return { name: f, html };
  return { name: f + '#mut' + i, html: G.mutate(html, i * 7919 + 1) };
}
const SNAP = () => {
  const out = [];
  const stack = [document];
  while (stack.length) {
    const node = stack.pop();
    if (node.nodeType === 1) {
      let s = '<' + node.localName;
      for (const a of Array.from(node.attributes)) s += ' ' + a.name + '="' + a.value + '"';
      if (typeof node.value === 'string') s += ' [v=' + node.value + ']';
      out.push(s + '>');
      const kids = [];
      if (node.shadowRoot) kids.push(node.shadowRoot);
      if (node.localName === 'template' && node.content) kids.push(node.content);
      kids.push(...node.childNodes);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    } else if (node.nodeType === 3 || node.nodeType === 8) out.push(node.nodeType + ':' + node.data);
    else { out.push('#' + node.nodeType); const k = Array.from(node.childNodes); for (let i = k.length - 1; i >= 0; i--) stack.push(k[i]); }
  }
  let sheets = '';
  for (const sh of Array.from(document.styleSheets)) { try { sheets += Array.from(sh.cssRules).map((r) => r.cssText).join('\n'); } catch { sheets += '[x]'; } }
  return out.join('\n') + '\n--sheets ' + document.styleSheets.length + '\n' + sheets + '\n--adopted ' + document.adoptedStyleSheets.length + ' scroll ' + scrollX + ',' + scrollY + ' active ' + (document.activeElement && document.activeElement.localName) + ' sel ' + String(getSelection());
};
(async () => {
  const browser = await C.launch();
  let scans = 0;
  for (let i = from; i < to; i++) {
    const { name, html } = pageFor(i);
    const problems = [];
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    let rc;
    try {
      await page.setContent(html, { timeout: 15000, waitUntil: 'load' }).catch(() => {});
      await C.inject(page, ['de', 'es', 'fr', 'ja']);
      const s0 = await page.evaluate(SNAP);
      rc = await C.scan(page, {}); scans++;
      const s1 = await page.evaluate(SNAP);
      if (s0 !== s1) {
        const a = s0.split('\n'), b = s1.split('\n'); let k = 0; while (k < a.length && a[k] === b[k]) k++;
        problems.push(`chrome DOM mutated at ${k}: ${String(a[k]).slice(0, 160)} => ${String(b[k]).slice(0, 160)}`);
      }
      problems.push(...L.checkInvariants(rc, 'chrome-en'));
      const rc2 = await C.scan(page, {}); scans++;
      const pa = L.project(rc), pb = L.project(rc2);
      if (JSON.stringify(pa) !== JSON.stringify(pb)) problems.push('chrome rescan differs: ' + diff(pa, pb));
      for (const loc of ['de', 'ja']) {
        const rl = await C.scan(page, { locale: loc }); scans++;
        for (const p of L.checkInvariants(rl, 'chrome-' + loc)) if (!/error:/.test(p)) problems.push(p);
        const a = L.project(rc, { withText: false }), b = L.project(rl, { withText: false });
        if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`chrome locale ${loc} changes: ` + diff(a, b));
      }
    } catch (e) {
      problems.push('CHROME THROW ' + String(e && e.message).slice(0, 300));
    }
    let rj;
    try { rj = L.scanJsdom(html).r; } catch (e) { problems.push('JSDOM THROW ' + e.message); }
    const per = {};
    if (rc && rj) {
      const mj = new Map(L.project(rj, { withText: false }).map((c) => [c.ruleId, c]));
      for (const c of L.project(rc, { withText: false })) {
        const j = mj.get(c.ruleId);
        if (!j) continue;
        if (JSON.stringify(c) !== JSON.stringify(j)) per[c.ruleId] = `${j.outcome}/${j.occ.length} vs chrome ${c.outcome}/${c.occ.length} ` + firstOccDiff(j.occ, c.occ);
      }
    }
    log({ i, name, problems, jsdomVsChrome: per });
    await ctx.close();
    await new Promise((r) => setImmediate(r));
  }
  log({ done: true, scans });
  await browser.close();
})();
function diff(A, B) {
  const out = []; const mb = new Map(B.map((c) => [c.ruleId, c]));
  for (const a of A) { const b = mb.get(a.ruleId); if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${a.ruleId}: ${a.outcome}/${a.occ.length} vs ${b && b.outcome}/${b && b.occ.length} ` + firstOccDiff(a.occ, (b && b.occ) || [])); }
  return out.slice(0, 5).join('; ');
}
function firstOccDiff(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return `[${i}] ${String(JSON.stringify(a[i])).slice(0, 220)} | ${String(JSON.stringify(b[i])).slice(0, 220)}`;
  return '';
}
