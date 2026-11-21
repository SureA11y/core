const F = '/tmp/surea11y-audit/scratch/family/';
const P = require('/home/user/core-r8/src/pack.js');
const rgaa = require(F + 'pack-rgaa'), raweb = require(F + 'pack-raweb');
for (const [pk, id] of [[rgaa, 'fr-article-47'], [raweb, 'lu-loi-2019-05-28']]) {
  for (const loc of [undefined, 'fr', 'FR', 'fr-FR', 'en', 'de', 'ja', '__proto__', 'constructor', '', 5, null]) {
    let x; try { x = P.lawOf(pk.standard, id, loc); x = x ? x.lang + ' | ' + x.name.slice(0, 50) : x; } catch (e) { x = 'THROW ' + e.message.slice(0, 80); }
    console.log(id, JSON.stringify(loc), x);
  }
}
for (const args of [[null, 'x'], [{}, 'x'], [rgaa.standard, '__proto__'], [rgaa.standard, 'FR-ARTICLE-47'], [rgaa.standard, 'constructor'], [rgaa.standard, 'toString'], [rgaa.standard], [new Proxy({}, { get() { throw new Error('p'); } }), 'x']]) {
  let x; try { x = JSON.stringify(P.lawOf(...args)); } catch (e) { x = 'THROW ' + e.message.slice(0, 80); }
  console.log('args', String(args[1]), x && x.slice(0, 100));
}
