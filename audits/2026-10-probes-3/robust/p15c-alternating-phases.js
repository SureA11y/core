// Alternating div/span nesting: logs each phase as it starts, so a hang is
// placed in layout or in the scan. Rules can be limited with a runOnly list.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);
(async () => {
  const depth = Number(process.argv[2] || 600);
  const rules = process.argv[3] ? JSON.stringify(process.argv[3].split(',')) : 'null';
  const b = await h.browser();
  const ctx = await b.newContext(); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  const f = path.join(__dirname, 'tmp', 'altp.html'); fs.writeFileSync(f, '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><div id="root"></div></main></body></html>');
  await page.goto('file://' + f);
  await h.cdpEval(cdp, `(function(){let n=document.getElementById('root');for(let i=0;i<${depth};i++){const d=document.createElement(i%2?'div':'span');n.appendChild(d);n=d}n.innerHTML='<button></button><img src=q>';return 1})()`, 600000);
  log('built; forcing layout');
  await h.cdpEval(cdp, 'document.body.offsetHeight', 600000); log('layout done');
  await h.cdpEval(cdp, 'getComputedStyle(document.querySelector("img")).color; document.querySelector("img").getBoundingClientRect().width', 600000); log('style+rect done');
  await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000); log('bundle in; scanning rules=' + rules);
  const r = await h.cdpEval(cdp, `(function(){const t=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,{},${rules});return {ms:performance.now()-t}})()`, 1200000).catch((e) => String(e).slice(0, 200));
  log('scan', JSON.stringify(r));
  await h.closeBrowser();
})();
