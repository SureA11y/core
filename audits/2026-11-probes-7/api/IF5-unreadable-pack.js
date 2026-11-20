// A pack whose field can't be read (throwing getter / Proxy trap): checkPack, describePacks,
// the scan and the catalog all throw the pack's own error instead of listing a problem / skipping it.
const P = require('/home/user/core/src/pack.js');
const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const pack = { name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '>=1.10.0' };
Object.defineProperty(pack, 'rules', { enumerable: true, get() { throw new Error('boom'); } });
for (const [n, f] of [['checkPack', () => P.checkPack(pack)], ['describePacks', () => P.describePacks([pack])],
  ['scan', () => runa11yCoreOnHtml('<html lang=en><title>t</title><main>x</main></html>', { engineOptions: { packs: [pack] } }).skippedPacks],
  ['getChecksCatalog', () => core.getChecksCatalog({ packs: [pack] }).length]]) {
  try { console.log(n, 'returned', JSON.stringify(f())); } catch (e) { console.log(n, 'THROWS', e.message); }
}
