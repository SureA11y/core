const {gen}=require('./gen.js');const {scan}=require('./check.js');
const seed=+process.argv[2], rule=process.argv[3];
const c=gen(seed); c.engineOptions=JSON.parse(process.argv[4]||'{}');
const a=scan(c,{});
const doc=a.dom.window.document;
const cr=a.result.checksResults.find(x=>x.ruleId===rule);
console.log(cr.outcome, cr.error);
function pathOf(el){const p=[];let n=el;while(n&&n!==doc.documentElement){const par=n.parentElement;if(!par)return null;p.unshift([...par.children].indexOf(n));n=par;}return p.join(',')}
for(const o of cr.occurrences){ if(!o.selector||!o.structuralPath)continue; const el=doc.querySelector(o.selector); const got=el&&pathOf(el); if(got===o.structuralPath.join(','))continue;
 let t=doc.documentElement; for(const i of o.structuralPath) t=t&&t.children[i];
 console.log(JSON.stringify({sel:o.selector,sp:o.structuralPath.join(','),got,html:(o.html||'').slice(0,120)}));
 console.log('  target:', t&&t.outerHTML.slice(0,150), '\n  target chain:', (()=>{const a=[];let n=t;while(n){a.push(n.nodeName+(n.id?'#'+JSON.stringify(n.id):''));n=n.parentElement}return a.reverse().join('>')})());
 console.log('  same-id elements:', t&&t.id!=null? [...doc.querySelectorAll('[id]')].filter(e=>e.id===t.id).length:'');
}
