const H = require('./h.js');
const w = H.loadPack('pack-wai-aria'), e = H.loadPack('pack-en301549');
const body = '<div role="button">x</div>'.repeat(4) + '<div role="checkbox">c</div>'.repeat(3) + '<span aria-pressed="maybe" role="button">b</span><img src="a.png"><img src="b.png"><img src="c.png"><div role="listbox"><div>x</div></div><input type="text">';
const html = H.page(body);
for (const [name, eo] of [['waiOnly', { packs: [w], profile: 'wai-aria-1.2' }], ['waiOnlyCap', { packs: [w], profile: 'wai-aria-1.2', output: { maxOccurrencesPerRule: 1 } }], ['wai+wcag', { packs: [w], profile: ['wai-aria-1.2', 'wcag22-aa'] }], ['two packs', { packs: [w, e], profile: ['en301549-v3.2.1', 'wai-aria-1.2'] }]]) {
  const { r, logs, err } = H.scan(html, eo);
  if (err) { console.log(name, 'ERR', err.message.slice(0, 300), logs); continue; }
  console.log('==', name, 'packs', JSON.stringify(r.engine.packs), 'skipped', JSON.stringify(r.engine.skippedPacks || r.skippedPacks), logs.slice(0, 3));
  const fails = r.checksResults.filter(c => c.outcome === 'fail').map(c => c.ruleId + ':' + c.occurrences.length + (c.occurrencesOmitted ? '+' + c.occurrencesOmitted : ''));
  console.log(' fail checks', fails.join(' '));
  const s = JSON.parse(H.sarif.renderSarifReport(r)); const run = s.runs[0];
  console.log(' sarif ext', JSON.stringify((run.tool.extensions || []).map(x => [x.name, x.version, x.semanticVersion])), 'props.packs', JSON.stringify(run.properties && run.properties.packs), 'levels', JSON.stringify(run.results.reduce((m, x) => (m[x.level] = (m[x.level] || 0) + 1, m), {})));
  const j = H.junit.renderJunitReport(r); console.log(' junit', (j.match(/<testsuites[^>]*>/) || [])[0], (j.match(/<property name="packs"[^>]*>/) || [])[0]);
  const ea = H.earl.renderEarlReport(r); const es = JSON.stringify(ea); console.log(' earl hasPart', (es.match(/"dct:hasPart":[^\]]*\]/) || es.match(/hasPart[^}]{0,200}/) || [])[0]);
  const hr = H.report.renderHtmlReport(r); console.log(' html packs', (hr.match(/<div><b>[^<]*<\/b>[^<]*[Pp]ack[^<]*<\/div>/) || [])[0]);
  const be = H.baseline.buildBaselineEntries(r); const mb = H.baseline.matchBaseline(r, be); console.log(' baseline entries', (Array.isArray(be) ? be : be.entries || []).length, 'new', mb.newCount, 'totalFail', mb.totalFail, JSON.stringify(mb.incomplete || null).slice(0, 200));
}
