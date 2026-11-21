const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">x</p></main><aside><p id="b">y</p></aside></body></html>';
const R = (id, meta, run) => ({ id, meta: meta === undefined ? { title: 'T', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] } : meta, runInPage: run || function () { return { outcome: 'pass', occurrences: [] }; } });
const metaGetter = { title: 'T', description: 'd', tags: ['wcag2a'] }; Object.defineProperty(metaGetter, 'wcagSc', { get() { throw new Error('meta getter'); }, enumerable: true });
const cases = {
  idProto: [R('__proto__')],
  idCtor: [R('constructor')],
  idSpaces: [R(' org-x ')],
  idEmpty: [R('')],
  idWithSpace: [R('org x')],
  idCompositeUpper: [R('WCAG-1.1.1-NON-TEXT-CONTENT')],
  idUnicode: [R('org-ﬀ')],
  idHuge: [R('org-' + 'x'.repeat(100000))],
  metaGetter: [R('org-g', metaGetter)],
  wcagScBad: [R('org-sc', { title: 'T', description: 'd', tags: ['wcag2a'], wcagSc: ['9.9.9'] })],
  wcagScNum: [R('org-sc2', { title: 'T', description: 'd', tags: ['wcag2a'], wcagSc: [1.1] })],
  wcagScRemoved: [R('org-sc3', { title: 'T', description: 'd', tags: ['wcag2a'], wcagSc: ['4.1.1'] })],
  tagsString: [R('org-ts', { title: 'T', description: 'd', tags: 'wcag2a, wcag111' })],
  tagsProto: [R('org-tp', { title: 'T', description: 'd', tags: ['__proto__', 'wcag2a'] })],
  severityUpper: [R('org-sev', { title: 'T', description: 'd', tags: ['wcag2a'], defaultSeverity: 'SERIOUS' })],
  typeManualFail: [R('org-man', { title: 'T', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'], type: 'Manual' }, function () { return { outcome: 'fail', occurrences: [{ selector: '#a', message: 'm' }] }; })],
  excludedOcc: [R('org-ex', undefined, function (ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.getElementById('b') }, { __node: ctx.document.getElementById('a') }] }; })],
  excludedOnlyOcc: [R('org-ex2', undefined, function (ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.getElementById('b') }] }; })],
  excludedBySelector: [R('org-ex3', undefined, function (ctx) { return { outcome: 'fail', occurrences: [{ selector: 'aside > p' }] }; })],
  excludedByHtmlOnly: [R('org-ex4', undefined, function (ctx) { return { outcome: 'fail', occurrences: [{ html: '<p id="b">y</p>' }] }; })],
  proxyThrownResult: [R('org-pr', undefined, function () { return new Proxy({}, { get() { throw new Error('res proxy'); } }); })],
  occProxy: [R('org-op', undefined, function () { return { outcome: 'fail', occurrences: [new Proxy({}, { get() { throw new Error('occ proxy'); }, ownKeys() { throw new Error('ok'); } })] }; })],
  throwsProxy: [R('org-tpx', undefined, function () { throw new Proxy({}, { get() { throw new Error('thrown proxy'); } }); })],
  bigintData: [R('org-bi', undefined, function (ctx) { return { outcome: 'fail', occurrences: [{ selector: '#a', data: { n: 10n, d: new Date(0), el: ctx.document.body, m: new Map([[1, 2]]) } }] }; })],
  mutatesHelpers: [R('org-mh', undefined, function (ctx) { ctx.helpers.dom = null; return { outcome: 'pass', occurrences: [] }; })],
  twoSameUpper: [R('org-dup'), R('ORG-DUP')],
  hugeOccurrences: [R('org-many', undefined, function (ctx) { const o = []; for (let i = 0; i < 100000; i++) o.push({ selector: '#a', message: 'm' + i }); return { outcome: 'fail', occurrences: o }; })],
};
(async () => {
  const warns = []; console.warn = (...a) => warns.push(String(a[0]).slice(0, 120)); console.info = () => {};
  for (const [k, rules] of Object.entries(cases)) {
    warns.length = 0; const t = Date.now(); let line;
    try {
      const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: rules, excludeSelectors: ['aside'] }, runOnly: { tags: ['wcag2a'] } });
      const mine = r.checksResults.filter(c => rules.some(x => typeof x.id === 'string' && x.id.trim().toLowerCase() === c.ruleId.toLowerCase()) || /^org/i.test(c.ruleId) || c.ruleId === '__proto__' || c.ruleId === 'constructor');
      line = 'checks=' + JSON.stringify(mine.map(c => [c.ruleId.slice(0, 20), c.outcome, (c.occurrences || []).length, c.excludedOccurrences, (c.error || '').slice(0, 70)])) + ' skipped=' + JSON.stringify((r.skippedCustomRules || []).map(s => [String(s.id).slice(0, 20), (s.reason || '').slice(0, 60)])) + ' over=' + JSON.stringify(r.overriddenBuiltinIds);
      const w = r.rulesResults.find(x => x.id === 'wcag-1.1.1-non-text-content'); line += ' 1.1.1=' + (w && w.outcome);
    } catch (e) { line = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 200); }
    console.log(k.padEnd(18), (Date.now() - t + 'ms').padEnd(7), line.slice(0, 600), warns.length ? '\n     warns: ' + warns.slice(0, 3).join(' | ') : '');
  }
})();
