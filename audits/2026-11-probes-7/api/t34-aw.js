const aw = require('./awpack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const B = require('/home/user/core/src/baseline.js');
const core = require('/home/user/core/src/index.js');
(async () => {
  for (const profile of [['wcag22-aa', 'aw-1.0'], ['aw-1.0', 'wcag22-aa'], 'aw-1.0']) {
    const r = await runa11yCoreOnHtml(require('./page.js'), { engineOptions: { packs: [aw], profile } });
    for (const id of ['aria-role-name-present', 'list-children-valid']) {
      const c = r.checksResults.find(x => x.ruleId === id);
      console.log(JSON.stringify(profile), id, c.outcome, 'checkOutcome', c.checkOutcome, JSON.stringify(c.verdicts), c.occurrences.map(o => o.occurrenceOutcome + JSON.stringify(o.verdicts || {})).join(' '));
    }
    const s = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => /aria-role-name|list-children/.test(x.ruleId)).map(x => x.ruleId + ':' + x.level);
    const earl = renderEarlReport(r)['@graph'][0].assertions.filter(a => /aria-role-name|list-children/.test(a.test.title)).map(a => a.test.title + ':' + a.result.outcome);
    const j = renderJunitReport(r); const jf = (j.match(/<testcase[^>]*name="(aria-role-name-present|list-children-valid)"[^>]*>\s*<(failure|skipped|error)/g) || []).map(x => x.replace(/.*name="([^"]*)".*<(\w+)$/s, '$1:$2'));
    const base = B.buildBaselineEntries(r).filter(e => /aria-role-name|list-children/.test(e.ruleId)).length;
    const roll = r.rulesResults.filter(x => /^aw-|4\.1\.2|1\.3\.1/.test(x.ruleId)).map(x => x.ruleId + ':' + x.outcome);
    console.log('   sarif', s, '| earl', earl, '| junit', jf, '| baseline', base, '| rollups', roll, '| leaning', core.leaningFailures(r).length);
    await new Promise(s => setImmediate(s));
  }
})();
