const p=process.argv[2]; const d='/home/user/pack-'+p+'/';
const {createRequire}=require('module'); const R=createRequire(d+'index.js');
const core=R('@surea11y/core'); const {checkPack}=R('@surea11y/core/pack');
console.log('core version',core.version||R('@surea11y/core/package.json').version);
const pack=R(d+'index.js');
const pk=pack.default||pack;
console.log(p,'pack',pk.name,pk.version,'core range',pk.core);
let r; try{ r=checkPack(pk);}catch(e){r='THROW '+e.message}
console.log('checkPack:',JSON.stringify(r,null,1).slice(0,3000));
const cat=core.getChecksCatalog({packs:[pk]});
const coreRules=cat.filter(x=>!x.ruleId.startsWith(pk.namespace+'-')).map(x=>x.ruleId);
const std=pk.standard;
// find map rows
let mapped=new Set();
const rm = (()=>{try{return R(d+'rule-map.js')}catch{return null}})();
const s=JSON.stringify(rm||std||{});
for (const id of coreRules) if (s.includes('"'+id+'"')) mapped.add(id);
const NEW=['reflow-horizontal-scroll','link-name-quality-link-only','resize-text-content-loss','form-group-name-present','symbol-graphic-contrast'];
console.log('new rules present in map source:',NEW.map(n=>n+'='+mapped.has(n)).join(' '));
console.log('core rules absent from map source:',coreRules.filter(x=>!mapped.has(x)).length, coreRules.filter(x=>!mapped.has(x)).slice(0,40).join(' '));
