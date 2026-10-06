const {page}=require('./h');
async function px(html, sel, opts={}){
  const p=await page(html,opts);
  const buf=await p.locator(sel).first().screenshot();
  const res=await p.evaluate(async (b64)=>{
    const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode();
    const c=document.createElement('canvas'); c.width=img.width;c.height=img.height; const x=c.getContext('2d'); x.drawImage(img,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data; const counts=new Map();
    for(let i=0;i<d.length;i+=4){const k=d[i]+','+d[i+1]+','+d[i+2];counts.set(k,(counts.get(k)||0)+1);}
    const lum=(r,g,b)=>{const f=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
    const cr=(a,b)=>{const x=lum(...a),y=lum(...b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const sorted=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
    const bg=sorted[0][0].split(',').map(Number);
    let best=null,bc=0; for(const [k,n] of sorted){ if(n<3) continue; const c=k.split(',').map(Number); const r=cr(c,bg); if(r>bc){bc=r;best=c;} }
    return {bg, fg:best, ratio:+bc.toFixed(2), top:sorted.slice(0,3).map(e=>e.join(' x'))};
  }, buf.toString('base64'));
  await p.close(); return res;
}
module.exports={px};
