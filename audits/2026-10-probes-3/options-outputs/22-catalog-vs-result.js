'use strict';
// getChecksCatalog(engineOptions) / getRulesCatalog against the meta a scan
// with the same options reports: titles, tags, mappings, helpUrl, severity.
const h = require('./h.js');
const { main } = h.load();
const pack = require(h.ROOT + '/tests/fixtures/packs/sample.js');
const custom = { id: 'org-c', meta: { title: 'Org C', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'], helpUrl: 'https://example.org/c' }, runInPage: "() => ({ outcome: 'pass', occurrences: [] })" };
const sets = {
  plain: {}, ja: { locale: 'ja' }, profile: { profile: 'en301549-v3.2.1' }, mappings: { mappings: 'en301549' }, custom: { customRules: [custom] },
  'messages de': { locale: 'de', messages: { de: { img_altPresent_title: 'EIGEN' } } }, pack: { packs: [pack], profile: 'sample-1.0' }, wcag20: { wcagVersion: '2.0' }
};
const PAGE = h.fixture('img-alt-present-all-scenarios.html');
for (const [name, eo] of Object.entries(sets)) {
  h.setDom(PAGE);
  const r = main.runDomRulesInPage('https://e.test/', null, eo, null);
  const cat = new Map(main.getChecksCatalog(eo).map((c) => [c.ruleId, c]));
  const rcat = new Map(main.getRulesCatalog(eo).map((c) => [c.id, c]));
  const diffs = new Map();
  const note = (k, ex) => { if (!diffs.has(k)) diffs.set(k, { n: 0, ex }); diffs.get(k).n++; };
  for (const c of r.checksResults) {
    const d = cat.get(c.ruleId);
    if (!d) { note('in result, not in catalog', c.ruleId); continue; }
    if (d.title !== c.title) note('title', `${c.ruleId}: catalog ${JSON.stringify(d.title.slice(0, 40))} result ${JSON.stringify(c.title.slice(0, 40))}`);
    if (JSON.stringify(d.normativeMappings) !== JSON.stringify(c.meta.normativeMappings)) note('normativeMappings', `${c.ruleId}: catalog ${d.normativeMappings.length} result ${c.meta.normativeMappings.length}`);
    if (JSON.stringify([...d.tags].sort()) !== JSON.stringify([...c.meta.tags].sort())) note('tags', `${c.ruleId}: catalog-only ${d.tags.filter((t) => !c.meta.tags.includes(t))} result-only ${c.meta.tags.filter((t) => !d.tags.includes(t))}`);
    if ((d.helpUrl || '') !== (c.meta.helpUrl || '')) note('helpUrl', `${c.ruleId}: catalog ${JSON.stringify(d.helpUrl)} result ${JSON.stringify(c.meta.helpUrl)}`);
    if (!c.ruleSeverity && d.defaultSeverity !== c.severity && c.outcome !== 'pass' && c.outcome !== 'notApplicable') note('severity', `${c.ruleId}: catalog ${d.defaultSeverity} result ${c.severity}`);
  }
  for (const c of r.rulesResults) {
    const d = rcat.get(c.ruleId);
    if (!d) { note('rollup in result, not in rules catalog', c.ruleId); continue; }
    if (JSON.stringify([...d.checksIds].sort()) !== JSON.stringify([...c.data.details.checksIds].sort())) note('rollup checksIds', `${c.ruleId}: catalog ${d.checksIds.length} result ${c.data.details.checksIds.length}`);
  }
  console.log(`## ${name}: ${diffs.size ? '' : 'agree'}`);
  for (const [k, v] of diffs) console.log(`   ${k}: ${v.n}x e.g. ${v.ex}`);
}
process.exit(0);
