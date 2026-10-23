const { scan, cr, core } = require('./h');
const F = "(ctx)=>({outcome:'fail',occurrences:[{__node: document.querySelector('img')}]})";
const html='<html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="x"></main></body></html>';
let o = scan(html, {});
let comp = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content');
console.log(Object.keys(comp)); console.log(JSON.stringify(comp).slice(0,1500));
