// Deep nesting in Chromium: time per phase (load, build, scan) at growing
// depth, HEAD vs 1.10.0. Two shapes: a plain deep chain with failing
// content at the bottom, and the same chain inside a <button> (name from
// content walks it).
const h = require('./harness');
const fs = require('fs'), path = require('path');
const OLD = path.join(process.env.SCRATCH || '', 'pkg110/package/surea11y.browser.js');
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);
(async () => {
  const shape = process.argv[2] || 'chain';
  const depths = (process.argv[3] || '250,500,1000,1500').split(',').map(Number);
  const b = await h.browser();
  for (const depth of depths) {
    for (const [label, bundle] of [['head', h.BUNDLE], ['v1.10.0', OLD]]) {
      const ctx = await b.newContext(); const page = await ctx.newPage();
      const f = path.join(__dirname, 'tmp', 'deep.html');
      fs.writeFileSync(f, `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${shape === 'button' ? '<button id="root"></button>' : '<div id="root"></div>'}</main></body></html>`);
      await page.goto('file://' + f);
      const cdp = await ctx.newCDPSession(page);
      const tb = Date.now();
      await h.cdpEval(cdp, `(function(){let n=document.getElementById('root');for(let i=0;i<${depth};i++){const d=document.createElement('span');n.appendChild(d);n=d}${shape === 'button' ? "n.textContent='deep name'" : "n.innerHTML='<button></button><img src=q><a href=#>deep link</a>'"};document.body.offsetHeight;return 1})()`, 120000);
      const buildMs = Date.now() - tb;
      await h.cdpEval(cdp, fs.readFileSync(bundle, 'utf8') + ';void 0', 60000);
      let out;
      try {
        out = await h.cdpEval(cdp, `(function(){const t=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true},null);const rt=(r.perfStats&&r.perfStats.ruleTimings)||{};return {ms:performance.now()-t, errs:r.checksResults.filter(c=>c.error).map(c=>c.ruleId+':'+String(c.error).slice(0,70)), top:Object.entries(rt).map(([k,v])=>[k,typeof v==='number'?v:(v&&(v.ms||v.total||v.totalMs))||0]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>k+'='+Math.round(v)), btn:(r.checksResults.find(c=>c.ruleId==='button-name-present')||{}).outcome, img:(r.checksResults.find(c=>c.ruleId==='img-alt-present')||{}).outcome}})()`, 240000);
      } catch (e) { out = { err: String(e).slice(0, 150) }; }
      log(JSON.stringify({ shape, depth, label, buildMs, ...out, errs: out.errs && out.errs.slice(0, 4), nErr: out.errs && out.errs.length }));
      await Promise.race([ctx.close(), new Promise((r) => setTimeout(r, 5000))]);
    }
  }
  await h.closeBrowser();
})();
