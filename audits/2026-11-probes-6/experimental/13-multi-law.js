const { sd, base, mkPack, runa11yCoreOnHtml } = require('./lib.js');
const d = base();
d.laws = { 'pub-act': { name: 'Public Act', jurisdiction: 'FR' }, 'priv-act': { name: 'Private Act', jurisdiction: 'EU' } };
d.profiles = { 'base-1': { version: '1', tags: ['base'], mappedRules: true, law: 'pub-act' }, 'base-1-priv': { version: '1', tags: ['base'], mappedRules: true, law: 'priv-act' } };
const p = mkPack(sd.standardFromData(d));
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
for (const profile of [['base-1', 'base-1-priv'], ['base-1-priv', 'base-1'], ['wcag22-aa', 'base-1-priv']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [p], profile } });
  console.log(JSON.stringify(profile), 'engine.profile=', JSON.stringify(r.engine.profile), 'engine.law=', r.engine.law && r.engine.law.id, ' result.profiles laws=', JSON.stringify(Object.fromEntries(Object.entries(r.profiles || {}).map(([k, v]) => [k, v.law && v.law.id]))));
}
