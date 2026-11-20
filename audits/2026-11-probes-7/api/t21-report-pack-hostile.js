const mk = require('./lawpack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
(async () => {
  const pack = mk();
  const r = await runa11yCoreOnHtml(require('./page.js'), { engineOptions: { packs: [pack], profile: ['sample-1.0', 'wcag22-aa'] } });
  const h = renderHtmlReport(r, { packs: [pack] });
  console.log('raw <b>& in report', h.includes('Law A <b>&amp;</b>'), 'escaped', h.includes('Law A &lt;b&gt;&amp;amp;&lt;/b&gt;'));
  require('fs').writeFileSync('out-law.html', h);
  const j = renderJunitReport(r); require('fs').writeFileSync('out-law.junit.xml', j);
  require('fs').writeFileSync('out-law.sarif', renderSarifReport(r, { packs: [pack] }));
})();
