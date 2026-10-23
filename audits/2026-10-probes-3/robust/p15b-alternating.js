// Alternating div/span nesting (block inside inline): page load/layout vs scan time.
const h = require('./harness');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await h.browser();
  for (const depth of (process.argv[2] || '200,400,800').split(',').map(Number)) {
    const ctx = await b.newContext(); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    const f = path.join(__dirname, 'tmp', 'alt.html'); fs.writeFileSync(f, '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><div id="root"></div></main></body></html>');
    await page.goto('file://' + f);
    let t = Date.now();
    await h.cdpEval(cdp, `(function(){let n=document.getElementById('root');for(let i=0;i<${depth};i++){const d=document.createElement(i%2?'div':'span');n.appendChild(d);n=d}n.innerHTML='<button></button><img src=q>';return 1})()`, 600000);
    const buildMs = Date.now() - t; t = Date.now();
    await h.cdpEval(cdp, 'document.body.offsetHeight', 600000);
    const layoutMs = Date.now() - t;
    await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
    const r = await h.cdpEval(cdp, '(function(){const t=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,{},null);return performance.now()-t})()', 600000).catch((e) => String(e).slice(0, 100));
    console.log(JSON.stringify({ depth, buildMs, firstLayoutMs: layoutMs, scanMs: r }));
    await Promise.race([ctx.close(), new Promise((r) => setTimeout(r, 5000))]);
  }
  await h.closeBrowser();
})();
