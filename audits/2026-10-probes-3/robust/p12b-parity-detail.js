// Details of the non-layout jsdom/Chromium differences found by p12.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const CASES = [['area-alt-quality-manual-all-scenarios.html', 'valid-lang'], ['form-control-programmatic-label-quality-manual-all-scenarios.html', 'form-control-label-quality'], ['no-autoplay-audio-all-scenarios.html', 'no-autoplay-audio'], ['iframe-name-present-all-scenarios.html', 'iframe-focusable-content']];
(async () => {
  for (const [f, rule] of CASES) {
    const html = fs.readFileSync(path.join(h.ROOT, 'tests/fixtures', f), 'utf8');
    const j = h.runJsdom(html).r.checksResults.find((x) => x.ruleId === rule);
    const c = (await h.runChromium(html)).r.checksResults.find((x) => x.ruleId === rule);
    const show = (x) => x.outcome + ' ' + JSON.stringify(x.occurrences.map((o) => [o.selector, o.outcome, (o.message || '').slice(0, 90)]));
    console.log('##', f, rule, '\n jsdom   ', show(j).slice(0, 900), '\n chromium', show(c).slice(0, 900));
  }
  await h.closeBrowser();
})();
