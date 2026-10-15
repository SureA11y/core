'use strict';
const L = require('./lib.js');
const fs = require('fs');
const { chromium } = require(L.C + '/node_modules/playwright');
const { flattenCrossFrameResult, getMargins } = require(L.C + '/src/index.js');
const CORE = fs.readFileSync(L.C + '/src/core.js', 'utf8');
const START = CORE.indexOf('// SELF-CONTAINED in-page runner');
const CHUNK = CORE.slice(START, CORE.indexOf('module.exports = {', START));
const IMG = "<img src='data:,'>";
const shadow = "<div id='host'></div><script>document.getElementById('host').attachShadow({mode:'open'}).innerHTML=\"<img src='data:,'><a href='/x'></a>\"<\/script>";
const doc = (title, extra = '') => `<!doctype html><html lang='en'><head><title>${title}</title></head><body><main>${IMG}${extra}<p style='color:#999;background:#fff'>low</p></main></body></html>`;
const enc = (s) => s.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
async function scan(browser, eo, variant) {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html lang="en"><head><title>top</title></head><body><main>' + IMG + (variant ? '<p>unrelated</p>' : '') +
    `<iframe id="pay" title="pay" srcdoc="${enc(doc('pay', shadow))}"></iframe>` +
    `<iframe id="ads" title="ads" srcdoc="${enc(doc('ads'))}"></iframe>` +
    shadow.replace(/host/g, 'host2') + '</main></body></html>');
  await page.addScriptTag({ content: CHUNK });
  for (const f of page.frames().slice(1)) { await f.addScriptTag({ content: CHUNK }); if ((await f.title()) !== 'ads') await f.evaluate(() => window.a11yCoreEnableFrameResponder()); }
  const r = await page.evaluate((eo) => window.runa11yCoreAcrossFrames(null, null, { pingWaitTime: 300, includeShadowDom: true, ...eo }, null), eo);
  await page.close();
  return r;
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const eo of [{}, { output: { detail: 'findings' }, locale: 'de' }]) {
    const a = JSON.parse(JSON.stringify(await scan(browser, eo)));
    const b = JSON.parse(JSON.stringify(await scan(browser, eo, true)));
    console.log('== eo', JSON.stringify(eo), 'frames', flattenCrossFrameResult(a).map(f => f.frame.path.join('>') + (f.error ? ' ERR ' + f.error : '')));
    const s = L.renderSarifReport(a); console.log('sarif errors', L.sarifErrors(s));
    const run = JSON.parse(s).runs[0];
    console.log('sarif results', run.results.length, 'img in shadow', run.results.filter(x => x.ruleId === 'img-alt-present').map(x => (x.properties.frame || []).join('>') + ' ' + x.locations[0].logicalLocations?.[0]?.fullyQualifiedName));
    const doc = L.parseXml(L.renderJunitReport(a)); console.log('junit', doc.documentElement.outerHTML.match(/<testsuites[^>]*>/)[0]);
    const ents = L.B.buildBaselineEntries(a);
    const m1 = L.B.matchBaseline(a, ents), m2 = L.B.matchBaseline(b, ents);
    console.log('baseline entries', ents.length, 'self new/stale', m1.newCount, m1.staleCount, 'edited new/stale', m2.newCount, m2.staleCount);
    if (m2.newCount) console.log(m2.newOccurrences.slice(0, 5));
    const fr = flattenCrossFrameResult(a);
    // count consistency over frames
    let failOcc = 0; for (const f of fr) if (f.result) for (const c of f.result.checksResults) if (c.outcome === 'fail' || c.outcome === 'cantTell') for (const o of c.occurrences) if ((o.occurrenceOutcome || c.outcome) === 'fail') failOcc++;
    console.log('failOcc', failOcc, 'sarif errors', run.results.filter(x => x.level === 'error').length, 'baseline', ents.length);
    const earl = L.renderEarlReport(a); console.log('earl subjects', earl['@graph'].map(g => g.source + ':' + g.assertions.filter(x => x.result.outcome === 'earl:failed').length));
    const html = L.renderHtmlReport(a); console.log('html ok', html.length, 'frames section', /class="frame-heading"/.test(html));
    console.log('margins', getMargins(a).map(m => m.ruleId + (m.frame ? '@' + m.frame.join('>') : '')));
    fs.writeFileSync(__dirname + '/out/xframe' + (eo.locale || '') + '.json', JSON.stringify(a));
  }
  await browser.close();
})();
