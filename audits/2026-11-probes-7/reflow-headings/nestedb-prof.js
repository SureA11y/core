const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
(async()=>{ const n=2000; const html = '<!doctype html><html><body><p>' + '<b>'.repeat(n) + 'Title' + '</b>'.repeat(n) + `</p><p>Lorem ipsum dolor sit amet.</p></body></html>`;
 const r = await runa11yCoreOnHtml(html, { rules: { include: 'p-as-heading' }, entryPointParity:false }); })();
