const {run,rep}=require('./nh.js');const {close}=require('./h.js');
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>x</title></head><body style="background:#fff"><main><h1>x</h1>
 <label>Fruit <select id=s1><button id=b1><selectedcontent></selectedcontent></button><option>Apple</option><option>Pear</option></select></label>
 </main></body></html>`;
 const r=await run(html,{s1:'document.querySelector("#s1")',b1:'document.querySelector("#b1")'},{ignore:['manual-review','page-title-patterns','contrast-computable','target-size-minimum']});
 console.log(rep('plain select with button child (no base-select CSS)',r));
 const {getBrowser}=require('./h.js');const b=await getBrowser();const p=await b.newPage();await p.setContent(html);
 console.log(await p.evaluate(()=>{const b=document.querySelector('#b1');return {parent:b.parentElement.id,inertProp:b.inert,matchesInert:b.matches(':is([inert] *)'),tabIndex:b.tabIndex,ce:CSS.supports('appearance','base-select')}}));
 await close();})();
