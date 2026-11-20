const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
(async()=>{ for (const n of [500,1000,2000]) for (const rule of ['area-alt-present','p-as-heading']) {
  const html = '<!doctype html><html><body><p>' + '<b>'.repeat(n) + 'Title' + '</b>'.repeat(n) + `</p><p>${L}</p></body></html>`;
  const t=Date.now(); const r = await runa11yCoreOnHtml(html, { rules: { include: rule }, entryPointParity:false }); console.log(n, rule, Date.now()-t, 'ms', r.checksResults[0].outcome); await new Promise(r=>setImmediate(r)); } })();
