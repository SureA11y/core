const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const html = `<!doctype html><html lang="en"><head><title>Carousel page</title>
<style>.track{position:relative;overflow:hidden;width:300px;height:100px}.slide{position:absolute;top:0;width:300px;left:0}.slide[aria-hidden="true"]{left:-9999px}</style></head>
<body><main><h1>Deals</h1><div class="track">
<div class="slide" id="s1" aria-hidden="false"><a href="/1">Deal one</a></div>
<div class="slide" id="s2" aria-hidden="true"><a href="/2">Deal two</a></div>
<div class="slide" id="s3" aria-hidden="true"><a href="/3">Deal three</a></div>
</div></main>
<script>
document.querySelector('.track').addEventListener('focusin', (e) => {
  const s = e.target.closest('.slide');
  document.querySelectorAll('.slide').forEach(x => x.setAttribute('aria-hidden', x === s ? 'false' : 'true'));
});
</script></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto('https://example.test/');
  await p.evaluate(bundle + ';window.__a=a11ycore;');
  for (let i = 0; i < 3; i++) {
    const out = await p.evaluate(() => {
      const r = window.__a.runa11yCoreInPage(location.href, null, {}, null);
      const pick = r.checksResults.filter(c => c.outcome !== 'notApplicable' && c.outcome !== 'pass' || /aria-hidden-focus|css-hidden/.test(c.ruleId)).map(c => c.ruleId + '=' + c.outcome + ':' + c.occurrences.map(o => o.selector).join('|'));
      return { pick, state: [...document.querySelectorAll('.slide')].map(s => s.getAttribute('aria-hidden')).join(',') };
    });
    console.log('scan', i, out.state, '\n  ' + out.pick.join('\n  '));
  }
  await b.close();
})();
