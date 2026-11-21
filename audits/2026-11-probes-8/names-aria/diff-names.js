// Differential: engine's inspect('names'/'landmarks'/'headings') vs Chromium AX tree, per data-t element
const { launch, BUNDLE } = require('./harness');
const norm = s => String(s||'').replace(/\s+/g,' ').trim();
async function diff(b, id, body, setup) {
  const p=await b.newPage(); await p.setContent(`<!doctype html><html lang=en><head><title>T</title></head><body>${body}</body></html>`);
  if (setup) await p.evaluate(setup);
  await p.addScriptTag({content:BUNDLE});
  const eng = await p.evaluate(async()=>{ console.table=()=>{}; const out={};
    for (const k of ['names','landmarks','headings']) { const rows=await window.a11ycore.inspect(k,{draw:false}); for (const r of rows){ let el=null; try{ el=document.querySelector(r.element);}catch{} if(!el){ // search shadow roots
          for (const h of document.querySelectorAll('*')) if (h.shadowRoot){ try{ el=h.shadowRoot.querySelector(r.element);}catch{} if(el)break; } }
        const t=el&&el.getAttribute('data-t'); if(t) out[t]=Object.assign(out[t]||{}, {role:r.role|| (k==='headings'?'heading':undefined), name:r.name, level:r.level}); } }
    return out; });
  const cdp=await p.context().newCDPSession(p); const {nodes}=await cdp.send('Accessibility.getFullAXTree');
  const dom=await cdp.send('DOM.getDocument',{depth:-1,pierce:true}); const tmap={};
  (function walk(n){ if(n.attributes) for(let i=0;i<n.attributes.length;i+=2) if(n.attributes[i]==='data-t') tmap[n.backendNodeId]=n.attributes[i+1]; (n.children||[]).concat(n.shadowRoots||[]).forEach(walk);})(dom.root);
  const ax={}; for (const n of nodes) if(n.backendDOMNodeId&&tmap[n.backendDOMNodeId]) ax[tmap[n.backendDOMNodeId]]={role:n.role&&n.role.value,name:n.name&&n.name.value,ignored:n.ignored, level:((n.properties||[]).find(x=>x.name==='level')||{value:{}}).value.value};
  await p.close();
  const keys=new Set([...Object.keys(eng),...Object.keys(ax)]); const lines=[];
  for (const k of [...keys].sort()) { const e=eng[k]||{}, a=ax[k]||{}; const nm = norm(e.name)===norm(a.name); 
    lines.push(`${nm?'  ':'!!'} ${id}/${k}: engine ${e.role}:${JSON.stringify(e.name)}${e.level?' L'+e.level:''} | chromium ${a.role}${a.ignored?'(ignored)':''}:${JSON.stringify(a.name)}${a.level?' L'+a.level:''}`); }
  return lines.join('\n');
}
module.exports={diff};
if (require.main===module) {
 const cases = require(process.argv[2]);
 (async()=>{ const b=await launch(); for (const [id,body,setup] of cases) { try { console.log(await diff(b,id,body,setup)); } catch(e){ console.log('CRASH',id,e.message);} } await b.close(); })();
}
