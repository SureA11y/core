const { r } = require('./tb-multiprofile.js');
const { renderJunitReport } = require('/home/user/core-r10/src/junit.js');
const { renderSarifReport } = require('/home/user/core-r10/src/sarif.js');
const j = renderJunitReport(r, { allowProfilesNotRun: true }); console.log((j.match(/<testsuites[^>]*>/)||[])[0], (j.match(/<testcase[^>]*wcag22-aa[\s\S]{0,200}/)||[''])[0].replace(/\n/g,' '));
const s = JSON.parse(renderSarifReport(r, { allowProfilesNotRun: true })); console.log(JSON.stringify(s.runs[0].invocations[0].toolExecutionNotifications.map(n=>[n.level,n.message.text.slice(0,120)])), s.runs[0].invocations[0].executionSuccessful);
