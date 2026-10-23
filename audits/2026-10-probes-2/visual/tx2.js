const {page,close}=require('./h');
(async()=>{
 const p=await page(`<div style="position:relative;width:400px"><div style="overflow:hidden;height:40px;width:200px;background:#eee"><span>Menu</span><div id=pop style="position:absolute;top:0;left:0;width:150px;background:#fff;border:1px solid #000;font-size:16px;line-height:1.2">This dropdown tooltip text wraps on lines</div></div></div>`);
 await p.addStyleTag({content:'* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }'});
 console.log(await p.evaluate(()=>{const r=pop.getBoundingClientRect(); const e=document.elementFromPoint(r.left+10,r.bottom-8); return JSON.stringify(r)+' hit:'+(e&&e.id)}));
 await p.screenshot({path:'tx2.png',clip:{x:0,y:0,width:300,height:150}});
 await close();
})();
