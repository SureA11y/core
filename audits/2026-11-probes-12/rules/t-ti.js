const {jsdomRun,chromeRun}=require('./h.js');
(async()=>{const c={full:true,rules:['tabindex'],html:`<!doctype html><html lang=en><body><button tabindex="1${'x'.repeat(200000)}">a</button><a href=#>b</a></body></html>`};
for(const [n,f] of [['J',jsdomRun],['C',chromeRun]]){const r=await f('now',c);const o=JSON.parse(r.tabindex.replace(/^\S+ /,''))[0];console.log(n,'summary len',o.summary.length,'params.value len',o.i18n.params.value.length,'html len',o.html.length, 'total', r.tabindex.length);}
process.exit(0)})();
