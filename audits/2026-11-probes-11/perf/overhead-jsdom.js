'use strict';
// Engine overhead in jsdom: empty page, options variants, reporters, baseline. node overhead-jsdom.js <build>
const b = process.argv[2]; const CORE = `/home/user/core-${b}`;
const { JSDOM } = require(CORE + '/node_modules/jsdom');
const { runDomRulesInPage } = require(CORE + '/src/index.js');
const { pages } = require('./pages');
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const scan = (html, opts = {}, ro = null) => { const d = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document; const t = performance.now(); const r = runDomRulesInPage('https://example.test/', null, opts, ro); const ms = performance.now() - t; d.window.close(); return { r, ms }; };
const time = (f, n = 3) => { const a = []; let v; for (let i = 0; i < n; i++) { const t = performance.now(); v = f(); a.push(performance.now() - t); } return { ms: Math.round(med(a) * 10) / 10, v }; };
const tryReq = (m) => { try { return require(CORE + '/src/' + m); } catch { return {}; } };
(async () => {
  const empty = '<!doctype html><html lang=en><head><title>E</title></head><body><main><h1>E</h1><p>x</p></main></body></html>';
  scan(empty); // warm JIT
  const out = {};
  out.empty = Math.round(med([0, 1, 2, 3, 4].map(() => scan(empty).ms)));
  out.emptyRunOnly1 = Math.round(med([0, 1, 2].map(() => scan(empty, {}, ['img-alt-present']).ms)));
  const shop = pages.shop(); const news = pages.news();
  out.shop = Math.round(med([0, 1, 2].map(() => scan(shop).ms)));
  for (const [k, o] of Object.entries({ locale_de: { locale: 'de' }, locale_ja: { locale: 'ja' }, profile_en301549: { profile: 'en301549-v3.2.1' }, multi2: { profile: ['wcag22-aa', 'wcag21-aa'] }, multi3: { profile: ['wcag22-aa', 'wcag21-aa', 'wcag20-a'] }, capOcc5: { output: { maxOccurrencesPerRule: 5 } }, noHtml: { output: { includeHtml: false } }, budget1e6: { timeBudgetMs: 1e6 }, shadowOff: { includeShadowDom: false }, excl: { excludeSelectors: ['.price', 'footer', '[aria-pressed]'] } })) {
    try { const ms = med([0, 1, 2].map(() => scan(shop, o).ms)); out['shop_' + k] = Math.round(ms); } catch (e) { out['shop_' + k] = 'ERR ' + String(e.message).slice(0, 80); }
  }
  const { r } = scan(news);
  const occ = r.checksResults.reduce((a, c) => a + (c.occurrences || []).length, 0);
  out.newsOccurrences = occ; out.resultJsonKB = Math.round(JSON.stringify(r).length / 1024);
  const rep = { html: ['report.js', 'renderHtmlReport'], sarif: ['sarif.js', 'renderSarifReport'], junit: ['junit.js', 'renderJunitReport'], earl: ['earl.js', 'renderEarlReport'] };
  for (const [k, [f, fn]] of Object.entries(rep)) { const m = tryReq(f); if (!m[fn]) { out['rep_' + k] = 'n/a'; continue; } try { const x = time(() => m[fn](r)); out['rep_' + k] = x.ms + 'ms/' + Math.round(String(typeof x.v === 'string' ? x.v : JSON.stringify(x.v)).length / 1024) + 'KB'; } catch (e) { out['rep_' + k] = 'ERR ' + e.message.slice(0, 60); } }
  const bl = tryReq('baseline.js');
  if (bl.buildBaselineEntries) { const e = time(() => bl.buildBaselineEntries(r)); out.baselineBuild = e.ms; const ents = e.v; out.baselineMatch = time(() => bl.matchBaseline(r, ents)).ms; }
  const sr = tryReq('scan-result.js');
  if (sr.assertScanResult) out.assertScanResult = time(() => sr.assertScanResult(r)).ms;
  console.log(b, JSON.stringify(out));
})();
