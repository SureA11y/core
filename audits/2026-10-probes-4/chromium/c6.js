const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
const T='Outlined heading';
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>c</title><style>html,body{background:#fff;color:#000;margin:0;font:16px sans-serif}</style></head><body><main>
 <h2 data-t id=outline style="color:transparent;-webkit-text-stroke:1px #ccc;font-size:32px">${T}</h2>
 <h2 data-t id=outline_fill_bg style="color:#fff;-webkit-text-stroke:1px #ccc;font-size:32px">${T}</h2>
 <h2 data-t id=outline_fill_other style="color:#fafafa;-webkit-text-stroke:1px #ccc;font-size:32px">${T}</h2>
 <p data-t id=shadow_only style="color:transparent;text-shadow:0 0 0 #ccc">${T}</p>
 <p data-t id=shadow_fill_bg style="color:#fff;text-shadow:1px 1px 0 #ccc">${T}</p>
 <p data-t id=shadow_fill_other style="color:#fefefe;text-shadow:1px 1px 0 #ccc">${T}</p>
 <ol style="color:#000"><li data-t id=marker class=m>Step text in black</li></ol>
 <p data-t id=before class=b></p>
 </main><style>.m::marker{color:#ccc}.b::before{content:"Generated label text";color:#ccc}</style></body></html>`;
 const r=await contrastRun(html);
 console.log(report('drawn-by-stroke/shadow + generated',r,{outline:'cantTell (TEXT_STROKE) or fail',outline_fill_bg:'cantTell',outline_fill_other:'cantTell',shadow_only:'cantTell/fail',shadow_fill_bg:'cantTell',shadow_fill_other:'cantTell',marker:'fail? (marker #ccc)',before:'fail (generated text #ccc)'}));
 await close();})();
