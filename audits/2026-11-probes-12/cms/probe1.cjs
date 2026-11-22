const path='/tmp/surea11y-audit/r12/cms/wt/';
const core=require(path+'node_modules/@surea11y/core');
const pack=require(path+'packages/pack-cms');
const cat=core.getChecksCatalog({packs:[pack]});
const titles=require(path+'packages/panel/src/messages/rule-titles.en.json');
const ids=cat.map(r=>r.ruleId);
console.log('catalog',ids.length,'titles',Object.keys(titles).length);
console.log('untitled:',ids.filter(i=>!titles[i]).join(' '));
// profile membership
const profs=core.listProfiles?core.listProfiles({packs:[pack]}):null;
console.log('profiles fn', typeof core.listProfiles, Object.keys(core).filter(k=>/rofile/.test(k)));
for (const id of ['reflow-horizontal-scroll','link-name-quality-link-only','resize-text-content-loss','form-group-name-present','symbol-graphic-contrast']){
 const r=cat.find(r=>r.ruleId===id); console.log(id, r? JSON.stringify({tags:r.tags,profiles:r.profiles,titleKey:r.i18n&&r.i18n.titleKey}).slice(0,300):'MISSING');
}
