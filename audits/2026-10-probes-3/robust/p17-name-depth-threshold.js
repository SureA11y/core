// Depth at which name-from-content overflows the stack in Chromium, for a
// <button> over (a) nested light-DOM spans and (b) nested shadow roots, HEAD
// vs 1.10.0, beside Chrome's own name for the button.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const OLD = path.join(process.env.SCRATCH || '', 'pkg110/package/surea11y.browser.js');
(async () => {
  const b = await h.browser();
  for (const shape of ['shadow', 'light']) {
    for (const depth of [50, 100, 200, 300, 400, 600, 800, 1000, 1500]) {
      const row = { shape, depth };
      for (const [label, bundle] of [['head', h.BUNDLE], ['v1.10.0', OLD]]) {
        const ctx = await b.newContext(); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
        const f = path.join(__dirname, 'tmp', 'nd.html'); fs.writeFileSync(f, '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><button id="b"><span id="root"></span></button></main></body></html>');
        await page.goto('file://' + f);
        await h.cdpEval(cdp, shape === 'shadow'
          ? `(function(){let host=document.getElementById('root');for(let i=0;i<${depth};i++){const r=host.attachShadow({mode:'open'});const d=document.createElement('span');r.appendChild(d);host=d}host.innerHTML='<img alt="Deep">';return 1})()`
          : `(function(){let n=document.getElementById('root');for(let i=0;i<${depth};i++){const d=document.createElement('span');n.appendChild(d);n=d}n.innerHTML='<img alt="Deep">';return 1})()`, 60000);
        if (label === 'head') {
          const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.getElementById("b")' });
          await cdp.send('Accessibility.enable');
          const ax = (await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })).nodes[0];
          row.chrome = ax.name && ax.name.value;
        }
        await h.cdpEval(cdp, fs.readFileSync(bundle, 'utf8') + ';void 0', 60000);
        const r = await h.cdpEval(cdp, `(function(){const r=a11ycore.runa11yCoreInPage(location.href,null,{},{type:'rule',values:['button-name-present']});const c=r.checksResults.find(c=>c.ruleId==='button-name-present');return c.outcome+(c.error?' ERR:'+String(c.error).slice(0,40):'')})()`, 60000).catch((e) => 'X ' + String(e).slice(0, 80));
        row[label] = r;
        await ctx.close();
      }
      console.log(JSON.stringify(row));
    }
  }
  await h.closeBrowser();
})();
