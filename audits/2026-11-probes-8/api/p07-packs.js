const F = '/tmp/surea11y-audit/scratch/family/';
const P = require('/home/user/core-r8/src/pack.js');
const core = require('/home/user/core-r8/package.json');
console.log('core version', core.version);
const packs = {};
for (const n of ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria']) {
  try { const m = require(F + n); packs[n] = m.default || m.pack || m; } catch (e) { console.log(n, 'require THROW', e.message.slice(0, 200)); }
}
for (const [n, p] of Object.entries(packs)) {
  console.log('==', n, typeof p, Object.keys(p).slice(0, 15).join(','));
  try { const c = P.checkPack(p); console.log('  checkPack', JSON.stringify(c).slice(0, 600)); } catch (e) { console.log('  checkPack THROW', e.message.slice(0, 200)); }
}
try { const d = P.describePacks(Object.values(packs)); console.log('describe', JSON.stringify(d).slice(0, 800)); } catch (e) { console.log('describe THROW', e.message); }
