// A scan of several profiles vs a scan of each alone: check outcomes and per-profile rollups.
const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const fs = require('fs');
const dir = '/home/user/core-r8/tests/fixtures/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const sets = [['wcag22-aa', 'wai-aria-1.2'], ['wcag21-aa', 'rgaa-4.1.2'], ['en301549-v3.2.1', 'wcag22-aaa'], ['raweb-1.1', 'wai-aria-1.2']];
const RANK = { fail: 0, cantTell: 1, pass: 2, notApplicable: 3 };
const start = +(process.argv[2] || 0), end = +(process.argv[3] || files.length);
(async () => {
  console.warn = () => {}; console.info = () => {};
  let n = 0, bad = 0;
  for (const f of files.slice(start, end)) {
    const html = fs.readFileSync(dir + f, 'utf8');
    for (const set of sets) {
      let multi; const singles = {};
      try {
        multi = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: set } });
        for (const p of set) singles[p] = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: p } });
      } catch (e) { console.log(f, set, 'THROW', e.message.slice(0, 100)); continue; }
      n++;
      const diffs = [];
      for (const c of multi.checksResults) {
        const outs = set.map(p => singles[p].checksResults.find(x => x.ruleId === c.ruleId)).filter(Boolean).map(x => x.outcome);
        if (!outs.length) { diffs.push('check ' + c.ruleId + ' in no single'); continue; }
        const worst = outs.sort((a, b) => RANK[a] - RANK[b])[0];
        if (worst !== c.outcome) diffs.push(`check ${c.ruleId}: multi=${c.outcome} singles=${outs}`);
      }
      for (const p of set) {
        const per = multi.profiles && multi.profiles[p];
        if (!per) { diffs.push('no profiles[' + p + ']'); continue; }
        for (const rr of singles[p].rulesResults) {
          const m = per.rulesResults[rr.ruleId];
          if (m !== rr.outcome) diffs.push(`rollup ${p}/${rr.ruleId}: multi=${m} single=${rr.outcome}`);
        }
        const extra = Object.keys(per.rulesResults).filter(k => !singles[p].rulesResults.some(r => r.ruleId === k));
        if (extra.length) diffs.push(`rollups only in multi ${p}: ${extra.slice(0, 3)}`);
      }
      if (diffs.length) { bad++; console.log(f, JSON.stringify(set), diffs.length, diffs.slice(0, 4).join(' | ')); }
    }
  }
  console.log('done', n, 'scans with differences', bad);
})();
