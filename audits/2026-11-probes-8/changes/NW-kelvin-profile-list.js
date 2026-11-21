// ASCII-only case folding: a profile named with the Kelvin sign (U+212A) instead of "k".
// Single profile vs the same name in a list of profiles (profileNamesOf in src/core/multi-profile.js still uses toLowerCase()).
const pack = require('./keyspack.js')();
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><div role="grid"><div role="row"><div role="gridcell">1</div></div></div></main></body></html>';
const kelvin = 'Keys-1.0';
for (const [label, profile] of [['ascii single', 'keys-1.0'], ['Kelvin single', kelvin], ['Kelvin in list', [kelvin, 'wcag22-aa']], ['Kelvin single strict', kelvin]]) {
  const warns = []; const w = console.warn; console.warn = (m) => warns.push(String(m).slice(0, 100));
  let out;
  try {
    const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile, ...(label.includes('strict') ? { strictOptions: true } : {}) } });
    out = 'engine.profile=' + JSON.stringify(r.engine.profile) + ' profiles=' + JSON.stringify(r.engine.profiles && Object.keys(r.engine.profiles)) + ' keys rollups=' + r.rulesResults.filter(x => x.ruleId.startsWith('keys-')).length + ' notRun=' + JSON.stringify(r.engine.profilesNotRun || null);
  } catch (e) { out = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 80); }
  console.warn = w;
  console.log(label.padEnd(22), out, warns.length ? '| warns: ' + warns.join(' / ') : '');
}
