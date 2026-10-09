'use strict';
// What naming a pack costs each scan in a page: the catalog is rebuilt from
// the registered entry on every call (packCatalog copies every locale's
// dictionary). One cheap rule, 50 scans, with and without a pack named.
const path = require('path');
const L = require('./lib');
const { packScript } = L.packApi;
const sample = require(path.join(L.ROOT, 'tests/fixtures/packs/sample.js'));
const P = L.pack({ name: 'o', namespace: 'o', rules: [L.rule('o-a', () => ({ outcome: 'pass' }))] });
(async () => {
  await L.withBrowser(async (b) => {
    const { page, context } = await L.openPage(b);
    await page.addScriptTag({ content: L.BUNDLE });
    await page.addScriptTag({ content: packScript([P]) });
    await page.addScriptTag({ content: packScript([sample]) });
    const t = (packs) => page.evaluate((packs) => {
      const run = () => window.a11ycore.runa11yCoreInPage(null, null, packs ? { packs } : {}, ['page-title-present']);
      for (let i = 0; i < 5; i++) run();
      const t0 = performance.now();
      for (let i = 0; i < 50; i++) run();
      return +((performance.now() - t0) / 50).toFixed(2);
    }, packs);
    L.log('ms per scan, runOnly page-title-present', { noPack: await t(null), smallPack: await t(['o@1.0.0']), samplePack: await t(['sample-pack@1.0.0']), noPackAgain: await t(null) });
    const size = await page.evaluate(() => JSON.stringify(window.__surea11yPacks).length);
    L.log('registry size (chars, JSON of data)', { size, scriptChars: packScript([P]).length });
    await context.close();
  });
})();
