// A pack object passed without definePack, changed between two scans.
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const pack = { name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '*', rules: [{ id: 'acme-r', meta: { title: 'T', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: function () { return { outcome: 'pass', occurrences: [] }; } }] };
const html = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';
(async () => {
  console.warn = (...a) => console.log('  warn', String(a[0]).slice(0, 160));
  const a = await runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: ['acme-r'] });
  console.log('scan 1', a.checksResults.map(c => c.ruleId + ':' + c.outcome).join(','), 'frozen?', Object.isFrozen(pack), Object.isFrozen(pack.rules));
  try { pack.rules[0].runInPage = function () { return { outcome: 'fail', occurrences: [{ selector: 'p' }] }; }; console.log('mutated runInPage'); } catch (e) { console.log('mutate THROW', e.message.slice(0, 100)); }
  try { pack.rules.push({ id: 'acme-s', meta: { title: 'S', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: function () { return { outcome: 'fail', occurrences: [{ selector: 'p' }] }; } }); console.log('pushed rule'); } catch (e) { console.log('push THROW', e.message.slice(0, 100)); }
  let b; try { b = await runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: ['acme-r', 'acme-s'] }); console.log('scan 2', b.checksResults.map(c => c.ruleId + ':' + c.outcome).join(',')); } catch (e) { console.log('scan 2 THROW', e.code, e.message.slice(0, 200)); }
  try { console.log('catalog', core.getChecksForRunOnly(['acme-r', 'acme-s'], { packs: [pack] }).map(c => c.ruleId)); } catch (e) { console.log('catalog THROW', e.message.slice(0, 120)); }
})();
;(async () => {
  await new Promise(r => setTimeout(r, 50));
  const c = await runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: ['acme-r'] });
  console.log('scan 3 (acme-r only, runInPage now returns fail):', c.checksResults.map(c => c.ruleId + ':' + c.outcome).join(','));
})();
