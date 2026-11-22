const H = require('./h.js');
const { r } = H.scan(H.page('<img src=a.png><a href=/x></a>'), { output: { maxOccurrencesPerRule: 1 }, timeBudgetMs: 1e9 });
const vals = [null, undefined, 0, 'x', true, [], {}, () => 1, NaN, 10n, Object.create(null)];
const fns = { sarif: (o) => H.sarif.renderSarifReport(r, o), junit: (o) => H.junit.renderJunitReport(r, o), earl: (o) => H.earl.renderEarlReport(r, o), html: (o) => H.report.renderHtmlReport(r, o), base: (o) => H.baseline.matchBaseline(r, H.baseline.buildBaselineEntries(r), o) };
const keys = { sarif: ['leanFailAs', 'locale', 'baseline', 'toolName', 'includeNotApplicable'], junit: ['leanFailAs', 'includeNotApplicable', 'suiteName', 'locale', 'baseline'], earl: ['mode', 'assertor', 'locale', 'source'], html: ['locale', 'manualChecks', 'title', 'baseline', 'theme'], base: ['leanFail', 'locale'] };
for (const [n, fn] of Object.entries(fns)) {
  for (const v of vals) { const W = console.warn; console.warn = () => {}; try { fn(v); } catch (e) { console.log(n, 'opts=', typeof v, (()=>{try{return String(v).slice(0,10)}catch{return "nullproto"}})(), 'THROW', (e.code || '') + ' ' + e.message.slice(0, 120)); } finally { console.warn = W; } }
  for (const k of keys[n]) for (const v of vals) { const W = console.warn; console.warn = () => {}; try { fn({ [k]: v }); } catch (e) { if (!/must|INVALID|not a|is not|takes/.test(e.message + e.code)) console.log(n, k, '=', typeof v, (()=>{try{return String(v).slice(0,10)}catch{return "nullproto"}})(), 'THROW', (e.code || '') + ' ' + e.message.slice(0, 140)); } finally { console.warn = W; } }
}
// hostile result objects
const bad = [null, {}, { checksResults: null }, { checksResults: [null, 1, 'x'] }, { checksResults: [{ ruleId: 'x', occurrences: [null, { selector: 5 }] }] }, JSON.parse('{"checksResults":[],"__proto__":{"x":1},"engine":{"packs":["<b>@1","a@\\"<x>"],"incomplete":{"timeBudgetMs":"<img src=x onerror=alert(1)>","rulesNotRun":"<x>"}},"notRun":[{"ruleId":"<img src=x onerror=1>"}]}')];
for (const b of bad) for (const [n, fn] of Object.entries({ sarif: () => H.sarif.renderSarifReport(b), junit: () => H.junit.renderJunitReport(b), earl: () => H.earl.renderEarlReport(b), html: () => H.report.renderHtmlReport(b), base: () => H.baseline.matchBaseline(b, []) })) {
  const W = console.warn; console.warn = () => {}; try { const o = fn(); const s = typeof o === 'string' ? o : JSON.stringify(o); if (/<img src=x|<b>@1|<x>/.test(s)) console.log('UNESCAPED in', n, (s.match(/.{0,40}(<img src=x|<b>@1|<x>).{0,40}/) || [])[0]); } catch (e) { console.log('bad', JSON.stringify(b).slice(0, 40), n, 'THROW', (e.code || '') + e.message.slice(0, 120)); } finally { console.warn = W; }
}
