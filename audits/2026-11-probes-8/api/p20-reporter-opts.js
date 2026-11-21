const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const B = require('/home/user/core-r8/src/baseline.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><a href="x"></a><div role="button" tabindex="0" onclick="1">x</div></main></body></html>';
(async () => {
  console.warn = () => {};
  const r = await runa11yCoreOnHtml(html, {});
  const fns = { sarif: renderSarifReport, junit: renderJunitReport, earl: (x, o) => JSON.stringify(renderEarlReport(x, o)), html: renderHtmlReport, base: (x, o) => JSON.stringify(B.buildBaselineEntries(x, o)), match: (x, o) => JSON.stringify(B.matchBaseline(x, o)) };
  const inputs = { null: null, undef: undefined, obj: {}, arr: [], str: 'x', noChecks: { engine: {} }, checksNotArr: { engine: r.engine, checksResults: {} }, proxy: new Proxy(r, { get(t, k) { if (k === 'checksResults') throw new Error('px'); return t[k]; } }), frozen: Object.freeze(JSON.parse(JSON.stringify(r))), stringified: JSON.stringify(r) };
  for (const [n, f] of Object.entries(fns)) {
    const row = [];
    for (const [k, v] of Object.entries(inputs)) {
      try { const o = f(v, n === 'match' ? [] : undefined); row.push(k + ':ok' + (typeof o === 'string' ? o.length : '')); } catch (e) { row.push(k + ':' + (e.name === 'TypeError' ? 'TE' : 'ERR(' + e.message.slice(0, 40) + ')')); }
    }
    console.log(n.padEnd(6), row.join(' '));
  }
  const optCases = {
    sarif: [{ leanFailAs: 'ERROR' }, { leanFailAs: 'bogus' }, { category: 5 }, { baselineEntries: {} }, { baselineEntries: [{}] }, { baselineEntries: [{ ruleId: 'x' }] }, { toolVersion: 5 }, { informationUri: 'javascript:alert(1)' }, { leanFailWcagOnly: 'yes' }, 5, 'x'],
    junit: [{ cantTellAs: 'FAILURE' }, { cantTellAs: 'bogus' }, { leanFailAs: 'bogus' }, { name: '<x>&' }, { name: 5 }, { includeNotApplicable: 'yes' }, { baselineEntries: 'x' }, 5],
    earl: [{ assertor: 5 }, { mode: 5 }, { mode: 'earl:bogus' }, { assertor: { name: 5 } }],
    html: [{ title: 5 }, { title: null }, { manualChecks: 'no' }, { packs: 'x' }, { packs: [{}] }],
    base: [{ leanFail: 'yes' }, 5],
  };
  for (const [n, list] of Object.entries(optCases)) for (const o of list) {
    let x; try { const out = fns[n](r, o); x = 'ok'; if (n === 'junit') x += ' failures=' + (out.match(/failures="(\d+)"/) || [])[1] + ' skipped=' + (out.match(/skipped="(\d+)"/) || [])[1]; if (n === 'sarif') x += ' levels=' + JSON.parse(out).runs[0].results.map(z => z.level[0]).join(''); if (n === 'html') x += ' title=' + (out.match(/<title>([^<]*)/) || [])[1]; } catch (e) { x = (e.name) + ' ' + (e.code || '') + ' ' + e.message.slice(0, 90); }
    console.log(n.padEnd(6), JSON.stringify(o).padEnd(42), x);
  }
})();
