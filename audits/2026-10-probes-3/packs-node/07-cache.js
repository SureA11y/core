'use strict';
// The engine cache is keyed by pack object identity. Mutating a pack after a
// scan, and string/object key collisions.
const { scan, quiet, base, rule, outcome, report, packApi } = require('./lib.js');

// 1. mutate after first scan
const p = base({ name: 'mut', namespace: 'mut', rules: [rule('mut-a', { runInPage: () => ({ outcome: 'pass' }) })] });
const first = quiet(() => scan({ packs: [p] })).r;
p.rules[0].runInPage = () => ({ outcome: 'fail' });
p.rules.push(rule('mut-b'));
p.version = '2.0.0';
const second = quiet(() => scan({ packs: [p] })).r;
report('mutated pack rescanned', { first: [first.engine.packs, outcome(first, 'mut-a'), outcome(first, 'mut-b')], second: [second.engine.packs, outcome(second, 'mut-a'), outcome(second, 'mut-b')] });

// 1b. pack made invalid after a scan
const q = base({ name: 'inv', namespace: 'inv', rules: [rule('inv-a')] });
quiet(() => scan({ packs: [q] }));
q.core = '^99.0.0';
const inv = quiet(() => scan({ packs: [q], strictOptions: true }));
report('pack made invalid after a scan, strictOptions', inv.error ? 'THROWS ' + inv.error.message : { packs: inv.r.engine.packs, skipped: inv.r.skippedPacks });

// 2. key collision: object id N vs string "N"
// Find the id the cache gave to a fresh pack: preparePacks is exported.
const victim = base({ name: 'victim', namespace: 'victim', rules: [rule('victim-a', { runInPage: () => ({ outcome: 'fail' }) })] });
const e1 = packApi.preparePacks([victim]);
let hit = null;
for (let n = 1; n < 5000 && !hit; n++) {
  const e2 = quiet(() => packApi.preparePacks([String(n)])).r;
  if (e2 === e1) hit = n;
}
report('string pack name colliding with an object id returns that object\'s engine', hit ? `yes: preparePacks(["${hit}"]) === preparePacks([victim]); engine.packs=${JSON.stringify(e1.packs)}` : 'no');
if (hit) {
  const viaScan = quiet(() => scan({ packs: [String(hit)], strictOptions: true }));
  report('scan with packs:["' + hit + '"], strictOptions', viaScan.error ? 'THROWS ' + viaScan.error.message : { packs: viaScan.r.engine.packs, victim: outcome(viaScan.r, 'victim-a'), skipped: viaScan.r.skippedPacks });
}
// 2b. null / undefined / number entries
for (const odd of [[null], [undefined], [1], [{}]]) {
  const x = quiet(() => scan({ packs: odd }));
  report('packs: ' + JSON.stringify(odd), x.error ? 'THROWS ' + x.error.message : { packs: x.r.engine.packs, skipped: x.r.skippedPacks });
}
// 3. strict vs non-strict share the cache: invalid pack first non-strict, then strict
const bad = base({ name: 'bad', namespace: 'bad', core: '^99.0.0' });
quiet(() => scan({ packs: [bad] }));
const strictAfter = quiet(() => scan({ packs: [bad], strictOptions: true }));
report('invalid pack: non-strict scan, then strict scan', strictAfter.error ? 'throws (good): ' + strictAfter.error.message : { NOT_THROWN: true, skipped: strictAfter.r.skippedPacks });
