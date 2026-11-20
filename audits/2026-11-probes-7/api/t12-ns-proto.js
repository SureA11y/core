const P = require('/home/user/core/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
(async () => {
  for (const ns of ['constructor', 'tostring', 'hasownproperty', 'valueof', 'prototype']) {
    const pack = { name: ns + '-pack', version: '1.0.0', namespace: ns, core: '>=1.10.0',
      rules: [{ id: ns + '-r', meta: { title: 'R', description: 'd', tags: [ns, 'wcag111', 'wcag2a'], wcagSc: ['1.1.1'] }, runInPage(ctx) { const i = ctx.document.querySelector('img'); return { outcome: 'fail', occurrences: [{ __node: i, summary: 's', hint: 'h', data: { details: { reasonCode: 'X' } } }] }; } }],
      profiles: { [ns + '-1.0']: { tags: ['wcag2a'] } }, rollups: undefined };
    delete pack.rollups;
    let pr; try { pr = P.checkPack(pack); } catch (e) { pr = 'THROW ' + e.message; }
    try {
      const r = await runa11yCoreOnHtml('<html lang=en><title>t</title><main><img src=a></main></html>', { engineOptions: { packs: [pack], profile: [ns + '-1.0', 'wcag22-aa'] } });
      const c = r.checksResults.find(x => x.ruleId === ns + '-r');
      console.log(ns, 'check', JSON.stringify(pr), 'skipped', JSON.stringify(r.skippedPacks), 'rule', c && c.outcome, JSON.stringify(c && c.verdicts), 'profiles', JSON.stringify(r.engine.profiles), JSON.stringify(r.engine.profilesNotRun));
    } catch (e) { console.log(ns, 'scan THROWS', e.message.slice(0, 200)); }
    await new Promise(r => setImmediate(r));
  }
})();
