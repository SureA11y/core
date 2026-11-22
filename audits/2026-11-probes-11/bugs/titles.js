const { js, rule, brief } = require('./h.js');
const T = ['Null Island – Wikipedia','NULL pointer exceptions explained | Dev Blog','100% Organic Cotton T-Shirt – Shop','{Fancy} Brackets: a CSS guide','Undefined behavior in C | cppreference','$ {title} pricing','Save 20% today','The Null Hypothesis','None of the above – Podcast','Template literals ${...} explained','Untitled Goose Game review','Home','Página de inicio','Accueil – Le Monde','Startseite','ホーム','Sin título','Document','New Tab','%s','{{ page.title }}','undefined | Site','[object Object]','NaN days left','Untitled','Startseite - Bundesregierung','Hello world!','Sample Page','Just another WordPress site','Products Archive - Shop','Page not found – Shop','Null and Void (film) - Wikipedia','%E2%80%93 encoded','50% off: {sale}'];
for (const [lang, list] of [['en', T]]) for (const t of list) {
  const html = `<!doctype html><html lang="${lang}"><head><title>${t.replace(/</g,'&lt;')}</title></head><body><main><h1>x</h1></main></body></html>`;
  const c = rule(js(html, ['page-title-patterns']), 'page-title-patterns');
  const o = (c.occurrences||[])[0];
  console.log(JSON.stringify(t).padEnd(48), c.outcome, o && o.data.details.reasonCode, o && o.lean && o.lean.toward || '');
}
