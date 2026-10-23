const {page,close}=require('./h');
(async()=>{const p=await page(`<p id=a style="color:#888;font-size:12px;zoom:2">Zoomed text here</p><p id=n style="font-size:24px">Zoomed text here</p><svg viewBox="0 0 100 20" width="800" height="160"><text id=s x="0" y="12" font-size="10" fill="#888">Big SVG words</text></svg>`);
console.log(await p.evaluate(()=>[a,n,s].map(e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return e.id+' fs='+getComputedStyle(e).fontSize+' w='+b.width.toFixed(1)+' h='+b.height.toFixed(1)})));await close();})();
