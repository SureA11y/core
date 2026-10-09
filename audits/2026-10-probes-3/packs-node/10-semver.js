'use strict';
// core ranges: what satisfiesRange says against this core's version and
// against hypothetical versions, compared with npm semver semantics.
const { packApi, base, report } = require('./lib.js');
const { satisfiesRange, checkPack } = packApi;
const { version } = require('../../../package.json');
const ranges = ['*', '', '   ', 'x', 'X', '1.x', '1.10.x', '^1', '^1.10', '>=1', '>=2', '>=1.0.0', '>= 1.0.0', '>=1.0.0 <2.0.0',
  '1.0.0 - 2.0.0', '^1.10.0-beta.1', '1.10.0-rc.1', '=1.10.0', 'v1.10.0', '^v1.10.0', '~1.10', '<2', '^0.0.0', '>1.10.0 || <1.0.0', '||', '^1.10.0 ||', 'latest', '1.10.0 garbage', null, 42, ['^1.0.0']];
const rows = ranges.map((r) => {
  let res;
  try { res = satisfiesRange(version, r); } catch (e) { res = 'THROWS ' + e.message; }
  const probs = checkPack(base({ core: r })).filter((p) => /core/.test(p));
  return [JSON.stringify(r), res, probs.join(' | ') || '(accepted)'];
});
console.log(`core version: ${version}`);
for (const row of rows) console.log(row[0].padEnd(22), String(row[1]).padEnd(6), row[2]);
// prerelease core versions
for (const [v, r] of [['1.11.0-rc.1', '^1.11.0'], ['1.11.0-rc.1', '>=1.11.0'], ['2.0.0-beta.1', '^1.11.0'], ['2.0.0-beta.1', '<2.0.0'], ['1.11.0', '^1.11.0-rc.1']]) {
  console.log(`satisfiesRange(${v}, ${r}) = ${satisfiesRange(v, r)}   (npm semver: ${{ '1.11.0-rc.1^1.11.0': false, '1.11.0-rc.1>=1.11.0': false, '2.0.0-beta.1^1.11.0': false, '2.0.0-beta.1<2.0.0': false, '1.11.0^1.11.0-rc.1': true }[v + r]})`);
}
// The documented example range against this core.
console.log('docs example core: "^1.11.0" ->', checkPack(base({ core: '^1.11.0' })));
