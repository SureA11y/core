const { launch, BUNDLE } = require('./harness');
const big='x'.repeat(1000000);
const cases=[
 ['aria-valid-attr-value', `<div aria-live="${big}">x</div>`],
 ['form-control-label-quality', `<label>${big} <input type=checkbox></label><label>${big} <input type=checkbox></label>`],
 ['identical-links-same-purpose', `<a href="/${big}">Read more</a><a href=/b>Read more</a>`],
 ['img-alt-quality', `<img src=a.png alt="${big}.png">`],
];
(async()=>{ const b=await launch(); for (const [rule,h] of cases){ const p=await b.newPage(); await p.setContent(`<!doctype html><html lang=en><head><title>t</title></head><body><main>${h}</main></body></html>`); await p.addScriptTag({content:BUNDLE});
 const r=await p.evaluate(async(rule)=>{const t0=performance.now(); const res=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:[rule]}},null); const c=res.checksResults[0]; return {ms:performance.now()-t0, outcome:c.outcome, sum:(c.occurrences[0]||{}).summary?.length, json:JSON.stringify(res).length};},rule); console.log(rule, JSON.stringify(r)); await p.close(); } await b.close(); })();
