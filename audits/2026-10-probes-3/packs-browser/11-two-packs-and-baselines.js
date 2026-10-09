'use strict';
// Two packs at once (standards blocks, id and name collisions) and the
// stability of baseline keys and SARIF fingerprints across pack versions and
// rule order. Chromium with packScript.
const path = require('path');
const L = require('./lib');
const { packScript } = L.packApi;
const { renderHtmlReport } = require(path.join(L.ROOT, 'src/report.js'));
const { renderSarifReport } = require(path.join(L.ROOT, 'src/sarif.js'));
const { renderJunitReport } = require(path.join(L.ROOT, 'src/junit.js'));
const { buildBaselineEntries, matchBaseline } = require(path.join(L.ROOT, 'src/baseline.js'));

const failRule = (id, reason = 'R') => ({ id, meta: { title: id, tags: [] }, runInPage: new Function(`return (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('img') || ctx.document.body, data: { details: { reasonCode: ${JSON.stringify(reason)} } } }] })`)() });
const checklist = (name, ns, title, version = '1.0.0', rules = [failRule(ns + '-a')]) => L.packApi.definePack({
  name, version, namespace: ns, core: '*', title,
  rules: rules.map((r) => ({ ...r, meta: { ...r.meta, tags: [ns] } })),
  profiles: { [ns + '-p']: { tags: [], rules: rules.map((r) => r.id) } },
  rollups: [{ id: ns + '-item', title: ns + ' item', checksIds: rules.map((r) => r.id) }]
});
const HTML = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

async function scan(b, packs, eo, runOnly) {
  const { page, context } = await L.openPage(b, { html: HTML });
  await page.addScriptTag({ content: L.BUNDLE });
  let script;
  try { script = packScript(packs); } catch (e) { await context.close(); return { packScriptError: e.message.slice(0, 220) }; }
  await page.addScriptTag({ content: script });
  const r = await L.scanInPage(page, packs.map((p) => `${p.name}@${p.version}`), eo, runOnly).catch((e) => ({ error: e.message.split('\n')[0] }));
  await context.close();
  return r;
}

(async () => {
  await L.withBrowser(async (b) => {
    // a) two checklists with the same title (standard name), different namespaces
    const A = checklist('@a/policy', 'aa', 'Policy');
    const B = checklist('@b/policy', 'bb', 'Policy');
    const r = await scan(b, [A, B], { optInRules: ['aa', 'bb'] });
    if (r.packScriptError || r.error) L.log('a) same title', r);
    else {
      const html = renderHtmlReport(r);
      const sections = [...html.matchAll(/<h2>([^<]*)<\/h2>\s*(?:<p class="note">[^<]*<\/p>\s*)?<table class="wcag-table">([\s\S]*?)<\/table>/g)].map((m) => ({ h2: m[1], rows: [...m[2].matchAll(/<td class="sc-cell">([^<]*)</g)].map((x) => x[1]) }));
      L.log('a) two checklists titled "Policy"', { standards: r.standards, rollups: r.rulesResults.filter((x) => x.meta && x.meta.standard).map((x) => `${x.ruleId}:${x.outcome}:${x.meta.standard}`), htmlSections: sections });
    }
    // b) same namespace in two packs
    L.log('b) two packs, one namespace, different rule ids', await scan(b, [checklist('@a/x', 'same', 'One', '1.0.0', [failRule('same-a')]), L.packApi.definePack({ name: '@b/x', version: '1.0.0', namespace: 'same', core: '*', rules: [failRule('same-b')] })], {}).then((r) => r.packScriptError || r.error || { packs: r.engine.packs, ids: r.checksResults.filter((c) => c.ruleId.startsWith('same-')).map((c) => c.ruleId) }));
    L.log('c) two packs, one rule id', await scan(b, [L.packApi.definePack({ name: '@a/y', version: '1.0.0', namespace: 'yy', core: '*', rules: [failRule('yy-a')] }), L.packApi.definePack({ name: '@b/y', version: '1.0.0', namespace: 'yy', core: '*', rules: [failRule('yy-a')] })], {}).then((r) => r.packScriptError || r.error || { packs: r.engine.packs }));
    // d) one pack's rollup id is another pack's rule id
    L.log('d) rollup id equals another pack\'s rule id', await scan(b, [checklist('@a/z', 'zz', 'Z'), L.packApi.definePack({ name: '@b/z', version: '1.0.0', namespace: 'zz', core: '*', rules: [failRule('zz-item')] })], { profile: 'zz-p' }).then((r) => r.packScriptError || r.error || { ids: r.checksResults.filter((c) => /^zz/.test(c.ruleId)).map((c) => c.ruleId), rollups: r.rulesResults.filter((c) => /^zz/.test(c.ruleId)).map((c) => c.ruleId) }));

    L.log('d2) same, optInRules zz (rollup and rule both run)', await scan(b, [checklist('@a/z', 'zz', 'Z'), L.packApi.definePack({ name: '@b/z', version: '1.0.0', namespace: 'zz', core: '*', rules: [failRule('zz-item')] })], { optInRules: ['zz'] }).then((r) => {
      if (r.packScriptError || r.error) return r.packScriptError || r.error;
      const sarif = JSON.parse(renderSarifReport(r));
      return { ids: r.checksResults.filter((c) => /^zz/.test(c.ruleId)).map((c) => c.ruleId), rollups: r.rulesResults.filter((c) => /^zz/.test(c.ruleId)).map((c) => c.ruleId + ':' + JSON.stringify(c.data.details.checksIds)), sarifRules: sarif.runs[0].tool.driver.rules.filter((x) => /^zz/.test(x.id)).map((x) => x.id) };
    }));
    // e) baselines and SARIF fingerprints across versions and rule order
    const v1 = checklist('@c/policy', 'cc', 'C', '1.0.0', [failRule('cc-a', 'RA'), failRule('cc-b', 'RB')]);
    const v2 = checklist('@c/policy', 'cc', 'C', '2.0.0', [failRule('cc-b', 'RB'), failRule('cc-a', 'RA')]);
    const r1 = await scan(b, [v1], { profile: 'cc-p' });
    const r2 = await scan(b, [v2], { profile: 'cc-p' });
    const fp = (r) => JSON.parse(renderSarifReport(r)).runs[0].results.filter((x) => /^cc-/.test(x.ruleId)).map((x) => `${x.ruleId}:${JSON.stringify(x.partialFingerprints || x.fingerprints)}`).sort();
    const m = matchBaseline(r2, buildBaselineEntries(r1));
    L.log('e) pack 1.0.0 -> 2.0.0 with rules reordered', { sameFingerprints: JSON.stringify(fp(r1)) === JSON.stringify(fp(r2)), fp1: fp(r1), baselineNew: m.newOccurrences ? m.newOccurrences.length : m, known: m.knownCount, stale: m.staleCount });
    // f) reasonCode an object or 0; ids holding the key separator
    const odd = L.packApi.definePack({ name: '@d/p', version: '1.0.0', namespace: 'dd', core: '*', rules: [
      { id: 'dd-o1', meta: { title: 'o1', tags: [] }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, data: { details: { reasonCode: { a: 1 } } } }] }) },
      { id: 'dd-o2', meta: { title: 'o2', tags: [] }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, data: { details: { reasonCode: 0 } } }] }) },
      { id: 'dd-k\u0000R', meta: { title: 'k1', tags: [] }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }) }
    ] });
    const ro = await scan(b, [odd], {});
    const entries = buildBaselineEntries(ro).filter((e) => /^dd-/.test(e.ruleId));
    // A baseline entry for another rule whose key collides with dd-k\0R + DEFAULT
    const forged = [{ ruleId: 'dd-k', reasonCode: 'R\u0000DEFAULT', html: entries.find((e) => e.ruleId.startsWith('dd-k')).html }];
    const mm = matchBaseline(ro, forged);
    L.log('f) odd reason codes and ids', { entries: entries.map((e) => `${JSON.stringify(e.ruleId)} reason=${JSON.stringify(e.reasonCode)}`), forgedEntryMatches: mm.knownCount, junitWellFormed: (() => { const x = renderJunitReport(ro); const d = new (new L.JSDOM('').window.DOMParser)().parseFromString(x, 'application/xml'); return d.getElementsByTagName('parsererror').length ? 'NOT well-formed: ' + d.getElementsByTagName('parsererror')[0].textContent.slice(0, 120) : 'well-formed'; })() });
  });
})();
