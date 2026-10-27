// contrast harness: per-id engine verdict + pixel ground truth
const {getBrowser}=require('./h.js');
const fs=require('fs');const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
function lum([r,g,b]){const f=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
function cr(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
async function pixels(b,png,boxes){
  const p=await b.newPage();
  const res=await p.evaluate(async([src,boxes])=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
   const out={};for(const [id,bx] of Object.entries(boxes)){ if(!bx||bx.w<1){out[id]=null;continue;} const d=g.getImageData(Math.max(0,Math.floor(bx.x)),Math.max(0,Math.floor(bx.y)),Math.max(1,Math.ceil(bx.w)),Math.max(1,Math.ceil(bx.h))).data; const hist={};const px=[];for(let i=0;i<d.length;i+=4){const k=d[i]+','+d[i+1]+','+d[i+2];hist[k]=(hist[k]||0)+1;} out[id]=hist;} return out;},['data:image/png;base64,'+png.toString('base64'),boxes]);
  await p.close();
  const gt={};
  for(const [id,h] of Object.entries(res)){ if(!h){gt[id]=null;continue;} const e=Object.entries(h).sort((a,b)=>b[1]-a[1]); const bg=e[0][0].split(',').map(Number); let best=1,fg=bg; for(const [k] of e){const c=k.split(',').map(Number);const r=cr(c,bg);if(r>best){best=r;fg=c;}} gt[id]={bg:bg.join(','),fg:fg.join(','),ratio:+best.toFixed(2)}; }
  return gt;
}
async function contrastRun(html,{setup,colorScheme,wait=50,eo={},forcedColors,ids:only,beforeScan}={}){
  const b=await getBrowser();
  const ctx=await b.newContext({viewport:{width:1000,height:900},colorScheme,forcedColors});
  const p=await ctx.newPage();
  await p.setContent(html);
  if(setup) await p.evaluate(setup);
  await p.waitForTimeout(wait);
  const boxes=await p.evaluate(()=>{const o={};for(const el of document.querySelectorAll('[data-t]')){const rs=[...el.getClientRects()];const r=el.getBoundingClientRect(); o[el.id]={x:r.x+window.scrollX,y:r.y+window.scrollY,w:r.width,h:r.height};}return o;});
  const png=await p.screenshot({fullPage:true});
  await p.addScriptTag({content:BUNDLE});
  if(beforeScan) await p.evaluate(beforeScan);
  const eng=await p.evaluate((eo)=>{try{const r=window.a11ycore.runa11yCoreInPage(location.href,null,eo,null);
    const o={};const els=[...document.querySelectorAll('[data-t]')];
    for(const el of els) o[el.id]=[];
    for(const id of ['contrast-minimum','contrast-computable','contrast-enhanced']){const c=r.checksResults.find(x=>x.ruleId===id); if(id==='contrast-enhanced')continue; for(const oc of c.occurrences||[]){ let el=null; try{el=document.querySelector(oc.selector)}catch{}
        let host=el&&el.closest('[data-t]'); const key=host?host.id:('?'+oc.selector); (o[key]=o[key]||[]).push({rule:id,code:oc.data&&oc.data.details&&oc.data.details.reasonCode, unc:oc.uncertainty&&oc.uncertainty.code, s:(oc.summary||'').slice(0,230), sel:oc.selector}); }}
    return o;}catch(e){return {CRASH:String(e.stack||e)}}},eo);
  await ctx.close();
  const gt=await pixels(b,png,boxes);
  return {eng,gt};
}
function verdict(list){ if(!list||!list.length) return 'pass'; if(list.some(x=>x.rule==='contrast-minimum'&&/insufficient|below/i.test(x.s)||x.code==='BELOW_THRESHOLD')) return 'FAIL'; return 'cantTell'; }
function report(title,res,expect){ const lines=['## '+title]; if(res.eng.CRASH){lines.push('CRASH '+res.eng.CRASH);return lines.join('\n');}
  for(const id of Object.keys({...expect,...res.eng})){ const v=verdict(res.eng[id]); const ex=expect[id]||'?'; const flag=(ex==='pass'&&v==='FAIL')?'  <<< FALSE FAIL':(ex==='fail'&&v==='pass')?'  <<< MISSED':(ex==='fail'&&v==='cantTell')?'  (missed->cantTell)':(ex==='pass'&&v==='cantTell')?'  (cantTell)':'';
    lines.push(`${id}: expect=${ex} engine=${v} px=${JSON.stringify(res.gt[id])}${flag}`); for(const x of res.eng[id]||[]) lines.push(`    ${x.rule} ${x.code||''} ${x.unc||''} :: ${x.s}`);} return lines.join('\n'); }
module.exports={contrastRun,report};
