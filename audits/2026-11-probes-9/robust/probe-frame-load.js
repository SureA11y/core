'use strict';
// The engine's placeholder/select probe frames: does a page's capturing load listener run
// during the scan (synchronously), and can it change what the scan reads?
const { serve, launch, addBundle } = require('./lib');
const body = (listener) => `<!doctype html><html lang="en"><title>t</title><style>input::placeholder{color:#757575}</style>
<main><h1>x</h1><label>Name <input placeholder="Your name"></label><label>Pick <select><option>a</option></select></label></main>
<script>window.__inScan=false;window.__log=[];${listener}</script>`;
const pages = {
  '/spy': { body: body("document.addEventListener('load',e=>{__log.push((e.target.localName||e.target.nodeName)+(window.__inScan?' DURING scan':' after scan'))},true)") },
  // a page that styles every iframe document it sees load (e.g. an embed helper), here making placeholders red
  '/restyle': { body: body("document.addEventListener('load',e=>{if(e.target.localName==='iframe'){try{const d=e.target.contentDocument;const st=d.createElement('style');st.textContent='::placeholder{color:#eee!important;opacity:1!important}';(d.head||d.documentElement).appendChild(st);__log.push('restyled probe frame')}catch(x){__log.push('err '+x)}}},true)") },
  '/none': { body: body('') }
};
(async () => {
  const s = await serve(pages);
  const { browser, context } = await launch();
  for (const p of Object.keys(pages)) {
    const page = await context.newPage();
    await page.goto(s.base + p);
    await addBundle(page, s.base);
    const r = await page.evaluate(() => {
      window.__inScan = true;
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['contrast-minimum', 'contrast-computable']);
      window.__inScan = false;
      return r.checksResults.map((c) => `${c.ruleId}=${c.outcome}x${(c.occurrences || []).length}` + (c.occurrences || []).map((o) => ' {' + (o.uncertainty && o.uncertainty.reasonCode || o.reasonCode || '') + ' ' + String(o.message || '').slice(0, 80) + '}').join('')).join('\n    ');
    });
    await page.waitForTimeout(200);
    console.log(p, '\n    ' + r, '\n    page log:', JSON.stringify(await page.evaluate(() => window.__log)));
    await page.close();
  }
  await browser.close();
  s.close();
})();
