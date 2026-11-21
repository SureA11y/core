const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
(async () => {
  console.warn = () => {};
  const r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><main><img src="a"><div role="button" tabindex="0" onclick="1">x</div></main></body></html>', {});
  for (const v of [undefined, true, 'yes', 'true', 1, 'false']) {
    const out = renderJunitReport(r, { includeNotApplicable: v });
    console.log('includeNotApplicable', JSON.stringify(v), 'tests=' + out.match(/tests="(\d+)"/)[1], 'skipped=' + out.match(/skipped="(\d+)"/)[1]);
  }
  for (const v of [{ assertor: 5 }, { mode: 5 }, { assertor: { name: 5, version: {} } }, { assertor: 'x' }]) {
    const e = renderEarlReport(r, v); const a = e['@graph'][0].assertions[0];
    console.log('earl', JSON.stringify(v), JSON.stringify({ assertedBy: a.assertedBy, mode: a.mode }));
  }
  for (const v of [undefined, false, 'no', 'false', 0]) {
    const h = renderHtmlReport(r, { manualChecks: v });
    console.log('html manualChecks', JSON.stringify(v), /What.s left for a person|left for a person/i.test(h) ? 'shown' : 'hidden');
  }
})();
