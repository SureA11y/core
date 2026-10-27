const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const dom=createDom('<!doctype html><html lang=en><head><title>t</title></head><body><main><my-btn></my-btn></main></body></html>');
const sr=dom.window.document.querySelector('my-btn').attachShadow({mode:'open'});
sr.innerHTML=process.argv[2];
const r=runa11yCoreOnDom(dom,{entryPointParity:false});
for(const c of r.checksResults)for(const o of c.occurrences){if(!o.shadowHostSelectors)continue;let root=dom.window.document;for(const h of o.shadowHostSelectors)root=root.querySelector(h).shadowRoot;const el=root.querySelector(o.selector);
console.log(c.ruleId,JSON.stringify(o.selector),o.html.slice(0,50),'=>',el&&el.outerHTML.slice(0,50));}
