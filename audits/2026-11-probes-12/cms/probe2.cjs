const vm=require('vm'),fs=require('fs'),path=require('path');
const W='/tmp/surea11y-audit/r12/cms/wt/', B=W+'plugins/wordpress/build/', C='/home/user/core/src/';
const {readRuleProse}=require(C+'rule-docs.js');
const prose=new Map();
for (const d of ['automatic','manual']) for (const [id,p] of readRuleProse(C+'checks/'+d)) prose.set(id,p);
const rules=JSON.parse(fs.readFileSync(B+'rules.json'));
const ctx={window:{}}; vm.createContext(ctx);
for (const l of ['en','de','es','fr','ja']) vm.runInContext(fs.readFileSync(B+`review.${l}.js`,'utf8'),ctx);
const dicts=ctx.window.SureA11yReview.dictionaries;
const core=require(W+'node_modules/@surea11y/core'); const pack=require(W+'packages/pack-cms');
const cat=core.getChecksCatalog({packs:[pack]});
const msgs={}; for (const l of ['en','de','es','fr','ja']) msgs[l]=require(C+`i18n/${l}.json`);
const panelMsgs={}; for (const l of ['en','de','es','fr','ja']) panelMsgs[l]=require(W+`packages/panel/src/messages/${l}.json`);
const missing={};
const add=(k,v)=>(missing[k]=missing[k]||[]).push(v);
const NEW=['form-group-name-present','symbol-graphic-contrast','resize-text-content-loss','reflow-horizontal-scroll','p-as-heading','page-title-patterns','listitem-parent-valid','click-handler-keyboard-operable','video-poster-text-alternative-present'];
for (const r of rules){
  const p=prose.get(r.id); const c=cat.find(x=>x.ruleId===r.id);
  const prefix=((c.i18n&&c.i18n.titleKey)||'').replace(/_title$/,'');
  if(!p){add('noProse',r.id);continue;}
  for (const rc of p.reasonCodes||[]){
    const cant=/cantTell/.test(rc.outcomes||rc.outcome||JSON.stringify(rc));
    if(!cant) continue;
    for (const l of ['en','de','es','fr','ja']){
      const k=`${prefix}_review_${rc.code}_step1`;
      if(!dicts[l][k]) add('noReviewStep_'+l, r.id+':'+rc.code);
    }
  }
}
for (const [k,v] of Object.entries(missing)) console.log(k, v.length, v.join(' '));
console.log('sample prose rc', JSON.stringify(prose.get('form-group-name-present').reasonCodes).slice(0,400));
// panel review overrides: keys whose set no longer exists in core en
const coreEnReview=require('module').createRequire(W+'x.js')('@surea11y/core/review/en');
const setOf=k=>k.replace(/_(step\d+|pass|fail)$/,'');
const coreSets=new Set(Object.keys(coreEnReview).map(setOf));
for (const l of ['en','de','es','fr','ja']){
 const ours=require(W+`packages/panel/src/messages/review.${l}.json`);
 const stale=[...new Set(Object.keys(ours).map(setOf))].filter(s=>!coreSets.has(s));
 if(stale.length) console.log('panel review sets not in core',l,stale.join(' '));
 const en=require(W+`packages/panel/src/messages/review.en.json`);
 const miss=Object.keys(en).filter(k=>!(k in ours)); if(miss.length) console.log('panel review keys missing in',l,miss.length,miss.slice(0,5).join(' '));
 // overrides with fewer steps than core? 
}
// panel message overrides: keys not in core en
for (const l of ['en','de','es','fr','ja']){
 const stale=Object.keys(panelMsgs[l]).filter(k=>!(k in msgs.en)); if(stale.length) console.log('panel msg keys not in core',l,stale.join(' '));
 const miss=Object.keys(panelMsgs.en).filter(k=>!(k in panelMsgs[l])); if(miss.length) console.log('panel msg keys missing',l,miss.join(' '));
}
