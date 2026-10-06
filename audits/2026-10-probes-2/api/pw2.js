const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const INJ = fs.readFileSync(__dirname + '/inject.js', 'utf8');
const child = (label) => `<html lang="en"><head><title>${label}</title></head><body><main><img src="x.png" alt=""><img src="${label}.png"></main><script src="/inject.js"></script><script>a11yCoreEnableFrameResponder()</script></body></html>`;
const pages = {
  'http://a.test/top': `<html lang="en"><head><title>top</title></head><body><main>
     <div id="ads"><iframe src="http://b.test/ad" title="ad"></iframe></div>
     <div id="host"></div>
     <iframe src="http://a.test/same" title="same"></iframe>
   </main><script src="/inject.js"></script><script>
     const r = document.getElementById('host').attachShadow({mode:'open'});
     r.innerHTML = '<iframe src="http://b.test/inshadow" title="sh"></iframe>';
   </script></body></html>`,
  'http://b.test/ad': child('ad'),
  'http://a.test/same': child('same'),
  'http://b.test/inshadow': child('inshadow'),
};
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(()=>chromium.launch());
  const ctx = await browser.newContext();
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.endsWith('/inject.js')) return route.fulfill({ body: INJ, contentType: 'application/javascript' });
    if (pages[u]) return route.fulfill({ body: pages[u], contentType: 'text/html' });
    return route.fulfill({ status: 404, body: '' });
  });
  const page = await ctx.newPage();
  page.on('console', m => console.log('[page]', m.text().slice(0,200)));
  await page.goto('http://a.test/top');
  await page.waitForTimeout(1500);
  const show = (r) => JSON.stringify({ top: r.topFrame.checksResults.filter(c=>c.ruleId==='img-alt-present').map(c=>c.occurrences.map(o=>o.html)), frames: r.frames.map(f => ({ url: f.url, error: f.error, occ: f.topFrame && f.topFrame.checksResults.filter(c=>c.ruleId==='img-alt-present').map(c=>c.occurrences.map(o=>o.html)) })) });
  let r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, null, {}, ['img-alt-present']));
  console.log('default', show(r));
  r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, null, { excludeSelectors: ['#ads'] }, ['img-alt-present']));
  console.log('excl #ads', show(r));
  r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, null, { excludeSelectors: ['iframe[title=ad]'] }, ['img-alt-present']));
  console.log('excl iframe', show(r));
  r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, '#ads', {}, ['img-alt-present']));
  console.log('ctx #ads', show(r));
  r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, '#nomatch', {}, ['img-alt-present']));
  console.log('ctx #nomatch', show(r));
  r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, null, { customRules: [{ id: 'zz', meta: {}, runInPage: (ctx) => ({ outcome: 'pass', occurrences: [] }) }] }, ['img-alt-present']).then(x=>x, e=>({ERR: e.message})));
  console.log('fn customRule', r.ERR || show(r));
  r = await page.evaluate(() => runa11yCoreAcrossFrames(location.href, null, { includeShadowDom: false }, ['img-alt-present']));
  console.log('noShadow', show(r));
  await browser.close();
})();
