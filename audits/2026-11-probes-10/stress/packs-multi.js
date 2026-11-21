const { definePack } = require('/home/user/core-r10/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r10/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r10/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r10/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r10/src/report.js');
const a = definePack({ name: '@city/web-policy', title: 'City web policy', version: '2026.1.0-rc.1+build.7', namespace: 'city', core: '^1.11.0',
  profiles: { 'city-quick': { tags: [], rules: ['img-alt-present', 'page-title-present'] } }, rollups: [{ id: 'city-images', title: 'Images', checksIds: ['img-alt-present'] }] });
const b = definePack({ name: 'zeta-policy', title: 'Zeta policy', version: '1.0.0', namespace: 'zeta', core: '^1.11.0',
  profiles: { 'zeta-quick': { tags: [], rules: ['link-name-present'] } }, rollups: [{ id: 'zeta-links', title: 'Links', checksIds: ['link-name-present'] }] });
const html = '<!doctype html><html lang="en"><head><title>p</title></head><body><main><h1>h</h1><img src=a><a href=/x></a></main></body></html>';
const W = console.warn; const warns = []; console.warn = (...x) => warns.push(x.join(' ').slice(0,200));
const r1 = runa11yCoreOnHtml(html, { engineOptions: { packs: [b, a], profile: ['zeta-quick', 'city-quick'] } });
const r2 = runa11yCoreOnHtml(html, { engineOptions: { packs: [b, a], profile: 'city-quick' } });
console.warn = W; console.log('warns', warns);
for (const [n, r] of [['multi', r1], ['single', r2]]) {
  console.log(n, 'engine.packs', JSON.stringify(r.engine.packs), 'profiles', JSON.stringify(r.engine.profiles||r.engine.profile));
  const s = JSON.parse(renderSarifReport(r)); console.log('  sarif ext', JSON.stringify(s.runs[0].tool.extensions.map(e=>[e.name,e.version])));
  const j = renderJunitReport(r); console.log('  junit', (j.match(/<property name="packs"[^>]*>/)||[])[0]);
  const e = renderEarlReport(r); console.log('  earl', JSON.stringify(JSON.stringify(e).match(/hasPart.{0,300}/)?.[0]||'none').slice(0,300));
  const h = renderHtmlReport(r); console.log('  html', (h.match(/<div><b>[^<]*<\/b>packs<\/div>/)||[])[0]);
}
