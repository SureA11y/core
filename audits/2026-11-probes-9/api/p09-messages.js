const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { getLocaleCoverage } = require('@surea11y/core');
const en = require('/home/user/core-r9/src/i18n/en.json');
console.log('img_altPresent_title in en:', 'img_altPresent_title' in en, Object.keys(en).filter(k=>/^img_?alt/i.test(k)).slice(0,5));
const cov = getLocaleCoverage(); console.log(cov.totalKeys, cov.locales.map(l=>l.locale+':'+l.translated+'/'+l.total+' miss'+l.missing).join(' '));
const html = '<html><body><img src="x.png"></body></html>';
const titleKey = (r)=>r.checksResults.find(c=>c.ruleId==='img-alt-present');
const base = runa11yCoreOnHtml(html,{entryPointParity:false}); const ik = titleKey(base).i18n; console.log('i18n', JSON.stringify(ik).slice(0,300));
const key = ik && ik.titleKey;
const cases = [
  ['pt-br', {'pt-BR': {[key]:'PT title'}}],
  ['PT-BR', {'pt-br': {[key]:'PT title'}}],
  ['pt-BR', {'pt': {[key]:'PT title'}}],
  ['de', {'DE': {[key]:'Eigener Text'}}],
  ['de-AT', {'de-AT': {[key]:'AT Text'}}],
  ['de-AT', {'de': {[key]:'Eigener Text'}}],
  ['ko', {'ko': {[key]:'KO'}}],
  ['fr', {'en': {[key]:'EN override'}}],
];
for (const [locale, messages] of cases) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { locale, messages }, entryPointParity:false });
  console.log(locale, Object.keys(messages)[0], '->', JSON.stringify(r.engine.locale), titleKey(r).title);
}
