const {createRequire}=require('module'); const R=createRequire('/home/user/pack-rgaa/index.js');
const {runa11yCoreOnHtml}=R('@surea11y/core/testing'); const rgaa=R('/home/user/pack-rgaa/index.js'); const pub=R('/home/user/pack-rgaa/public.js');
const html=`<!doctype html><html lang="fr"><head><title>Contact – Mairie</title><style>button{color:#ccc;border:1px solid #eee;background:#fff}</style></head><body><main><h1>Contact</h1><p>Note : <span style="color:#ddd">★★★☆☆</span></p><button>Envoyer</button><svg width="20" height="20" role="img" aria-label="Alerte"><circle cx="10" cy="10" r="8" fill="#eee"/></svg></main></body></html>`;
const html2=`<!doctype html><html lang="fr"><head><title>Contact – Mairie</title></head><body><main><h1>Contact</h1><button style="color:#ccc;border:1px solid #eee;background:#fff">Envoyer</button></main></body></html>`;
for (const h of [html,html2]){
const r=runa11yCoreOnHtml(h,{engineOptions:{packs:[rgaa],profile:'rgaa-4.1.2'}});
const roll=id=>{const x=r.rulesResults.find(x=>x.ruleId==='rgaa-4.1.2-'+id);return x&&x.outcome};
const st=pub.rgaaCriteriaStatus? pub.rgaaCriteriaStatus(r):null;
const pick=id=>st&&(Array.isArray(st)?st.find(x=>x.criterion===id||x.id===id):st[id]);
for (const c of ['3.3','10.4','10.11']) console.log(c,'rollup',roll(c),'status',JSON.stringify(pick(c)).slice(0,250));
const sg=r.checksResults.find(c=>c.ruleId==='symbol-graphic-contrast'); console.log('symbol rule',sg&&sg.outcome);
}
