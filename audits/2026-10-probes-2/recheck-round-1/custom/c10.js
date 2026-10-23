const { scan, cr, core } = require('./h');
const P = "(ctx)=>({outcome:'pass',occurrences:[]})", F = "(ctx)=>({outcome:'fail',occurrences:[{__node: document.querySelector('img')}]})";
let o = scan(null, { customRules: [{ id: 'z', meta: {title:'A'}, runInPage: P }, { id: 'z', meta: {title:'B'}, runInPage: F }] }, ['z']);
console.log('C-10 dup', cr(o.res,'z').title, cr(o.res,'z').outcome, JSON.stringify(o.res.skippedCustomRules));
o = scan(null, { customRules: [{ id: 'wcag-1.1.1-non-text-content', meta: {}, runInPage: P }] });
console.log('C-11 comp', o.res.checksResults.filter(r=>r.ruleId==='wcag-1.1.1-non-text-content').length, o.res.rulesResults.filter(r=>r.ruleId==='wcag-1.1.1-non-text-content').length, JSON.stringify(o.res.skippedCustomRules), JSON.stringify(o.res.overriddenBuiltinIds));
// C-13: custom rule mapped to 1.1.1 that fails
const meta13 = { title: 'Z', tags: ['wcag2a','wcag111'], wcagSc: ['1.1.1'], normativeMappings: [{ standard: 'WCAG', requirement: '1.1.1', conformanceLevel: 'A', version: '2.2' }] };
o = scan('<html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="x"></main></body></html>', { customRules: [{ id: 'zz', meta: meta13, runInPage: F }] });
let comp = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content'); const z = cr(o.res,'zz');
console.log('C-13 custom mapped', z && z.outcome, 'skipped', JSON.stringify(o.res.skippedCustomRules), 'comp', comp.outcome, JSON.stringify(comp.rollupIds), 'zz rollupIds', JSON.stringify(z && z.rollupIds));
// baseline without custom
o = scan('<html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="x"></main></body></html>', {});
comp = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content'); console.log('  baseline comp', comp.outcome, JSON.stringify(comp.rollupIds));
// override img-alt-present with no mapping
o = scan('<html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="x"></main></body></html>', { customRules: [{ id: 'img-alt-present', meta: {title:'override'}, runInPage: F }] });
comp = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content');
console.log('C-13 override no mapping', comp.outcome, JSON.stringify(comp.rollupIds), 'meta.normativeMappings', JSON.stringify(cr(o.res,'img-alt-present').meta.normativeMappings));
