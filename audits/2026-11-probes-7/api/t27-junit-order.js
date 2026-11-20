const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const r = runa11yCoreOnHtml(require('./page.js'), { engineOptions: { profile: 'wcag22-aaa' }, runOnly: { bestPractices: true } });
const j = renderJunitReport(r);
console.log((j.match(/<testsuite [^>]*name="[^"]*"|<testcase [^>]*name="[^"]*"/g) || []).map(s => s.replace(/.*name="/, '').replace(/"$/, '')).join('\n'));
