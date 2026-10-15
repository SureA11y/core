const {run,rep}=require('./nh.js');const {close}=require('./h.js');
const IGN=['manual-review','page-title-patterns','contrast-computable','contrast-minimum','contrast-enhanced'];
const $=s=>`document.querySelector(${JSON.stringify(s)})`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>Names</title><style>body{background:#fff;color:#000}</style></head><body>
 <header><search id=srch><form><label>Find <input type=search id=q></label><button>Go</button></form></search></header>
 <main><h1>Names</h1>
 <button id=pt popovertarget=menu>Menu</button>
 <button id=pt_empty popovertarget=menu></button>
 <div id=menu popover><a href="#1">One</a></div>
 <button id=cf commandfor=dlg command=show-modal>Open dialog</button>
 <button id=cf_icon commandfor=dlg command=show-modal><svg width=16 height=16 aria-hidden=true><rect width=16 height=16 /></svg></button>
 <dialog id=dlg closedby=any><h2>Hi</h2><button commandfor=dlg command=close>Close</button></dialog>
 <dialog id=dlg_open closedby=closerequest open aria-labelledby=dh><h2 id=dh>Prefs</h2><p>x</p></dialog>
 <details name=acc id=d1 open><summary>First</summary><p>Body 1</p></details>
 <details name=acc id=d2><summary>Second</summary><img id=img_closed src=x.png></details>
 <div inert id=inertbox><button id=inert_btn></button><img id=inert_img src=y.png></div>
 <div hidden=until-found id=huf><img id=huf_img src=z.png><p>findable</p></div>
 <label for=cs>Fruit</label>
 <select id=cs style="appearance:base-select"><button id=cs_btn><selectedcontent id=sc></selectedcontent></button><option value=a><img src="a.png" alt="">Apple</option><option value=b>Banana</option></select>
 <select id=cs2 aria-label="Veg" style="appearance:base-select"><option>Kale</option></select>
 </main></body></html>`;
 const r=await run(html,{search:$('#srch'),pt:$('#pt'),pt_empty:$('#pt_empty'),cf:$('#cf'),cf_icon:$('#cf_icon'),dlg_open:$('#dlg_open'),d2sum:$('#d2 summary'),inert_btn:$('#inert_btn'),inert_img:$('#inert_img'),huf_img:$('#huf_img'),cs:$('#cs'),cs_btn:$('#cs_btn'),cs2:$('#cs2'),opt_a:$('#cs option')},{ignore:IGN});
 console.log(rep('modern html names',r));
 const supp=await (async()=>0)();
 await close();})();
