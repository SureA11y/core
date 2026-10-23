const {page,close}=require('./h');
(async()=>{
 const p=await page(`<style>.h{all:unset;position:relative;display:inline-block;width:16px;height:16px;background:#ccc}.h::before{content:"";position:absolute;inset:-4px}</style><div style="display:flex;gap:4px;margin:40px"><button class=h id=a>a</button><button class=h id=b>b</button></div>`);
 console.log(await p.evaluate(()=>{const r=a.getBoundingClientRect();const out=[];for(const dx of [-4,-3.5,0,8,19,20]){const e=document.elementFromPoint(r.left+dx,r.top+8);out.push(dx+':'+(e&&e.id))}return JSON.stringify(r)+' '+out.join(' ')}));
 await close();
})();
