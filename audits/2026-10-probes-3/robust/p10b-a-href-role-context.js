// <a href role=X> inside the context its role needs, empty (no name):
// Chrome's role/name vs the rules that report it.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const CASES = {
  listitemInList: '<div role="list"><a id="t" href="/x" role="listitem"></a></div>',
  listitemInUl: '<ul><a id="t" href="/x" role="listitem"></a></ul>',
  optionInListbox: '<div role="listbox" aria-label="L"><a id="t" href="/x" role="option"></a></div>',
  treeitemInTree: '<div role="tree" aria-label="T"><a id="t" href="/x" role="treeitem"></a></div>',
  rowInGrid: '<div role="grid" aria-label="G"><a id="t" href="/x" role="row"></a></div>',
  cellInRow: '<div role="table" aria-label="G"><div role="row"><a id="t" href="/x" role="cell"></a></div></div>',
  articleFeed: '<div role="feed"><a id="t" href="/x" role="article"></a></div>',
  navigation: '<a id="t" href="/x" role="navigation"></a>',
  generic: '<a id="t" href="/x" role="generic"></a>',
  term: '<a id="t" href="/x" role="term"></a>',
  listitemWithImgNoAlt: '<div role="list"><a id="t" href="/x" role="listitem"><img src="q.png"></a></div>',
  listitemTextOnly: '<div role="list"><a id="t" href="/x" role="listitem">Datepicker</a></div>',
};
(async () => {
  const b = await h.browser();
  for (const [name, el] of Object.entries(CASES)) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${el}</main></body></html>`;
    const ctx = await b.newContext(); const page = await ctx.newPage();
    const f = path.join(__dirname, 'tmp', 'ar2.html'); fs.writeFileSync(f, html); await page.goto('file://' + f);
    const cdp = await ctx.newCDPSession(page);
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.getElementById("t")' });
    await cdp.send('Accessibility.enable');
    const ax = (await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })).nodes[0];
    await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
    const r = await h.cdpEval(cdp, 'a11ycore.runa11yCoreInPage(location.href,null,{},null)', 60000);
    const hits = r.checksResults.filter((c) => (c.outcome === 'fail' || c.outcome === 'cantTell') && c.occurrences.some((o) => /(^|[ >])a(\b|:|\[|$)|#t/.test(o.selector || ''))).map((c) => c.ruleId + ':' + c.outcome);
    console.log(JSON.stringify({ name, chromeRole: ax.role && ax.role.value, chromeName: ax.name && ax.name.value, hits }));
    await ctx.close();
  }
  await h.closeBrowser();
})();
