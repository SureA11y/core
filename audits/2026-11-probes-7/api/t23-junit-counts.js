const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
(async () => {
  const r = await runa11yCoreOnHtml(require('./page.js'), { engineOptions: { profile: ['wcag22-aa', 'sample-1.0', 'nope-9'], packs: [sample] } });
  let i = 0;
  for (const o of [{}, { cantTellAs: 'failure' }, { leanFailAs: 'failure' }, { includeNotApplicable: true }, { allowProfilesNotRun: true, cantTellAs: 'failure', includeNotApplicable: true }]) {
    fs.writeFileSync(`out-j${i}.xml`, renderJunitReport(r, o)); i++;
  }
})();
