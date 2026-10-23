const { scan, cr } = require('./h');
const F = "(ctx)=>({outcome:'fail',occurrences:[{__node: document.querySelector('img')}]})";
const html='<html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="x"></main></body></html>';
const meta13 = { title: 'Z', tags: ['wcag2a','wcag111'], wcagSc: ['1.1.1'], normativeMappings: [{ standard: 'WCAG', requirement: '1.1.1', conformanceLevel: 'A', version: '2.2' }] };
const show = (label, o, id) => { const comp = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content'); const c = cr(o.res,id); console.log(label, 'rule', c&&c.outcome, 'rule.rollupIds', JSON.stringify(c&&c.rollupIds), '| comp', comp.outcome, comp.data.details.reasonCode, 'has id', comp.data.details.checksIds.includes(id)); };
show('custom mapped', scan(html, { customRules: [{ id: 'zz', meta: meta13, runInPage: F }] }), 'zz');
show('override no mapping', scan(html, { customRules: [{ id: 'img-alt-present', meta: {title:'o'}, runInPage: F }] }), 'img-alt-present');
// C-14 profile: find profiles
const prof = require('/home/user/core/package.json'); 
