const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
const T='Sample text here';
const css=`html,body{background:#fff;color:#000;margin:0;font:16px sans-serif}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes greyin{from{color:#eee}to{color:#ddd}}
@keyframes greyfwd{from{color:#000}to{color:#ccc}}
.a1{animation:fadein 20s linear}
.a2{animation:greyin 20s linear}           /* fill none: final shown state = base #000 */
.a3{animation:greyfwd 20s linear forwards} /* ends at #ccc: fail */
.a4{animation:fadein 20s linear paused}    /* paused at opacity 0 by author */
.tr{transition:color 20s linear;color:#ddd}
.tr.go{color:#000}
.ss{transition:opacity 20s, color 20s;opacity:1;color:#111}
@starting-style{.ss{opacity:0;color:#fff}}
.cva{content-visibility:auto;contain-intrinsic-size:auto 50px}
.spacer{height:2500px}
@keyframes inf{0%{color:#000}50%{color:#bbb}100%{color:#000}}
.inf{animation:inf 2s infinite}
@keyframes rev{from{color:#000}to{color:#ccc}}
.rev{animation:rev 20s linear reverse both}
`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>c</title><style>${css}</style></head><body><main>
 <p data-t id=a1 class=a1 style="color:#333">${T}</p>
 <p data-t id=a2 class=a2>${T}</p>
 <p data-t id=a3 class=a3>${T}</p>
 <p data-t id=a4 class=a4>${T}</p>
 <p data-t id=tr class=tr>${T}</p>
 <div id=ssh></div>
 <p data-t id=inf class=inf>${T}</p>
 <p data-t id=rev class=rev>${T}</p>
 <p data-t id=waapi>${T}</p>
 <div class=spacer></div>
 <div class=cva><p data-t id=cva_far style="color:#aaa">${T}</p></div>
 </main></body></html>`;
 const r=await contrastRun(html,{setup:()=>{document.getElementById('tr').classList.add('go');
   const p=document.createElement('p');p.className='ss';p.id='ss';p.setAttribute('data-t','');p.textContent='Starting style';document.getElementById('ssh').append(p);
   document.getElementById('waapi').animate([{color:'#000'},{color:'#ccc'}],{duration:20000,delay:5000,fill:'backwards'});
 },wait:300});
 console.log(report('animations',r,{a1:'pass',a2:'pass',a3:'fail',a4:'? (author-paused at opacity 0)',tr:'pass',ss:'pass',inf:'?',rev:'pass (reverse both ends at from=#000)',waapi:'pass (fill backwards then none; end=base #000)',cva_far:'fail'}));
 await close();
})();
