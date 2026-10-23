const { run } = require('./h');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a.png" class="x"><button></button></main></body></html>';
const r = run(html, null, { rules: {}, customRules: [{ id:'constructor', runInPage(ctx){ return {outcome:'pass', occurrences:[], data:{cfg: typeof ctx.config, isObjFn: ctx.config===Object}} } }] }, ['constructor']);
console.log(JSON.stringify(r.checksResults[0].data));
// rule-scoped excludeSelectors on prototype-key; built-in rule ids never collide. Try rules: { 'img-alt-present': { excludeSelectors: '.x' } }
const r2 = run(html, null, { rules: { 'img-alt-present': { excludeSelectors: '.x' } } }, ['img-alt-present']);
console.log(r2.checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length));
const r3 = run(html, null, { rules: { 'img-alt-present': { excludeSelectors: ['.x['] } } }, ['img-alt-present']);
console.log(r3.checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length+':'+c.error));
const r4 = run(html, null, { excludeSelectors: ['.x['] }, ['img-alt-present']);
console.log(r4.checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length+':'+c.error));
const r5 = run(html, null, { excludeSelectors: 'img[alt=","], .x' }, ['img-alt-present']);
console.log('comma in attr', r5.checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length+':'+c.error));
const r6 = run(html, null, { excludeSelectors: ':is(.x, .y)' }, ['img-alt-present']);
console.log(':is comma', r6.checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.length+':'+c.error));
