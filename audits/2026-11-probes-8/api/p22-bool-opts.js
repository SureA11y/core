const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
(async () => {
  console.warn = () => {};
  const r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><main><img src="a"></main></body></html>', {});
  const T = (n, f) => { try { f(); console.log(n, 'accepted'); } catch (e) { console.log(n, 'TypeError:', e.message.slice(0, 80)); } };
  for (const k of ['leanFailWcagOnly', 'allowProfilesNotRun', 'includeNotApplicable']) T('junit ' + k + "='yes'", () => renderJunitReport(r, { [k]: 'yes' }));
  for (const k of ['leanFailWcagOnly', 'allowProfilesNotRun']) T('sarif ' + k + "='yes'", () => renderSarifReport(r, { [k]: 'yes' }));
  T("html manualChecks='no'", () => renderHtmlReport(r, { manualChecks: 'no' }));
})();
