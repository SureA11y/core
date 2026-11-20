const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const core = require('/home/user/core/src/index.js');
const html = require('./page.js');
const tick = () => new Promise(r => setImmediate(r));
const strs = (o, out = [], path='') => { if (typeof o === 'string') out.push([path,o]); else if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (k==='html'||k==='selector'||k==='engineOptions'||k==='i18n'||k==='params') continue; strs(o[k], out, path+'.'+k); } return out; };
(async () => {
  console.log(JSON.stringify(core.getLocaleCoverage()).slice(0, 600));
  for (const locale of ['en','de','es','fr','ja']) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { locale, profile: 'wcag22-aaa' }, runOnly: { bestPractices: true } }); await tick();
    const all = strs({ c: r.checksResults.map(c => ({ outcome: c.outcome, title: c.title, description: c.description, occ: c.occurrences })), rr: r.rulesResults.map(x=>({t:x.title,d:x.description,o:x.occurrences})) });
    const bad = all.filter(([p,s]) => /\{\{|\{[a-zA-Z_]+\}|\bundefined\b|\bnull\b|\[object Object\]|\bNaN\b|^[a-z]+(_[a-zA-Z0-9]+){2,}$/.test(s));
    console.log(locale, JSON.stringify(r.engine.locale), 'strings', all.length, 'suspicious', bad.length);
    for (const b of bad.slice(0, 8)) console.log('   ', b[0].slice(0,80), '=>', b[1].slice(0, 160));
  }
})();
