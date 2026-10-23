'use strict';
// Packs and frames: a same-origin frame, a cross-origin frame, srcdoc;
// packScript injected into the top frame only vs every frame; the
// browser bundle has no cross-frame runner (a11ycore exposes runa11yCoreInPage only).
const L = require('./lib');
const { packScript } = L.packApi;
const P = L.pack({ name: '@f/pack', version: '1.0.0', namespace: 'f', rules: [L.rule('f-one', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, summary: 'in ' + ctx.document.location.href }] }))] });
const SCRIPT = packScript([P]);
const NAMES = ['@f/pack@1.0.0'];
const CHILD = '<!doctype html><html lang="en"><head><title>child</title></head><body><main><p>child</p></main></body></html>';
const TOP = '<!doctype html><html lang="en"><head><title>top</title></head><body><main><p>top</p>' +
  '<iframe id="same" title="same" src="https://example.test/child"></iframe>' +
  '<iframe id="cross" title="cross" src="https://other.test/child"></iframe>' +
  '<iframe id="srcdoc" title="srcdoc" srcdoc="<p>srcdoc</p>"></iframe></main></body></html>';
const routes = { 'https://example.test/child': { body: CHILD }, 'https://other.test/child': { body: CHILD } };

const summarize = (r) => r && r.checksResults ? { packs: r.engine && r.engine.packs, fOne: L.outcome(r, 'f-one'), url: r.url } : r;
function walk(node, out = [], path = 'top') {
  if (!node) return out;
  out.push({ path, error: node.error, ...summarize(node.topFrame) });
  (node.frames || []).forEach((f, i) => walk(f, out, path + '>' + (f.selector || i)));
  return out;
}

(async () => {
  await L.withBrowser(async (b) => {
    // a) everything everywhere
    {
      const { page, context, logs } = await L.openPage(b, { html: TOP, routes });
      await page.waitForLoadState('load');
      const frames = page.frames();
      for (const f of frames) {
        await f.addScriptTag({ content: L.BUNDLE }).catch((e) => logs.push('bundle ' + f.url() + ' ' + e.message.split('\n')[0]));
        await f.addScriptTag({ content: SCRIPT }).catch((e) => logs.push('pack ' + f.url() + ' ' + e.message.split('\n')[0]));
      }
      const per = [];
      for (const f of frames) per.push({ frame: f.url(), ...(await L.scanInPage(f, NAMES).then(summarize, (e) => ({ error: e.message.split('\n')[0] }))) });
      L.log('a) bundle+pack in every frame, scan each frame', { per, logs: logs.filter((l) => !/Failed to load/.test(l)) });
      await context.close();
    }
    // b) pack script only in the top frame
    {
      const { page, context, logs } = await L.openPage(b, { html: TOP, routes });
      await page.waitForLoadState('load');
      const frames = page.frames();
      for (const f of frames) await f.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: SCRIPT });
      const per = [];
      for (const f of frames) per.push({ frame: f.url(), ...(await L.scanInPage(f, NAMES).then(summarize, (e) => ({ error: e.message.split('\n')[0] }))) });
      L.log('b) pack script only in the top frame, scan each frame', { per, logs: logs.filter((l) => !/Failed to load/.test(l)) });
      await context.close();
    }
  });
})();
