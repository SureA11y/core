const { sd, base, pack } = require('./lib.js');
const st = sd.standardFromData(base());
for (const core of ['~1.17.0', '^1.17.0', '1.17.x', '1.17', '~1.17', '=1.17.0', '1.17.0', '>=1.17.0 <1.18.0', '>=1.17.0 <=1.18.0', '~1.17.0 || ~1.18.0', '~1.17.0 || ^2.0.0', '1.17.0 - 1.18.0', '1.17.0 - 1.17.9', '>=1.16.0 <1.18.0', '~1.16.0', '*', '', 'garbage', '^1.17.0-beta', '~1.17.0-0']) {
  const p = { name: 'p', version: '1.0.0', namespace: 'base', core, standard: st };
  const probs = pack.checkPack(p);
  console.log(JSON.stringify(core).padEnd(24), probs.length ? probs.map((x) => x.slice(0, 190)).join(' || ') : '(no problems)');
}
