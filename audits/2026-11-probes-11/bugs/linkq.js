const { js, rule } = require('./h.js');
const T = [['en','Here'],['en','Click here to download the 2026 annual report'],['en','Read more about our refund policy'],['en','More'],['en','Here Comes the Sun (song)'],['en','Learn more'],['en','Link'],['en','Download (PDF, 2 MB)'],['en','Continue reading'],['en','Continue reading “Paella”'],['en','details'],['en','Next'],['en','1'],['en','»'],['en','View'],['es','Leer más'],['es','aquí'],['es','Más información sobre envíos'],['de','Hier'],['de','Weiterlesen'],['de','mehr'],['fr','Lire la suite'],['fr','ici'],['fr','En savoir plus'],['ja','こちら'],['ja','詳しくはこちら'],['ja','もっと見る'],['en','Here and Now – a podcast'],['en','Click'],['en','https://example.com/page'],['en','www.example.com'],['en','Email us'],['en','More Than a Feeling']];
for (const [lang, t] of T) {
  const html = `<!doctype html><html lang="${lang}"><head><title>Link probe page</title></head><body><main><h1>x</h1><p>Some words before the link <a href="/z">${t}</a> and after it.</p></main></body></html>`;
  const r = js(html, ['link-name-quality', 'link-name-quality-link-only']);
  console.log(lang, JSON.stringify(t).padEnd(50), r.checksResults.map(c => c.ruleId.replace('link-name-quality','lnq') + '=' + c.outcome + ':' + ((c.occurrences||[]).map(o => o.data.details.reasonCode + '/' + (o.lean&&o.lean.toward||'')).join(','))).join('  '));
}
