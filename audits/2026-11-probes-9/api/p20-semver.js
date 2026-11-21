const semver = require('/home/user/core-r9/node_modules/semver');
const { satisfiesRange } = require('@surea11y/core/pack');
const versions = ['1.17.0','1.17.1','1.18.0-rc.1','1.18.0','2.0.0','2.0.0-alpha','1.11.0','1.11.5','1.10.9','0.9.0','1.17.0-beta.2','1.0.0','1.2.3','1.2.4','0.2.3','0.0.3','0.0.4', '1.17.0+build.5'];
const ranges = ['^1.11.0','~1.17.0','1.x','1.X','1.*','*','x','>=1.11 <2','1.11.0 - 2.x','1.11 - 2','^1.11.0 || ^2.0.0','~1.11','~1','^0.2.3','^0.0.3','^1.18.0-rc.0','>1.17.0','<=1.17','=1.17.0','v1.17.0','1.17','^1','>=1.17.0-0','1.17.0 - 1.18.0-rc.5','^1.x','~1.17.x','>= 1.11.0','^ 1.11.0','>=1.11.0 <=1.17.0 || 2','1.2.3 - 1.2', '<1.18.0', '<2.0.0', '<1.18', '~1.17.0-beta.1', '^1.17.0-beta.1', '1.17.0 || 1.18.0-rc.1', '>1.2', '<=1.2', '~>1.2', '>=1.2.x', ''];
let diffs = 0;
for (const r of ranges) for (const v of versions) {
  let a; try { a = satisfiesRange(v, r); } catch(e) { a = 'THROW:'+e.message.slice(0,50); }
  let b; try { b = semver.validRange(r) === null ? null : semver.satisfies(v, r); } catch(e) { b = 'THROW'; }
  if (a !== b) { diffs++; console.log(JSON.stringify(r).padEnd(30), v.padEnd(16), 'core=', a, 'npm=', b); }
}
console.log('diffs', diffs);
