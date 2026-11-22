const d='/home/user/pack-rgaa/';
const m=require(d+'review.js'); const REVIEW=m.REVIEW||m.default||m;
const fr=require(d+'i18n/fr.json');
let n=0,miss=[],same=[];
const all={};
for (const [ver,rules] of Object.entries(REVIEW)) for (const [rule,codes] of Object.entries(rules)) for (const [code,r] of Object.entries(codes)){
  all[rule+':'+code]=r.facet;
  const base=`rgaa_standardReview_${rule}_${code}_`;
  r.steps.forEach((s,i)=>{n++; const k=base+'step'+(i+1); if(!fr[k])miss.push(k); else if(fr[k]===s)same.push(k);});
  for (const [p,v] of [['pass',r.passWhen],['fail',r.failWhen]]){n++; const k=base+p; if(!fr[k])miss.push(k); else if(fr[k]===v) same.push(k);}
  // placeholders preserved
  const ph=t=>[...String(t).matchAll(/\{\{(\w+)/g)].map(x=>x[1]).sort().join(',');
  r.steps.forEach((s,i)=>{const k=base+'step'+(i+1); if(fr[k]&&ph(fr[k])!==ph(s)) console.log('PLACEHOLDER MISMATCH',k,ph(s),'|',ph(fr[k]));});
}
// extra fr keys with no English
const extra=Object.keys(fr).filter(k=>k.startsWith('rgaa_standardReview_')).filter(k=>{const m=k.match(/^rgaa_standardReview_(.+)_([A-Za-z0-9_]+?)_(step\d+|pass|fail)$/);return false});
console.log('strings',n,'missing fr',miss.length,miss.slice(0,10),'identical',same.length,same.slice(0,5));
for (const k of ['resize-text-content-loss','symbol-graphic-contrast','reflow-horizontal-scroll','listitem-parent-valid','p-as-heading','page-title-patterns','form-group-name-present','link-name-quality','link-name-quality-link-only']) console.log(k, Object.keys(all).filter(x=>x.startsWith(k+':')).map(x=>x.split(':')[1]+'→'+all[x]).join(' '));
