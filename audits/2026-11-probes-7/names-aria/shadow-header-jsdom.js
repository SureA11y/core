const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
(async()=>{
 const dom = createDom(`<!doctype html><html lang=en><head><title>T</title></head><body><header>Site</header><main><article><div id=h1></div><p>a</p></article><article><div id=h2></div><p>b</p></article></main><footer>(c)</footer></body></html>`);
 const d = dom.window.document;
 for (const id of ['h1','h2']) d.getElementById(id).attachShadow({mode:'open'}).innerHTML='<header><h2>Post</h2></header>';
 const r = await runa11yCoreOnDom(dom, { rules: { include: ['landmark-no-duplicate-banner','landmark-unique'] } });
 for (const c of r.checksResults) console.log(c.ruleId, c.outcome, (c.occurrences||[]).map(o=>JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k])=>!['summary','hint','i18n','data'].includes(k))))).join('\n   '));
})();
