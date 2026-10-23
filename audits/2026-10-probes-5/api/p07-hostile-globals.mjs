// Console helpers and the scan on pages that patch globals the way real libraries do.
import { launch, open } from './h.mjs';
const page0 = '<!doctype html><html lang=en><title>t</title><main><h1>x</h1><img src="data:,"><button></button></main>';
const patches = {
  none: '',
  consoleTableMissing: 'console.table = undefined;',
  consoleTableThrows: 'console.table = function(){ throw new Error("nope"); };',
  objectProtoEnumerable: 'Object.prototype.extend = function(){};',
  arrayProtoEnumerable: 'Array.prototype.each = function(){};',
  prototypeJsToJSON: 'Array.prototype.toJSON = function(){ return "ARR"; }; String.prototype.toJSON = function(){ return "S"; };',
  jsonStringifyBroken: 'JSON.stringify = function(){ return "{}"; };',
  attachShadowForcedClosed: 'const o = Element.prototype.attachShadow; Element.prototype.attachShadow = function(i){ return o.call(this, Object.assign({}, i, {mode:"closed"})); };',
  mapReplaced: 'window.Map = function(){ this.get=function(){}; this.set=function(){}; this.forEach=function(){}; };',
  htmlTransform: 'document.documentElement.style.transform = "translateX(100px)";',
  arrayFromPrototype15: 'Array.from = function(it){ var r=[]; for (var i=0;i<(it.length||0);i++) r.push(it[i]); return r; };',
  promiseReplaced: 'window.Promise = (function(P){ function Z(e){ return new P(e); } Z.resolve=P.resolve.bind(P); Z.reject=P.reject.bind(P); Z.all=P.all.bind(P); Z.prototype=P.prototype; return Z; })(Promise);'
};
const b = await launch();
for (const [k, js] of Object.entries(patches)) {
  const { page, ctx } = await open(b, page0, { initScript: js });
  const r = await page.evaluate(async () => {
    const out = {};
    const t = async (n, f) => { try { out[n] = await f(); } catch (e) { out[n] = 'THROW ' + e.message.slice(0, 100); } };
    let res;
    await t('run', async () => { res = await a11ycore.run(); return res.checksResults.filter((c) => c.outcome === 'fail').map((c) => c.ruleId).join(','); });
    await t('table', () => a11ycore.table(res).length);
    await t('highlight', () => { const n = a11ycore.highlight(res); const h = document.querySelector('[data-surea11y-highlights]'); const box = h && h.shadowRoot && h.shadowRoot.querySelector('.box'); return n + ' boxes; root=' + !!(h && h.shadowRoot) + (box ? ' box@' + box.getBoundingClientRect().left : ''); });
    await t('clear', () => { a11ycore.clearHighlights(); return document.querySelectorAll('[data-surea11y-highlights]').length; });
    await t('inspect', async () => (await a11ycore.inspect('headings')).length);
    await t('strict', async () => (await a11ycore.run({ strictOptions: true })).checksResults.length);
    return out;
  });
  console.log(k.padEnd(26), JSON.stringify(r));
  await ctx.close();
}
await b.close();
