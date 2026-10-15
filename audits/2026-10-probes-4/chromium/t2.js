const {run,rep}=require('./th.js');const {close}=require('./h.js');
const sq=(id,extra='',w=16)=>`<button data-t id=${id} style="all:unset;display:inline-block;width:${w}px;height:${w}px;background:#06c;${extra}" aria-label="${id}"></button>`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>t</title><style>body{margin:0;font:16px sans-serif;background:#fff} section{margin:20px;position:relative}
 #hdr{position:sticky;top:0;height:60px;background:#eee;z-index:5}
 [popover]{margin:0;padding:4px;border:1px solid #000;inset:auto;top:400px;left:500px}
 #anc{anchor-name:--a} #pa{position-anchor:--a;top:anchor(bottom);left:anchor(left);position:absolute}
 </style></head><body>
 <header id=hdr><a href="#">Home</a></header>
 <main>
 <section><p>Read the <a data-t id=inline href="#a">terms</a> before you continue with the order.</p></section>
 <section>${sq('spaced1')}<span style="display:inline-block;width:30px"></span>${sq('spaced2')}</section>
 <section>${sq('tight1')}<span style="display:inline-block;width:2px"></span>${sq('tight2')}</section>
 <section style="padding:20px">${sq('scaleup','transform:scale(2)')}</section>
 <section>${sq('scaledown','transform:scale(0.5)',30)}${sq('scaledown_nb','',30)}</section>
 <section style="height:40px">${sq('under_sticky','',30)}</section>
 <button id=anc popovertarget=pa>Anchor opener</button>
 <div id=pa popover>${sq('pop1')}${sq('pop2')}</div>
 <section style="margin-top:600px">${sq('farlow1')}${sq('farlow2')}</section>
 </main></body></html>`;
 const r=await run(html,['target-size-minimum'],{setup:()=>{document.getElementById('pa').showPopover();}});
 console.log(rep('target size',r,{inline:'pass (inline exception)',spaced1:'pass (spacing)',spaced2:'pass (spacing)',tight1:'fail',tight2:'fail',scaleup:'pass (32x32)',scaledown:'fail (15x15, neighbour 0px)',scaledown_nb:'pass',pop1:'fail',pop2:'fail',farlow1:'fail',farlow2:'fail'}));
 await close();})();
