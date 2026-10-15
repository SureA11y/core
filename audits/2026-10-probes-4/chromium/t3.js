const {run,rep}=require('./th.js');const {close}=require('./h.js');
const sq=(id,extra='',w=16)=>`<button data-t id=${id} style="all:unset;display:inline-block;width:${w}px;height:${w}px;background:#06c;${extra}" aria-label="${id}"></button>`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>x</h1>
 <section>${sq('bg1')}${sq('bg2')}</section>
 <div inert>${sq('inert1')}${sq('inert2')}</div>
 <section>${sq('sd1','transform:scale(0.5)',30)}${sq('sd2','transform:scale(0.5)',30)}</section>
 <section>${sq('rot1','transform:rotate(45deg)',20)}<span style="display:inline-block;width:6px"></span>${sq('rot2','',20)}</section>
 <dialog id=d aria-label="Pick">${sq('dlg1')}${sq('dlg2')}<button>Close</button></dialog>
 </main></body></html>`;
 let r=await run(html,['target-size-minimum'],{});
 console.log(rep('no modal',r,{bg1:'fail',bg2:'fail',inert1:'NA (inert: not operable)',inert2:'NA',sd1:'fail (15x15, centres 30 apart -> circles 24 dia do not overlap... ',rot1:'?'}));
 r=await run(html,['target-size-minimum'],{setup:()=>document.getElementById('d').showModal()});
 console.log(rep('modal open',r,{bg1:'NA (inert)',bg2:'NA',dlg1:'fail',dlg2:'fail'}));
 await close();})();
