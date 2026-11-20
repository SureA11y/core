const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const html = require('./page.js');
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  const sets = [['wcag22-aa','sample-1.0'],['wcag21-aa','wcag22-aa'],['en301549-v3.2.1','en301549-v4.1.1'],['wcag20-a','wcag22-aaa','sample-2.0']];
  for (const list of sets) {
    const multi = await runa11yCoreOnHtml(html, { engineOptions: { profile: list, packs: [sample] } }); await tick();
    for (const p of list) {
      const single = await runa11yCoreOnHtml(html, { engineOptions: { profile: p, packs: [sample] } }); await tick();
      const sec = multi.profiles && multi.profiles[p];
      if (!sec) { console.log(list, p, 'no section', multi.engine.profilesNotRun); continue; }
      const sRoll = Object.fromEntries(single.rulesResults.map(x => [x.ruleId, x.outcome]));
      const mRoll = sec.rulesResults;
      const diffs = [];
      for (const k of new Set([...Object.keys(sRoll), ...Object.keys(mRoll)])) if (sRoll[k] !== mRoll[k]) diffs.push(k+':'+sRoll[k]+'/'+mRoll[k]);
      // check-level verdicts
      const cd = [];
      for (const c of single.checksResults) {
        const m = multi.checksResults.find(x => x.ruleId === c.ruleId);
        if (!m) { cd.push(c.ruleId+':missing'); continue; }
        const v = m.verdicts ? m.verdicts[p] : m.outcome;
        if (v !== c.outcome) cd.push(c.ruleId+':'+c.outcome+'/'+v);
        // occurrences
        if (c.occurrences.length !== m.occurrences.length) cd.push(c.ruleId+':occ '+c.occurrences.length+'/'+m.occurrences.length);
      }
      console.log(list.join('+'), p, 'rollup diffs', diffs.length, diffs.slice(0,5), 'check diffs', cd.length, cd.slice(0,8), 'wcagV', sec.wcagVersion, single.engine.wcagVersion||'');
    }
    console.log('  profilesNotRun', JSON.stringify(multi.engine.profilesNotRun), 'profile', multi.engine.profile);
  }
})();
