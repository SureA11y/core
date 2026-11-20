const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const html = require('./page.js');
const tick = () => new Promise(r => setImmediate(r));
const rank = { fail: 3, cantTell: 2, pass: 1, notApplicable: 0 };
(async () => {
  const lists = [['wcag22-aa','wcag22-aa'],['WCAG22-AA','wcag22-aa'],[],['wcag22-aa'],['wcag22-aa', 42],['wcag22-aa','nope'],['nope'],['wcag22-aa',''],['en301549-v3.2.1','wcag20-aa'], 'wcag22-aa,sample-1.0'];
  for (const list of lists) {
    let r; try { r = await runa11yCoreOnHtml(html, { engineOptions: { profile: list, packs: [sample] } }); } catch (e) { console.log(JSON.stringify(list), 'THROWS', e.code, e.message.slice(0,200)); continue; }
    await tick();
    const bad = [];
    for (const c of r.checksResults) {
      if (c.verdicts) {
        const w = Object.values(c.verdicts).sort((a,b)=>rank[b]-rank[a])[0];
        if (w !== c.outcome) bad.push(c.ruleId+' outcome '+c.outcome+' worst '+w);
        for (const o of c.occurrences) if (o.verdicts) {
          const ow = Object.values(o.verdicts).sort((a,b)=>rank[b]-rank[a])[0];
          const eff = o.occurrenceOutcome || c.outcome;
          if (ow !== eff && !(ow==='notApplicable')) bad.push(c.ruleId+' occ '+eff+' worst '+ow+' '+JSON.stringify(o.verdicts));
        }
      }
    }
    console.log(JSON.stringify(list), 'profile', r.engine.profile, 'profiles', JSON.stringify(r.engine.profiles), 'notRun', JSON.stringify(r.engine.profilesNotRun), 'sections', r.profiles?Object.keys(r.profiles):'-', 'bad', bad.length, bad.slice(0,4));
  }
})();
