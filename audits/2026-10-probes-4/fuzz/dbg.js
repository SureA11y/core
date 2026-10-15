const {gen}=require('./gen.js');const {scan}=require('./check.js');
const seed=+process.argv[2], rule=process.argv[3];
const c=gen(seed); c.engineOptions={locale:process.argv[4]||'en'};
const a=scan(c,{});
const doc=a.dom.window.document;
const cr=a.result.checksResults.find(x=>x.ruleId===rule);
console.log(cr.outcome, cr.error);
for(const o of cr.occurrences){console.log(JSON.stringify({sel:o.selector,hosts:o.shadowHostSelectors,sp:o.structuralPath,html:(o.html||'').slice(0,150),sum:o.summary}));}
console.log([...doc.querySelectorAll('[id]')].filter(e=>e.id.includes('\\')).map(e=>e.outerHTML.slice(0,100)+' | parent '+e.parentNode.nodeName));
for(const o of cr.occurrences){ console.log('qs:', doc.querySelector(o.selector)&&doc.querySelector(o.selector).outerHTML.slice(0,80), doc.querySelectorAll(o.selector).length, doc.getElementById('a\\b')&&'byId-ok');}
