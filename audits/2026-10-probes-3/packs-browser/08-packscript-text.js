'use strict';
// What packScript writes as text: a pack name or version with a line break
// ends the leading comment and becomes code; a rule's source with
// "</script>" ends an inline <script> that holds the bundle; rules written
// in forms functionExpression may not read back.
const L = require('./lib');
const { packScript, buildBrowserBundle } = L.packApi;
const ok = (id) => L.rule(id, () => ({ outcome: 'pass' }));

(async () => {
  await L.withBrowser(async (b) => {
    // a) names and versions that end the comment
    for (const [label, over] of [
      ['name with \\n', { name: 'x\nwindow.__injected = "name";//' }],
      ['name with U+2028', { name: 'x\u2028window.__injected = "u2028";//' }],
      ['version with \\n (prefix-only version check)', { version: '1.0.0\nwindow.__injected = "version";//' }]
    ]) {
      let script;
      try {
        script = packScript([L.pack({ namespace: 'x', rules: [ok('x-a')], ...over })]);
      } catch (e) {
        L.log('a) ' + label, { packScriptThrows: e.message.slice(0, 200) });
        continue;
      }
      const { page, context, logs } = await L.openPage(b);
      await page.addScriptTag({ content: L.BUNDLE });
      const err = await page.addScriptTag({ content: script }).then(() => null, (e) => e.message.split('\n')[0]);
      const injected = await page.evaluate(() => window.__injected || null);
      L.log('a) ' + label, { firstLines: script.split(/\n|\u2028/).slice(0, 3).map((l) => l.slice(0, 90)), injectError: err, injected, logs });
      await context.close();
    }

    // b) "</script>" in a rule's source, bundle inlined into an HTML page
    const p = L.pack({ name: 'inl', namespace: 'inl', rules: [L.rule('inl-a', () => ({ outcome: 'cantTell', occurrences: [], note: '</script><script>window.__injected="inline"</script>' }))] });
    const bundle = buildBrowserBundle({ packs: [p] });
    const html = `<!doctype html><html lang="en"><head><title>t</title><script>${bundle}</script></head><body><main><p>x</p></main></body></html>`;
    const { page, context, logs } = await L.openPage(b, { html });
    const state = await page.evaluate(() => ({ a11ycore: typeof window.a11ycore, registry: Object.keys(window.__surea11yPacks || {}), injected: window.__injected || null }));
    L.log('b) bundle with a pack inlined in <script>, rule source holds "</script>"', { ...state, logs: logs.slice(0, 3).map((l) => l.slice(0, 160)) });
    await context.close();

    // c) function forms
    const forms = {
      'arrow with default param calling a function': new Function('return (ctx = String()) => ({ outcome: "pass" })')(),
      'arrow with parenthesised comment': new Function('return (ctx /* ) */) => ({ outcome: "pass" })')(),
      'bound function': function (ctx) { return { outcome: 'pass' }; }.bind(null),
      'method with computed key': { ['run' + 'InPage'](ctx) { return { outcome: 'pass' }; } }.runInPage,
      'getter-defined method object': { runInPage(ctx) { return { outcome: 'pass' }; } }.runInPage,
      'async arrow (single param)': async (ctx) => ({ outcome: 'pass' }),
      'class static method': class { static runInPage(ctx) { return { outcome: 'pass' }; } }.runInPage,
      'method using super': Object.setPrototypeOf({ runInPage(ctx) { return super.toString ? { outcome: 'pass' } : null; } }, {}).runInPage,
      'generator method': { *runInPage(ctx) { yield 1; } }.runInPage,
      'native function': Math.max
    };
    for (const [label, fn] of Object.entries(forms)) {
      let script;
      try {
        script = packScript([L.pack({ name: 'fx', namespace: 'fx', rules: [{ id: 'fx-a', meta: { title: 'a', tags: [] }, runInPage: fn }] })]);
      } catch (e) {
        L.log('c) ' + label, { packScriptThrows: e.message.slice(0, 160) });
        continue;
      }
      const { page: pg, context: cx } = await L.openPage(b);
      await pg.addScriptTag({ content: L.BUNDLE });
      const err = await pg.addScriptTag({ content: script }).then(() => null, (e) => e.message.split('\n')[0].slice(0, 160));
      const r = err ? null : await L.scanInPage(pg, ['fx@1.0.0'], {}, ['fx-a']).catch((e) => ({ error: e.message.split('\n')[0] }));
      const c = r && r.checksResults && r.checksResults.find((x) => x.ruleId === 'fx-a');
      const line = script.split('\n').find((l) => l.includes('"fx-a": {'));
      L.log('c) ' + label, { written: line && line.trim().slice(0, 140), injectError: err, outcome: c && c.outcome, error: (c && c.error) || (r && r.error) });
      await cx.close();
    }
  });
})();
