const core = require('/home/user/core/src/index.js');
const checks = core.getChecksCatalog();
console.log('checks', checks.length);
const tags = new Map();
for (const c of checks) for (const t of c.tags) tags.set(t, (tags.get(t)||0)+1);
console.log([...tags.keys()].filter(t=>!/^wcag\d/.test(t)).join(' '));
console.log('rollups', core.getRulesCatalog().length, core.getRulesCatalog({optInRules:'all'}).length);
console.log(Object.keys(core).join(' '));
console.log(core.getRulesCatalog({optInRules:'all'}).filter(r=>r.meta&&r.meta.standard).slice(0,3).map(r=>JSON.stringify({id:r.id,meta:r.meta,tags:r.tags})));
