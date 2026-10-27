// classify selectorWrongElement occurrences by cause
const {gen}=require('./gen.js');const {scan}=require('./check.js');console.warn=()=>{};
const seeds=process.argv.slice(2).map(Number);
for(const seed of seeds){const c=gen(seed);c.engineOptions={};const a=scan(c,{});const doc=a.dom.window.document;
for(const cr of a.result.checksResults)for(const o of cr.occurrences){if(!o.selector||!o.structuralPath)continue;let t=doc.documentElement;for(const i of o.structuralPath)t=t&&t.children[i];const el=doc.querySelector(o.selector);if(el===t)continue;
 const chain=[];let n=t;while(n){chain.push(n.nodeName+(n.hasAttribute&&n.hasAttribute('id')?'#'+JSON.stringify(n.getAttribute('id')).slice(0,20):''));n=n.parentElement}
 console.log(seed,cr.ruleId,JSON.stringify(o.selector).slice(0,80),'|',chain.reverse().join('>').slice(0,300));}}
