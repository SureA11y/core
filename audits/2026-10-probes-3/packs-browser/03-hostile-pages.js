'use strict';
// Pages that get in the way: patched built-ins, AMD/CommonJS globals, a
// pre-set registry, an element or frame named like the registry, strict CSP,
// Trusted Types.
const L = require('./lib');
const { packScript } = L.packApi;

const P = L.pack({
  name: '@h/pack', version: '1.0.0', namespace: 'h',
  rules: [L.rule('h-one', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, summary: 'hit' }] }))]
});
const SCRIPT = packScript([P]);
const NAMES = ['@h/pack@1.0.0'];
const page = (head, body = '') =>
  `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><img src="a.png">${body}</main></body></html>`;

async function attempt(browser, label, opts, inject = 'tag') {
  const { page: pg, logs, context } = await L.openPage(browser, opts);
  const out = { label };
  try {
    for (const [what, content] of [['bundle', L.BUNDLE], ['pack', SCRIPT]]) {
      try {
        if (inject === 'tag') await pg.addScriptTag({ content });
        else await pg.evaluate(content);
      } catch (e) {
        out[what + 'InjectError'] = e.message.split('\n')[0].slice(0, 200);
      }
    }
    const r = await L.scanInPage(pg, NAMES);
    out.packs = r.engine && r.engine.packs;
    out.hOne = L.outcome(r, 'h-one');
    out.n = r.checksResults.length;
    out.errors = r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + c.error).slice(0, 5);
  } catch (e) {
    out.scanError = e.message.split('\n')[0].slice(0, 300);
  }
  out.logs = logs.filter((l) => !/Failed to load resource/.test(l)).slice(0, 5);
  await context.close();
  L.log(label, out);
}

const pre = (js) => `<script>${js}</script>`;

(async () => {
  await L.withBrowser(async (b) => {
    await attempt(b, '01 baseline', { html: page('') });
    await attempt(b, '02 AMD define + module/exports globals', { html: page(pre('window.define = function(){ window.__amd = (window.__amd||0)+1 }; define.amd = {}; window.module = { exports: {} }; window.exports = window.module.exports;')) });
    await attempt(b, '03 Array.prototype.map patched to throw', { html: page(pre('Array.prototype.map = function(){ throw new Error("map patched") };')) });
    await attempt(b, '04 Object.keys returns []', { html: page(pre('Object.keys = function(){ return [] };')) });
    await attempt(b, '05 Object.assign patched', { html: page(pre('Object.assign = function(t){ return t };')) });
    await attempt(b, '06 JSON.stringify patched', { html: page(pre('JSON.stringify = function(){ return "{}" };')) });
    await attempt(b, '07 Map replaced (Prototype.js-era)', { html: page(pre('window.Map = function(){ this.x = 1 };')) });
    await attempt(b, '08 globalThis.__surea11yPacks = "string" before', { html: page(pre('window.__surea11yPacks = "nope";')) });
    await attempt(b, '09 __surea11yPacks frozen {}', { html: page(pre('window.__surea11yPacks = Object.freeze({});')) });
    await attempt(b, '10 __surea11yPacks getter-only {}', { html: page(pre('Object.defineProperty(window, "__surea11yPacks", { get(){ return {} } });')) });
    await attempt(b, '11 element id="__surea11yPacks"', { html: page('', '<div id="__surea11yPacks"></div>') });
    await attempt(b, '12 two elements id="__surea11yPacks"', { html: page('', '<div id="__surea11yPacks"></div><span id="__surea11yPacks"></span>') });
    await attempt(b, '13 cross-origin iframe name="__surea11yPacks"', {
      html: page('', '<iframe name="__surea11yPacks" src="https://other.test/"></iframe>'),
      routes: { 'https://other.test/': { body: '<p>x</p>' } }
    });
    await attempt(b, '14 page plants an entry for the pack name', { html: page(pre(`window.__surea11yPacks = { ${JSON.stringify(NAMES[0])}: { checkDefs: [], composites: [], impls: {}, packs: ['@h/pack@1.0.0'], overrides: [] } };`)) });
    await attempt(b, '15 Object.prototype polluted with the key', { html: page(pre(`Object.prototype[${JSON.stringify(NAMES[0])}] = 1;`)) });
    await attempt(b, '16 window.a11ycore pre-set by page', { html: page(pre('window.a11ycore = { runa11yCoreInPage(){ return { fake: true } } };')) });

    const strict = { 'Content-Security-Policy': "script-src 'nonce-abc'; object-src 'none'; base-uri 'none'" };
    await attempt(b, '20 nonce CSP, addScriptTag, bypassCSP false', { html: page(''), headers: strict });
    await attempt(b, '21 nonce CSP, addScriptTag, bypassCSP true', { html: page(''), headers: strict, bypassCSP: true });
    await attempt(b, '22 nonce CSP, page.evaluate(script), bypassCSP false', { html: page(''), headers: strict }, 'evaluate');
    const self = { 'Content-Security-Policy': "script-src 'self'" };
    await attempt(b, '23 script-src self, page.evaluate(script)', { html: page(''), headers: self }, 'evaluate');
    const tt = { 'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types default" };
    await attempt(b, '24 Trusted Types enforced, addScriptTag', { html: page(''), headers: tt });
    await attempt(b, '25 Trusted Types enforced, page.evaluate(script)', { html: page(''), headers: tt }, 'evaluate');
    const ttNone = { 'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types 'none'" };
    await attempt(b, '26 Trusted Types none, page.evaluate(script)', { html: page(''), headers: ttNone }, 'evaluate');
  });
})();
