const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
const T='Sample text here';
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>c</title><style>html,body{background:#fff;color:#000;margin:0;font:16px sans-serif} p{margin:8px}
 .bf::before{content:"Before text ";color:#ccc}
 .fl::first-letter{color:#ddd;font-size:16px}
 </style></head><body><main>
 <p data-t id=sh_weak style="color:#fff;text-shadow:1px 1px 0 #ddd">${T}</p>
 <p data-t id=sh_far style="color:#fff;text-shadow:30px 0 0 #000">${T}</p>
 <p data-t id=sh_only style="color:transparent;text-shadow:0 0 0 #ccc">${T}</p>
 <p data-t id=stroke_thin style="color:#fff;-webkit-text-stroke:0.3px #ddd">${T}</p>
 <p data-t id=fill style="color:#000;-webkit-text-fill-color:#ccc">${T}</p>
 <div style="opacity:0.5"><p data-t id=op_anc style="color:#767676">${T}</p></div>
 <p data-t id=bf class=bf>x</p>
 <p data-t id=fl class=fl>${T}</p>
 <p data-t id=trans_bg style="background:rgb(0 0 0 / 0.9);color:#666">${T}</p>
 <p data-t id=sticky_over>${T}</p>
 </main></body></html>`;
 const r=await contrastRun(html);
 console.log(report('shadows/pseudo',r,{sh_weak:'fail',sh_far:'fail/cantTell',sh_only:'fail/cantTell',stroke_thin:'fail/cantTell',fill:'fail',op_anc:'fail',bf:'fail (::before content)',fl:'cantTell/fail',trans_bg:'fail',sticky_over:'pass'}));
 // forced colors
 const html2=`<!doctype html><html lang=en><head><title>c</title><style>html,body{background:#fff;color:#000;margin:0;font:16px sans-serif}</style></head><body><main><p data-t id=fc1 style="color:#ccc">${T}</p><p data-t id=fc2 style="color:#ccc;forced-color-adjust:none">${T}</p></main></body></html>`;
 const r2=await contrastRun(html2,{forcedColors:'active'});
 const ex={};for(const id in r2.gt) ex[id]=r2.gt[id].ratio>=4.5?'pass':'fail';
 console.log(report('forced colors active',r2,ex));
 await close();
})();
