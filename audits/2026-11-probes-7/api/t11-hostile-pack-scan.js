const P = require('/home/user/core/src/pack.js');
const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const base = () => ({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '>=1.10.0', rules: [{ id: 'acme-r', meta: { title: 'R', description: 'd', tags: ['acme','wcag111','wcag2a'], wcagSc: ['1.1.1'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } }] });
const g = base(); Object.defineProperty(g, 'rules', { get() { throw new Error('boom'); }, enumerable: true });
const px = new Proxy(base(), { ownKeys() { throw new Error('ownKeys boom'); } });
(async () => {
  for (const [n, p] of [['getter', g], ['proxy', px]]) {
    try { console.log(n, 'checkPack', JSON.stringify(P.checkPack(p))); } catch (e) { console.log(n, 'checkPack THROWS', e.message); }
    try { const d = P.describePacks([p]); console.log(n, 'describePacks', JSON.stringify(d).slice(0,200)); } catch (e) { console.log(n, 'describePacks THROWS', e.message); }
    try { const r = await runa11yCoreOnHtml('<html lang=en><title>t</title><main>x</main></html>', { engineOptions: { packs: [p] } }); console.log(n, 'scan ok skippedPacks', JSON.stringify(r.skippedPacks)); } catch (e) { console.log(n, 'scan THROWS', e.message); }
    try { const c = core.getChecksCatalog({ packs: [p] }); console.log(n, 'catalog ok', c.length); } catch (e) { console.log(n, 'catalog THROWS', e.message); }
  }
})();
