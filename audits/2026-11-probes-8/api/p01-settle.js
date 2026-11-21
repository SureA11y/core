const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const earl = require('/home/user/core-r8/src/earl.js');
const base = require('/home/user/core-r8/src/baseline.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">x</p><p id="b">y</p></main></body></html>';
const mk = (id, ret) => ({ id, meta: { title: 'T', description: 'd', tags: ['wcag2a','wcag111'], wcagSc: ['1.1.1'] }, runInPage: ret });
const cases = {
  failNoOcc: `function(ctx){ return { outcome: 'fail', occurrences: [] }; }`,
  passWithFailOcc: `function(ctx){ return { outcome: 'pass', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'fail' }] }; }`,
  occOutcomeUpper: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'FAIL' }] }; }`,
  occOutcomeBogus: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'bogus' }] }; }`,
  occOutcomeInapp: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'inapplicable' }] }; }`,
  occOutcomeNA: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'notApplicable' }] }; }`,
  outcomeUpper: `function(ctx){ return { outcome: 'FAIL', occurrences: [{ selector: '#a', message: 'm' }] }; }`,
  outcomeInapplicable: `function(ctx){ return { outcome: 'inapplicable', occurrences: [] }; }`,
  outcomeBogus: `function(ctx){ return { outcome: 'boom', occurrences: [{ selector: '#a', message: 'm' }] }; }`,
  cantTellWithFailOcc: `function(ctx){ return { outcome: 'cantTell', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'fail' }] }; }`,
  naWithCantTellOcc: `function(ctx){ return { outcome: 'notApplicable', occurrences: [{ selector: '#a', message: 'm', occurrenceOutcome: 'cantTell' }] }; }`,
  occNullEntry: `function(ctx){ return { outcome: 'fail', occurrences: [null, { selector: '#a', message: 'm' }] }; }`,
  occNotArray: `function(ctx){ return { outcome: 'fail', occurrences: { selector: '#a' } }; }`,
  returnsNull: `function(ctx){ return null; }`,
  returnsString: `function(ctx){ return 'fail'; }`,
  throws: `function(ctx){ throw new Error('x'); }`,
  occSelectorMissing: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#nope', message: 'm' }] }; }`,
};
(async () => {
  for (const [k, src] of Object.entries(cases)) {
    let line;
    try {
      const r = await runa11yCoreOnHtml(html, { runOnly: { includeRuleIds: ['org-x'] }, engineOptions: { customRules: [mk('org-x', src)] } });
      const c = r.checksResults.find(c => c.ruleId === 'org-x');
      const comp = (r.rulesResults||[]).find(x => /1\.1\.1|non-text/i.test(x.id + JSON.stringify(x.meta||{}).slice(0,0)) || (x.checksIds||[]).includes('org-x'));
      const sarif = JSON.parse(renderSarifReport(r));
      const levels = sarif.runs[0].results.map(x => x.level + (x.kind? '/'+x.kind:'')).join(',');
      const junit = renderJunitReport(r);
      const jf = (junit.match(/failures="(\d+)"/)||[])[1];
      let e = earl.renderEarlReport ? earl.renderEarlReport(r) : (earl.toEarl ? earl.toEarl(r) : null);
      const es = typeof e === 'string' ? e : JSON.stringify(e);
      const eo = (es.match(/earl:(passed|failed|cantTell|inapplicable|untested)/g)||[]).join(',');
      let bl; try { bl = base.createBaseline ? base.createBaseline(r).entries.length : Object.keys(base).join('|'); } catch (er) { bl = 'ERR ' + er.message.slice(0,60); }
      line = `out=${c && c.outcome} occ=${c && JSON.stringify((c.occurrences||[]).map(o=>o.occurrenceOutcome))} err=${c && c.error ? JSON.stringify(c.error).slice(0,80):''} comp=${comp && comp.id+':'+comp.outcome} sarif=[${levels}] junitF=${jf} earl=${eo} base=${bl}`;
    } catch (e) { line = 'THROW ' + (e.code||'') + ' ' + e.message.slice(0, 200); }
    console.log(k.padEnd(20), line);
  }
})();
