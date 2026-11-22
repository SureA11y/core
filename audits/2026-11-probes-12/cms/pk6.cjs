const {createRequire}=require('module'); const R=createRequire('/home/user/pack-rgaa/index.js');
const {runa11yCoreOnHtml}=R('@surea11y/core/testing'); const rgaa=R('/home/user/pack-rgaa/index.js'); const pub=R('/home/user/pack-rgaa/public.js');
const html=`<!doctype html><html lang="fr"><head><title>Inscription – Mairie</title></head><body><main><h1>Inscription</h1><form><p>Vos centres d’intérêt</p><label><input type="checkbox" name="i" value="a"> Sport</label><label><input type="checkbox" name="i" value="b"> Culture</label><button>Envoyer</button></form></main></body></html>`;
const r=runa11yCoreOnHtml(html,{engineOptions:{packs:[rgaa],profile:'rgaa-4.1.2'}});
const c=r.checksResults.filter(c=>/form-group|checkbox|radio-group|field-group/.test(c.ruleId)).map(c=>c.ruleId+':'+c.outcome).join(' ');
console.log('rules:',c);
const st=pub.rgaaCriteriaStatus(r); for (const id of ['11.5','11.6']) console.log(id, JSON.stringify(st.find(x=>x.criterion===id)).replace(/"title":"[^"]*",/,''));
