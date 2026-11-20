const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
(async () => {
  const r = await runa11yCoreOnHtml('<html lang=en><title>t</title><main><img src=a></main></html>', { engineOptions: { profile: ['wcag22-aa', 'nope-1.0'] } });
  console.log('notRun', JSON.stringify(r.engine.profilesNotRun));
  for (const allow of [undefined, true]) {
    const s = JSON.parse(renderSarifReport(r, allow ? { allowProfilesNotRun: true } : {}));
    const inv = s.runs[0].invocations; console.log('sarif allow', allow, 'execSuccessful', inv && inv[0].executionSuccessful, JSON.stringify(inv && inv[0].toolExecutionNotifications || inv && inv[0].toolConfigurationNotifications || '').slice(0, 200), 'props', JSON.stringify(s.runs[0].properties).slice(0,200));
    const j = renderJunitReport(r, allow ? { allowProfilesNotRun: true } : {}); console.log('junit', (j.match(/<testsuites[^>]*>/)||[])[0], (j.match(/<error[^>]*>/g)||[]).slice(0,2));
  }
  const h = renderHtmlReport(r); console.log('html mentions nope', h.includes('nope-1.0'));
})();
