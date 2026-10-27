'use strict';
// Markup in the fields added since the last round's injection sweep
// (standards, frames, packs, profile severity, help links, tags, errors,
// margins, locale, environment): does any reach the HTML report, JUnit or
// SARIF unescaped?
const h = require('./h.js');
const { main, sub } = h.load();
const report = sub('report'), junit = sub('junit'), sarif = sub('sarif');
const P = '"\'><img src=x onerror=window.__pwn=1><script>window.__pwn=2</script>';
const custom = { id: 'org-x', meta: { title: 'T' + P, description: 'D' + P, tags: ['wcag111', 'wcag2a', 'tag' + P], wcagSc: ['1.1.1'], helpUrl: 'javascript:window.__pwn=3', margin: { measure: 'm' + P, unit: 'u' + P, limit: 'min' } },
  runInPage: `(ctx) => ({ outcome: 'fail', error: ${JSON.stringify('E' + P)}, occurrences: [{ selector: ${JSON.stringify('s' + P)}, html: ${JSON.stringify('<b>' + P)}, summary: ${JSON.stringify('S' + P)}, hint: ${JSON.stringify('H' + P)}, data: { details: { reasonCode: ${JSON.stringify('R' + P)} } } }], marginCandidates: [{ el: ctx.document.body, value: 5, threshold: 1, context: { x: ${JSON.stringify(P)} } }] })` };
h.setDom(`<!doctype html><html lang="en"><head><title>T${P.replace(/</g, '&lt;')}</title></head><body><main><img src="a.png" alt=""></main></body></html>`);
const res = main.runDomRulesInPage('https://e.test/?q=' + encodeURIComponent(P), null, { customRules: [custom], locale: 'en' + P, timestamp: '2026' + P, mappings: 'en301549' }, null);
// Hand-made fields a result can carry from elsewhere (a stored result, packs, frames).
res.engine.profile = 'p' + P; res.engine.packs = ['pk' + P]; res.engine.optInRules = ['o' + P]; res.engine.mappings = ['m' + P];
res.engine.environment = { layout: true, viewport: { width: P, height: 1 }, colorScheme: P, fonts: P };
res.skippedPacks = [{ name: 'n' + P, reason: 'r' + P }];
res.skippedCustomRules = [{ id: 'i' + P, reason: 'r' + P }];
res.standards = [{ key: 'k' + P, standard: 'EN 301 549', titleLang: 'x' + P, note: 'N' + P }];
res.contextMatch = { elementCount: 0, unmatchedSelectors: ['u' + P] };
res.checksResults[0].ruleSeverity = 'minor' + P;
res.checksResults[0].severity = 'serious' + P;
const cross = { topFrame: res, frames: [{ url: 'f' + P, selector: 'sel' + P, title: 't' + P, error: 'e' + P }, { url: 'g' + P, selector: 'sel2' + P, title: 't2' + P, topFrame: res, frames: [] }] };
const outs = {
  report: report.renderHtmlReport(cross, { title: 'X' + P }),
  junit: junit.renderJunitReport(cross),
  sarif: sarif.renderSarifReport(cross)
};
for (const [n, s] of Object.entries(outs)) {
  const raw = ['<img src=x onerror', '<script>window.__pwn', 'href="javascript:', "href='javascript:"].filter((x) => s.includes(x));
  console.log(n, raw.length ? 'UNESCAPED: ' + raw.join(', ') : 'escaped');
}
// Execute the report in jsdom with scripts on.
const { JSDOM } = h;
const d = new JSDOM(outs.report, { runScripts: 'dangerously' });
console.log('report executed payload:', d.window.__pwn || 'no', '| injected <img onerror>:', d.window.document.querySelectorAll('img[onerror]').length,
  '| javascript: links:', [...d.window.document.querySelectorAll('a[href]')].filter((a) => /^\s*javascript:/i.test(a.getAttribute('href'))).length);
// Well-formed JUnit?
const x = new JSDOM(outs.junit, { contentType: 'text/xml' });
console.log('junit parses as XML:', !x.window.document.querySelector('parsererror'));
process.exit(0);
