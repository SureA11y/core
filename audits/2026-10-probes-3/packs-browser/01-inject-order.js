'use strict';
// Injection order, the same pack twice, two versions, packs in separate
// scripts, the order of names, repeated scans, odd names.
const L = require('./lib');
const { packScript } = L.packApi;

const A = (version = '1.0.0', title = 'A rule') =>
  L.pack({ name: '@a/pack', version, namespace: 'a', rules: [L.rule('a-one', new Function('return (ctx) => ({ outcome: "fail", occurrences: [{ __node: ctx.document.body, summary: "v' + version + '" }] })')(), { title })] });
const B = L.pack({ name: '@b/pack', version: '1.0.0', namespace: 'b', rules: [L.rule('b-one', () => ({ outcome: 'pass' }))] });

(async () => {
  await L.withBrowser(async (browser) => {
    const run = async (label, setup, names, extra) => {
      const { page, logs } = await L.openPage(browser);
      try {
        await setup(page);
        const { runOnly, ...eo } = extra || {};
        const r = await L.scanInPage(page, names, eo, runOnly || null);
        L.log(label, {
          packs: r.engine && r.engine.packs,
          aOne: L.outcome(r, 'a-one'), aErr: (r.checksResults.find((c) => c.ruleId === 'a-one') || {}).error,
          aSummary: (r.checksResults.find((c) => c.ruleId === 'a-one') || { occurrences: [] }).occurrences.map((o) => o.summary),
          bOne: L.outcome(r, 'b-one'),
          logs
        });
      } catch (e) {
        L.log(label, { error: e.message.split('\n')[0], logs });
      }
      await page.context().close();
    };
    const add = (page, content) => page.addScriptTag({ content });
    const ro = {};

    await run('a) bundle then pack', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); }, ['@a/pack@1.0.0'], ro);
    await run('b) pack then bundle', async (p) => { await add(p, packScript([A()])); await add(p, L.BUNDLE); }, ['@a/pack@1.0.0'], ro);
    await run('c) same pack twice', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); await add(p, packScript([A()])); }, ['@a/pack@1.0.0'], ro);
    await run('d1) v1 and v2 registered, name v1', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A('1.0.0')])); await add(p, packScript([A('2.0.0')])); }, ['@a/pack@1.0.0'], ro);
    await run('d2) v1 and v2 registered, name v2', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A('1.0.0')])); await add(p, packScript([A('2.0.0')])); }, ['@a/pack@2.0.0'], ro);
    await run('d3) v1 and v2 registered, name both', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A('1.0.0')])); await add(p, packScript([A('2.0.0')])); }, ['@a/pack@1.0.0', '@a/pack@2.0.0'], ro);
    await run('d4) name without version', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); }, ['@a/pack'], ro);
    await run('e) A and B in separate scripts, name both', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); await add(p, packScript([B])); }, ['@a/pack@1.0.0', '@b/pack@1.0.0'], ro);
    await run('f1) packScript([A,B]), name [B,A]', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A(), B])); }, ['@b/pack@1.0.0', '@a/pack@1.0.0'], ro);
    await run('f2) packScript([A,B]), name only A', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A(), B])); }, ['@a/pack@1.0.0'], ro);
    await run('f3) name A twice', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); }, ['@a/pack@1.0.0', '@a/pack@1.0.0'], ro);
    await run('f4) strict, A and B separate, name both', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); await add(p, packScript([B])); }, ['@a/pack@1.0.0', '@b/pack@1.0.0'], { ...ro, strictOptions: true });
    for (const odd of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      await run(`g) name "${odd}"`, async (p) => { await add(p, L.BUNDLE); }, [odd], {});
      await run(`g) name "${odd}" with a pack registered`, async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); }, [odd], {});
    }
    await run('h) packs mixes a name and an object', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); }, ['@a/pack@1.0.0', { name: 'x' }], ro);
    await run('i) packs: [] (empty), with registry', async (p) => { await add(p, L.BUNDLE); await add(p, packScript([A()])); }, [], ro);

    // Repeated scans: window keys and registry size.
    const { page } = await L.openPage(browser);
    await add(page, L.BUNDLE);
    const before = await page.evaluate(() => Object.getOwnPropertyNames(window).length);
    await add(page, packScript([A()]));
    const afterReg = await page.evaluate(() => Object.getOwnPropertyNames(window).length);
    for (let i = 0; i < 30; i++) await L.scanInPage(page, ['@a/pack@1.0.0'], {}, null);
    const after = await page.evaluate(() => ({ keys: Object.getOwnPropertyNames(window).length, newKeys: Object.getOwnPropertyNames(window).slice(-5), reg: Object.keys(globalThis.__surea11yPacks), heap: performance.memory && performance.memory.usedJSHeapSize }));
    for (let i = 0; i < 30; i++) await add(page, packScript([A()]));
    const reinjected = await page.evaluate(() => ({ keys: Object.getOwnPropertyNames(window).length, reg: Object.keys(globalThis.__surea11yPacks) }));
    L.log('j) window keys: bundle, +pack, +30 scans, +30 reinjections', { before, afterReg, after, reinjected });
    // Does a scan mutate the registered entry (a later scan sees a changed catalog)?
    const snap1 = await page.evaluate(() => JSON.stringify(globalThis.__surea11yPacks['@a/pack@1.0.0'].checkDefs.length));
    await L.scanInPage(page, ['@a/pack@1.0.0'], { locale: 'fr' });
    const snap2 = await page.evaluate(() => JSON.stringify(globalThis.__surea11yPacks['@a/pack@1.0.0'].checkDefs.length));
    L.log('k) registry entry unchanged by a scan', { snap1, snap2 });
    await page.context().close();
  });
})();
