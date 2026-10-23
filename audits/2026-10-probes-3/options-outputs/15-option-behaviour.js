'use strict';
// One check per documented option that earlier probes didn't cover: does it
// do what ENGINE_OPTIONS.md says?
const h = require('./h.js');
const { main } = h.load();
const out = [];
const say = (name, ok, detail) => out.push(`${ok ? 'OK  ' : 'DIFF'} ${name}: ${detail}`);
function scan(html, eo, ro, ctx = null, url = 'https://e.test/') {
  h.setDom(html, typeof url === 'string' && /^https?:/.test(url) ? url : 'https://e.test/');
  return h.capture(() => main.runDomRulesInPage(url, ctx, eo, ro));
}
// contrast.rootCanvasFallback in auditorAssist, page with no background (jsdom)
const grey = '<!doctype html><html lang="en"><head><title>t</title></head><body><p style="color:#777">Some grey text here</p></body></html>';
for (const fb of [undefined, '#000000', 'banana', 'rgba(0,0,0,0)', '#fff0', 'transparent', 'oklch(0 0 0)']) {
  const r = scan(grey, { contrast: { mode: 'auditorAssist', ...(fb === undefined ? {} : { rootCanvasFallback: fb }) } }, ['contrast-minimum']);
  const c = r.value.checksResults[0];
  const o = c.occurrences[0];
  say(`rootCanvasFallback ${JSON.stringify(fb)}`, true, `${c.outcome} ${o ? JSON.stringify(o.summary).slice(0, 110) : ''} | echoed ${JSON.stringify(c.engineOptions.contrast)} | logs ${r.logs.join('|').slice(0, 100)}`);
}
// rules[ruleId] settings dropped for a standard's threshold
{
  const r = scan(grey.replace('#777', '#888'), { rules: { 'contrast-minimum': { normalTextRatio: 2 } }, contrast: { mode: 'auditorAssist' } }, ['contrast-minimum']);
  say('rules[contrast-minimum].normalTextRatio dropped', r.value.checksResults[0].outcome === 'fail', r.value.checksResults[0].outcome + ' logs:' + r.logs.join('|').slice(0, 120));
}
// probes caps and echo
{
  let deep = { v: 1 }; for (let i = 0; i < 20; i++) deep = { d: deep };
  const big = { arr: Array.from({ length: 1000 }, (_, i) => i), str: 'x'.repeat(10000), deep, keys: Object.fromEntries(Array.from({ length: 100 }, (_, i) => ['k' + i, i])) };
  const r = scan(grey, { probes: big }, ['page-title-present']);
  const p = r.value.checksResults[0].engineOptions.probes;
  let depth = 0, x = p.deep; while (x && typeof x === 'object' && x.d) { depth++; x = x.d; }
  say('probes capped in echo', p.arr.length === 200 && p.str.length <= 2000 && Object.keys(p.keys).length <= 50, `arr ${p.arr.length}, str ${p.str.length}, keys ${Object.keys(p.keys).length}, deep chain ${depth}`);
  const cyc = { a: 1 }; cyc.self = cyc;
  const r2 = scan(grey, { probes: { cyc, big: 10n, fn() {} } }, ['page-title-present']);
  say('probes with cycle/BigInt/function', !r2.error && (() => { try { JSON.stringify(r2.value); structuredClone(r2.value); return true; } catch { return false; } })(), r2.error ? r2.error.message : JSON.stringify(r2.value.checksResults[0].engineOptions.probes));
  const thr = {}; Object.defineProperty(thr, 'x', { enumerable: true, get() { throw new Error('probe getter'); } });
  const r3 = scan(grey, { probes: thr }, ['page-title-present']);
  say('probes with a throwing getter', !r3.error, r3.error ? 'THROWS ' + r3.error.message : JSON.stringify(r3.value.checksResults[0].engineOptions.probes));
}
// logUntestedWcag
{
  const a = scan(grey, {}, { tags: ['wcag2a', 'wcag22a'] });
  const b = scan(grey, { logUntestedWcag: false }, { tags: ['wcag2a', 'wcag22a'] });
  say('logUntestedWcag false silences the note', a.logs.length === 1 && b.logs.length === 0, `default ${a.logs.length} line(s), false ${b.logs.length}`);
}
// timestamp forms
for (const ts of ['', '   ', 'not a date', 1728432000000]) {
  const r = scan(grey, { timestamp: ts }, ['page-title-present']);
  say(`timestamp ${JSON.stringify(ts)}`, true, `result.timestamp=${JSON.stringify(r.value.timestamp)} logs ${r.logs.length}`);
}
// pageUrl forms
for (const u of [undefined, null, '', 42, { href: 'x' }, 'not a url', 'javascript:alert(1)']) {
  const r = scan(grey, {}, ['page-title-present'], null, u);
  say(`pageUrl ${JSON.stringify(u)}`, true, `url=${JSON.stringify(r.value.url)} logs ${r.logs.map((l) => l.slice(0, 80)).join('|')}`);
}
// messages: non-string values, a key that is an inherited name
{
  const r = scan('<img src=a.png>', { locale: 'de', messages: { de: { img_altPresent_title: 42, img_altPresent_summary_fail: '' } } }, ['img-alt-present']);
  const c = r.value.checksResults[0];
  say('messages with a number and an empty string', true, `title=${JSON.stringify(c.title)} summary=${JSON.stringify(c.occurrences[0].summary)} reason=${r.value.engine.locale.reason}`);
}
// excludeSelectors: invalid among valid
{
  const r = scan('<main><img src=a.png class=a><img src=b.png class=b></main>', { excludeSelectors: ['.a', 'img[', ':has(', '.b'] }, ['img-alt-present']);
  say('excludeSelectors with invalid entries', r.value.checksResults[0].outcome !== 'fail', `${r.value.checksResults[0].outcome}, logs ${r.logs.map((l) => l.slice(0, 90)).join(' | ')}`);
}
// output.detail findings with includeSelector false on a fail: still whole
{
  const r = scan('<img src=a.png>', { output: { detail: 'findings', includeSelector: false } }, ['img-alt-present', 'page-title-present']);
  say('findings + includeSelector false', true, JSON.stringify(r.value.checksResults.map((c) => [c.ruleId, Object.keys(c).length, c.occurrences ? c.occurrences.map((o) => o.selector) : null])));
}
// visibilityMode in jsdom on off-screen text
{
  const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><p style="position:absolute;left:-9999px;color:#999;background:#fff">Hidden text</p></body></html>';
  for (const vm of [undefined, 'styleOnly', 'styleAndGeometry', 'geometry']) {
    const r = scan(html, vm ? { visibilityMode: vm } : {}, ['contrast-minimum']);
    say(`visibilityMode ${vm}`, true, `${r.value.checksResults[0].outcome}/${r.value.checksResults[0].occurrences.length} logs ${r.logs.length}`);
  }
}
console.log(out.join('\n'));
process.exit(0);
