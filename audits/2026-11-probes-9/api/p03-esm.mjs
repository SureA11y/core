const pkg = (await import('@surea11y/core/package.json', {with:{type:'json'}})).default;
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
for (const k of Object.keys(pkg.exports)) {
  if (k.includes('*') || k.endsWith('.json')) continue;
  const spec = '@surea11y/core' + k.slice(1);
  try {
    const esm = await import(spec);
    const cjs = require(spec);
    const named = Object.keys(esm).filter(n=>n!=='default');
    const miss = Object.keys(cjs).filter(n=>!named.includes(n));
    console.log(spec, 'esm named:', named.length, 'cjs keys:', Object.keys(cjs).length, miss.length? 'MISSING named: '+miss.join(','):'');
  } catch(e) { console.log(spec, 'ERR', e.message.slice(0,200)); }
}
for (const s of ['@surea11y/core/i18n/de','@surea11y/core/i18n/xx','@surea11y/core/review/de','@surea11y/core/review/en','@surea11y/core/procedures/de','@surea11y/core/procedures/en','@surea11y/core/schemas/standard.schema.json']) {
  try { const m = await import(s, s.includes('review')||s.includes('procedures/')||s.endsWith('json')?{with:{type:'json'}}:undefined); console.log(s, 'ok', Object.keys(m.default||m).length); } catch(e){ console.log(s,'ERR',e.code, e.message.slice(0,150)); }
  try { const m = require(s); console.log(' cjs', s, 'ok', typeof m, Object.keys(m).length); } catch(e){ console.log(' cjs',s,'ERR',e.code); }
}
