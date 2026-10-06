const {page,close}=require('../../visual/h.js');
const {JSDOM}=require('/home/user/core/node_modules/jsdom');
(async()=>{
 const h=`<div id=d style="background:rgba(10,20,30,.13)"><p id=p style="color:rgba(80,90,100,.77)">a text</p></div>`;
 const p=await page(h);
 console.log('C',await p.evaluate(()=>[getComputedStyle(d).backgroundColor,getComputedStyle(document.getElementById('p')).color]));
 await p.close();
 const dom=new JSDOM('<body>'+h);
 const w=dom.window; console.log('J',[w.getComputedStyle(w.document.getElementById('d')).backgroundColor,w.getComputedStyle(w.document.getElementById('p')).color]);
 await close();
})();
