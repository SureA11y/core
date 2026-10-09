'use strict';
// Pack rules that throw, return odd values, mutate the DOM or the shared
// helpers, return huge or non-serializable data. Chromium (packScript) and
// Node (jsdom) side by side. The infinite loop is in 06b.
const L = require('./lib');
const { packScript } = L.packApi;

const HTML = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><img src="a.png"><img src="b.png"><a href="/x"></a></main></body></html>';

const mk = (name, rules, extra = {}) => L.packApi.definePack({ name, version: '1.0.0', namespace: name, core: '*', rules, ...extra });
const R = (id, fn) => ({ id, meta: { title: id, tags: [] }, runInPage: fn });

const cases = [
  ['throws', mk('t', [R('t-throw', () => { throw new Error('<b>boom</b>'); })])],
  ['throws a non-Error', mk('t', [R('t-throw', () => { throw { toString() { return 'obj'; } }; })])],
  ['async rule', mk('t', [R('t-async', async (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }))])],
  ['returns undefined', mk('t', [R('t-undef', () => undefined)])],
  ['returns string outcome', mk('t', [R('t-str', () => 'fail')])],
  ['unknown outcome', mk('t', [R('t-odd', () => ({ outcome: 'passed' }))])],
  ['occurrences not an array', mk('t', [R('t-occ', () => ({ outcome: 'fail', occurrences: 'x' }))])],
  ['fail with no occurrences', mk('t', [R('t-empty', () => ({ outcome: 'fail', occurrences: [] }))])],
  ['occurrence node is a detached element', mk('t', [R('t-det', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.createElement('div') }] }))])],
  ['occurrence node is the window', mk('t', [R('t-win', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.window }] }))])],
  ['circular data.details', mk('t', [R('t-circ', (ctx) => { const o = { a: 1 }; o.self = o; return { outcome: 'fail', occurrences: [{ __node: ctx.document.body, data: { details: { o } } }] }; })])],
  ['function/Symbol/BigInt/DOM in data.details', mk('t', [R('t-ns', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, data: { details: { reasonCode: 'X', fn() {}, sym: Symbol('s'), big: BigInt(10), el: ctx.document.body, nan: NaN, inf: Infinity, date: new Date(0), map: new Map([[1, 2]]) } } }] }))])],
  ['BigInt via reportOccurrence', mk('t', [R('t-big', (ctx) => { ctx.helpers.reportOccurrence(ctx.document.body, { summary: 's', data: { details: { big: BigInt(1) } } }); })])],
  ['non-string summary', mk('t', [R('t-sum', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, summary: { toString() { return 'x'; } }, hint: 42 }] }))])],
  // runs before core's img rules by id? the rule order decides.
  ['mutates the DOM (removes images, adds one)', mk('a', [R('a-zap', (ctx) => { for (const i of Array.from(ctx.document.images)) i.remove(); const n = ctx.document.createElement('img'); n.src = 'z.png'; n.id = 'planted'; ctx.document.body.appendChild(n); return { outcome: 'pass' }; })])],
  ['replaces shared helpers', mk('a', [R('a-hijack', (ctx) => { ctx.helpers.queryAllSmart = () => []; ctx.helpers.reportOccurrence = () => {}; try { ctx.helpers.dom.getAttribute = () => 'x'; } catch (e) {} return { outcome: 'pass' }; })])],
  ['patches a page built-in', mk('a', [R('a-patch', (ctx) => { ctx.window.Element.prototype.getAttribute = function () { return 'alt'; }; return { outcome: 'pass' }; })])]
];

const coreOutcomes = (r) => ['img-alt-present', 'link-name-present', 'page-title-present'].map((id) => `${id}:${L.outcome(r, id)}/${((r.checksResults.find((c) => c.ruleId === id) || {}).occurrences || []).length}`).join(' ');
const own = (r, p) => r.checksResults.filter((c) => c.ruleId.startsWith(p.namespace + '-')).map((c) => ({ id: c.ruleId, outcome: c.outcome, error: c.error, n: (c.occurrences || []).length, occ0: c.occurrences && c.occurrences[0] && { summary: c.occurrences[0].summary, hint: c.occurrences[0].hint, selector: c.occurrences[0].selector, details: c.occurrences[0].data && c.occurrences[0].data.details } }));
const tryJson = (r) => { try { JSON.stringify(r); return 'ok'; } catch (e) { return 'JSON.stringify throws: ' + e.message; } };

(async () => {
  await L.withBrowser(async (b) => {
    for (const [label, p] of cases) {
      const names = [`${p.name}@1.0.0`];
      let node;
      try {
        const r = L.scanNode({ packs: [p] }, { html: HTML });
        node = { own: own(r, p), core: coreOutcomes(r), json: tryJson(r) };
      } catch (e) {
        node = { error: e.message.slice(0, 200) };
      }
      const { page, context, logs } = await L.openPage(b, { html: HTML });
      await page.addScriptTag({ content: L.BUNDLE });
      let web;
      try {
        await page.addScriptTag({ content: packScript([p]) });
        const r = await L.scanInPage(page, names);
        web = { own: own(r, p), core: coreOutcomes(r), json: tryJson(r) };
        const after = await page.evaluate(() => ({ imgs: document.images.length, planted: !!document.getElementById('planted') }));
        if (/DOM/.test(label)) web.domAfterScan = after;
        if (/helpers|built-in/.test(label)) {
          const again = await L.scanInPage(page, null);
          web.secondScanWithoutPack = coreOutcomes(again);
        }
      } catch (e) {
        web = { error: e.message.split('\n')[0].slice(0, 300) };
      }
      await context.close();
      L.log(label, { node, chromium: web, logs: logs.filter((l) => !/Failed to load/.test(l)).slice(0, 3) });
    }
  });
})();
