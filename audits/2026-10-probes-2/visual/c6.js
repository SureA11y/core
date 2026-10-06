const {page,close}=require('./h');
const cols=['oklch(0.7 none 0)','oklch(70% 0 none)','lab(60 none none)','color(srgb 0.6 0.6 0.6)','color(display-p3 0.6 0.6 0.6)','color(srgb-linear 0.3 0.3 0.3)','color(xyz-d65 0.3 0.3 0.3)','color(rec2020 0.6 0.6 0.6)','color(a98-rgb 0.6 0.6 0.6)','color(prophoto-rgb 0.6 0.6 0.6)','color-mix(in oklch, #000 40%, #fff)','rgb(from #fff r g b / 0.5)','oklch(from #888 l c h)','lch(60 0 0 / 50%)','color(xyz-d50 0.3 0.3 0.3)','oklab(0.6 0 0 / 0.999)', 'color(srgb 0.6 0.6 0.6 / none)', 'hsl(0 0% 60% / none)'];
(async()=>{
 const html=cols.map((c,i)=>`<p id=p${i} style="color:${c}">Sample text ${i}</p>`).join('');
 const p=await page(html);
 const r=await p.evaluate((cols)=>{const res=a11ycore.runa11yCoreInPage(location.href,null,{},['contrast-minimum','contrast-computable']);
   const occ={};for(const c of res.checksResults)for(const o of c.occurrences)occ[c.ruleId+o.selector]=o.summary.slice(0,140);
   return cols.map((c,i)=>{const e=document.getElementById('p'+i);const cv=document.createElement('canvas');cv.width=cv.height=1;const x=cv.getContext('2d');x.fillStyle=getComputedStyle(e).color;x.fillRect(0,0,1,1);const d=x.getImageData(0,0,1,1).data;return c+' => '+getComputedStyle(e).color+' canvas['+[...d].join(',')+'] :: '+(occ['contrast-minimum#p'+i]||occ['contrast-computable#p'+i]||'pass')});},cols);
 console.log(r.join('\n')); await close();})();
