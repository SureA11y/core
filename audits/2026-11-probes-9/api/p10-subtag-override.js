const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const html = '<html><body><img src="x.png"><button></button></body></html>';
for (const [locale, messages] of [['de-AT', {'de-AT': {img_altPresent_title:'AT Titel'}}], ['de-AT', undefined], ['de', {'DE': {img_altPresent_title:'Eigener'}}], ['de', {'de': {img_altPresent_title:'Eigener'}}]]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { locale, messages }, entryPointParity:false });
  const img = r.checksResults.find(c=>c.ruleId==='img-alt-present'); const btn=r.checksResults.find(c=>c.ruleId==='button-name-present');
  console.log(locale, JSON.stringify(messages), JSON.stringify(r.engine.locale), '\n  ', img.title, '|', img.occurrences[0].summary, '|', btn.title);
}
