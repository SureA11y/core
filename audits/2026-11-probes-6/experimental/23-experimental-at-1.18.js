// Re-applies tests/experimental.test.js's "no release ships an experimental API on or past
// the version that settles it" logic with CORE_VERSION = 1.18.0 (and a prerelease), without bumping.
const { EXPERIMENTAL } = require('/home/user/core/src/experimental.js');
const parse = (v) => String(v).split(/[-+]/)[0].split('.').map(Number);
for (const CORE_VERSION of ['1.17.0', '1.18.0-rc.1', '1.18.0']) {
  const [MAJOR, MINOR] = parse(CORE_VERSION);
  const due = EXPERIMENTAL.filter((e) => { const [uM, um] = parse(e.until); return MAJOR > uM || (MAJOR === uM && MINOR >= um); }).map((e) => e.id);
  console.log(CORE_VERSION, due.length ? `FAILS for ${due.length}: ${due.join(' | ')}` : 'passes');
}
