const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderHtmlReport } = require('@surea11y/core/report');
const { renderJunitReport } = require('@surea11y/core/junit');
const { renderSarifReport } = require('@surea11y/core/sarif');
const fs = require('fs');
const html = `<html><head><title>Home</title></head><body><img src="x.png"><a href="#">click here</a><button></button>
<h1>Title</h1><h3>Skip</h3><div role="button" onclick="x()">Go</div><input type="text"><table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>
<p style="color:#777;background:#fff">low</p><div id="d"></div><div id="d"></div></body></html>`;
const locale = process.argv[2] || 'de';
const r = runa11yCoreOnHtml(html, { engineOptions: { locale, timestamp: '2026-01-01T00:00:00Z', mappings:['en301549'] }, entryPointParity:false });
const out = renderHtmlReport(r);
fs.writeFileSync('out-p11-'+locale+'.html', out);
// strip scripts/styles and tags
let text = out.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,'\n');
const lines = [...new Set(text.split('\n').map(s=>s.replace(/&[a-z#0-9]+;/g,' ').trim()).filter(Boolean))];
const enWords = /\b(the|and|this|of|with|rule|rules|checks?|not|page|review|failed|passed|cannot|needs?|found|Partly|selected|scan|none|show|hide|more|details|occurrences?|leans?)\b/i;
const sus = lines.filter(l=>enWords.test(l) && !/^[\w.-]+$/.test(l));
console.log(sus.length+' suspicious of '+lines.length); console.log(sus.slice(0,80).map(s=>s.slice(0,160)).join('\n'));
