const {run,rep}=require('./nh.js');const {close}=require('./h.js');
const IGN=['manual-review','page-title-patterns','contrast-computable','contrast-minimum','target-size-minimum','form-control-programmatic-label-quality'];
const $=s=>`document.querySelector(${JSON.stringify(s)})`;
(async()=>{
 let html=`<!doctype html><html lang=en><head><title>M</title></head><body style="background:#fff"><main><h1>M</h1><div aria-hidden=true id=bgah><button id=bgbtn>Behind</button></div><p>Read the <x-link role=link tabindex=0 id=el></x-link> now and also <a href="#z" id=ea></a> later.</p>
 <dialog id=d aria-label="Confirm"><div aria-hidden=true id=dah><button id=dbtn>Hidden inside</button></div><div aria-hidden=true><span>decor</span></div><button>OK</button></dialog></main></body></html>`;
 let r=await run(html,{bgbtn:$('#bgbtn'),dbtn:$('#dbtn')},{ignore:IGN,setup:()=>document.getElementById('d').showModal()});
 console.log(rep('aria-hidden inside modal dialog (bg also has aria-hidden focusable)',r));
 html=`<!doctype html><html lang=en><head><title>F</title></head><body style="background:#fff"><main><h1>F</h1>
 <iframe id=f1 title="Pay" sandbox srcdoc="<!doctype html><html lang=en><title>in</title><body><img src=x.png><button></button></body></html>"></iframe>
 <iframe id=f2 sandbox="allow-scripts" srcdoc="<p>untitled</p>"></iframe>
 <iframe id=f3 title="Pay" srcdoc="<p>a</p>"></iframe><iframe id=f4 title="Pay" srcdoc="<p>b</p>"></iframe>
 <iframe id=f5 title="hidden" srcdoc="<a href=#>x</a>" tabindex=-1 style="width:0;height:0;border:0"></iframe>
 </main></body></html>`;
 r=await run(html,{f1:$('#f1'),f2:$('#f2'),f5:$('#f5')},{ignore:IGN,wait:300});
 console.log(rep('frames',r));
 await close();})();
