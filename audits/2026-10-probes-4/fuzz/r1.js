const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');
const html=process.argv[2];
const dom=createDom(html);
const r=runa11yCoreOnDom(dom,{entryPointParity:false});
for(const c of r.checksResults) for(const o of c.occurrences){ if(!o.selector)continue; let el; try{el=dom.window.document.querySelector(o.selector)}catch(e){el='THROW '+e.message}
 console.log(c.ruleId,c.outcome,JSON.stringify(o.selector),o.html&&o.html.slice(0,60),'=>',el&&el.outerHTML?el.outerHTML.slice(0,60):el)}
