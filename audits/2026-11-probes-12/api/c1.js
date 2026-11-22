const H = require('./h.js');
const html = H.page('<img src="a.png">'.repeat(3) + '<img src="b.png">'.repeat(0));
const t = (h) => h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
for (const cap of [1, 2]) for (const locale of ['en', 'de', 'es', 'fr', 'ja', 'de-AT', 'pt']) {
  const { r } = H.scan(html, { locale, output: { maxOccurrencesPerRule: cap } }, ['img-alt-present']);
  const hr = t(H.report.renderHtmlReport(r, { locale }));
  console.log(cap, locale, r.engine.locale && r.engine.locale.resolved, '|', (hr.match(/(\+\d+|ほかに)[^)]*\)[^.。]*[.。]/g) || []).join(' || ').slice(0, 300));
}
const { r } = H.scan(html, { output: { maxOccurrencesPerRule: 2 } }, ['img-alt-present']);
const j = H.junit.renderJunitReport(r); console.log((j.match(/<failure[^>]*>[^<]*/g) || []).join('\n').slice(0, 800));
const s = JSON.parse(H.sarif.renderSarifReport(r)); console.log(JSON.stringify(s.runs[0].invocations[0].toolExecutionNotifications || s.runs[0].results.filter(x => x.kind === 'informational' || x.level === 'note').map(x => x.message.text)).slice(0, 400));
