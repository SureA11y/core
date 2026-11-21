const F = '/tmp/surea11y-audit/scratch/family/';
const P = require('/home/user/core-r8/src/pack.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const d = P.describePacks(ps);
for (const x of d) console.log(x.name, 'profiles', JSON.stringify(x.profiles || (x.standard && x.standard.profiles)).slice(0, 400), 'laws', JSON.stringify(x.laws).slice(0, 200));
console.log(Object.keys(d[0]));
