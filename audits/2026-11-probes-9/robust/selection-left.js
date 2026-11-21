'use strict';
// A scan leaves a caret selection in a page that had none.
const { serve, launch, addBundle } = require('./lib');

const pages = {
  '/ce': { body: `<!doctype html><html lang="en"><title>t</title><main><h1>x</h1>
<div aria-hidden="true"><div contenteditable="true">Edit me</div></div>
</main>` },
  '/ce-plain': { body: `<!doctype html><html lang="en"><title>t</title><main><h1>x</h1>
<div contenteditable="true">Edit me</div><p>Some text</p>
</main>` },
  '/input': { body: `<!doctype html><html lang="en"><title>t</title><main><h1>x</h1>
<div aria-hidden="true"><input aria-label="x" value="abc"></div>
</main>` },
  '/userSel': { body: `<!doctype html><html lang="en"><title>t</title><main><h1>x</h1><p id=p>Para text here</p>
<div aria-hidden="true"><div contenteditable="true">Edit me</div></div>
</main><script>const r=document.createRange();r.selectNodeContents(document.getElementById('p'));getSelection().addRange(r);</script>` }
};

(async () => {
  const { base, close } = await serve(pages);
  const { browser, context } = await launch();
  for (const p of Object.keys(pages)) {
    const page = await context.newPage();
    await page.goto(base + p);
    await addBundle(page, base);
    const sel = () => page.evaluate(() => {
      const s = getSelection();
      if (!s.rangeCount) return `rangeCount 0 type ${s.type}`;
      const r = s.getRangeAt(0);
      const n = (x) => (x.nodeType === 3 ? '#text"' + x.data + '"' : x.nodeName) + (x.parentNode ? ' in ' + x.parentNode.nodeName : '');
      return `rangeCount ${s.rangeCount} type ${s.type} anchor ${n(s.anchorNode)}@${s.anchorOffset} text "${String(s)}" active ${document.activeElement.nodeName}`;
    });
    const b = await sel();
    await page.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, {}, null));
    const a = await sel();
    console.log(p, '\n  before:', b, '\n  after: ', a);
    await page.close();
  }
  await browser.close();
  close();
})();
