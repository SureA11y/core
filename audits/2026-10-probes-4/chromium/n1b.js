const {scan,close}=require('./h.js');
(async()=>{
 const o=await scan(`<!doctype html><html lang=en><title>x</title><body style="background:#fff"><main><h1>x</h1><div inert><img id=a src=y.png><button id=b></button><a href="#" id=c></a><input id=d></div>
 <select id=cs style="appearance:base-select" aria-label="Fruit"><button><selectedcontent></selectedcontent></button><option>Apple</option></select>
 <select id=cs3 style="appearance:base-select" aria-label="Fruit2"><option>Apple</option></select></main>`);
 for(const k of Object.keys(o)){const r=o[k]; if(r.outcome==='pass'||r.outcome==='notApplicable')continue; console.log(k,r.outcome,JSON.stringify(r.occ.map(x=>x.html.slice(0,60))));}
 await close();})();
