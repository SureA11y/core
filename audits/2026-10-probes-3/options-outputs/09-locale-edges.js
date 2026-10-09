'use strict';
// Locale codes at the edges: case, region, POSIX form, whitespace, empty,
// prototype names, extension subtags, and the HTML report's language.
const h = require('./h.js');
const { main, sub } = h.load();
const report = sub('report');
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const codes = ['EN', 'en-US', 'es-MX', 'ES-mx', 'pt-BR', 'de_DE', 'de_DE.UTF-8', ' fr ', '', '  ', 'ja-JP-u-ca-japanese', 'zh-Hant-TW', 'x-klingon', '__proto__', 'constructor', 'toString', 'en-', '-', 'de-', 'i-klingon', 'fr-CA', 'jA', 'ja_JP'];
for (const code of codes) {
  const r = h.scan(PAGE, { engineOptions: { locale: code }, runOnly: ['img-alt-present'] });
  if (r.error) { console.log(JSON.stringify(code), 'THROWS', r.error.message); continue; }
  const c = r.value.checksResults[0];
  const html = report.renderHtmlReport(r.value);
  const lang = (html.match(/<html lang="([^"]*)"/) || [])[1];
  const chip = (html.match(/class="chip[^"]*"[^>]*>[^<]*(requested|angefordert|demandé|solicitad|要求)[^<]*</) || [''])[0].slice(0, 120);
  console.log(JSON.stringify(code).padEnd(24), JSON.stringify(r.value.engine.locale).padEnd(75), 'title:', c.title.slice(0, 30).padEnd(32), 'report lang:', lang, r.logs.length ? 'logs:' + r.logs.join('|').slice(0, 80) : '');
}
process.exit(0);
