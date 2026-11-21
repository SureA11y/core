const { r } = require('./tb-multiprofile.js');
const { renderHtmlReport } = require('/home/user/core-r10/src/report.js');
const { renderEarlReport } = require('/home/user/core-r10/src/earl.js');
const t = renderHtmlReport(r).replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
console.log((t.match(/.{0,40}rules not run.{0,10}/)||[])[0]); console.log((t.match(/Incomplete scan.{0,250}/)||[])[0]);
const e = renderEarlReport(r); const s = JSON.stringify(e); console.log('EARL mentions target-size (2.2-only rule)?', /target-size-minimum/.test(s), 'untested:', (s.match(/untested/g)||[]).length);
