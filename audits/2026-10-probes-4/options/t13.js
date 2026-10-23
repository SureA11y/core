const semver = require('/home/user/core/node_modules/semver');
const { satisfiesRange } = require('/home/user/core/src/pack.js');
const ranges = ['1.x.3', '1.*.*', '1.2.x', '^1.x', '~1.x', '>=1.x', '<=1.11', '>1.11', '<1.12', '=1.11.1', 'v1.11.1', '=v1.11.1', '~> 1.11', '^ 1.11.0', '>= 1.11.0 < 2', '1.11.1 - 1.11.1', '1.11 - 1', '* || 2.0.0', '^0.0.0', '^1.11.1-0', '>1.11.1-rc.1', '1.11.1+build', '^1.11.0+b.1 || 3', '>=1.11.0 <=1.11.1-rc', '1.11.1 1.11.1', 'X', 'x.x.x', '', ' ', '||', '<0.0.0-0', '>=1.11.1-0 <1.11.2', '^01.11.0', '1.11.01', '>=1.11.0\t<2', '>=1.11.0\n<2', '~1', '~1.11.1-beta', '^1.11.1-beta.01', '>=1.0.0 - 2', '1.0.0 -2.0.0', '1.0.0- 2.0.0', '>=1.0.0-', '1.11.1.0', '=*', '>*', '<*', '<=*', '~*', '^*', '>x', '<1.x', '>=1.11.1 || <x'];
const versions = ['1.11.1', '1.11.1-rc.1', '1.11.0', '2.0.0', '0.0.1', '1.11.2-0'];
let diffs = 0;
for (const r of ranges) for (const v of versions) {
  let n; try { n = semver.validRange(r) === null ? null : semver.satisfies(v, r); } catch { n = 'throw'; }
  let c; try { c = satisfiesRange(v, r); } catch (e) { c = 'throw ' + e.message; }
  if (n !== c) { diffs++; console.log(JSON.stringify(r), v, 'npm=', n, 'core=', c, 'validRange=', semver.validRange(r)); }
}
console.log('diffs', diffs, 'semver', require('/home/user/core/node_modules/semver/package.json').version);
