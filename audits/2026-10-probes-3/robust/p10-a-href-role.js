// <a href> with an explicit role (c4e74870): link-name-present now leaves a
// non-link role out. Does some other rule then report the unnamed element?
// Lists every rule that fails/cantTells on the element, beside Chrome's
// role and name for it.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const ROLES = ['button', 'BUTTON', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'switch', 'checkbox', 'radio', 'treeitem', 'listitem', 'img', 'heading', 'gridcell', 'row', 'textbox', 'combobox', 'slider', 'searchbox', 'progressbar', 'dialog', 'navigation', 'region', 'doc-noteref', 'doc-backref', 'presentation', 'none', 'generic', 'button link', 'foo link', 'foo button', 'foo', '', 'link', 'tooltip', 'scrollbar', 'spinbutton', 'separator', 'article', 'cell', 'columnheader', 'term'];
(async () => {
  const b = await h.browser();
  for (const variant of ['a-empty', 'area-empty', 'a-tabindex-1']) {
    console.log('== ' + variant);
    for (const role of ROLES) {
      const el = variant === 'a-empty' ? `<a id="t" href="/x" role="${role}"></a>`
        : variant === 'a-tabindex-1' ? `<a id="t" href="/x" role="${role}" tabindex="-1"></a>`
        : `<img src="m.png" usemap="#m" alt="map" width="100" height="100"><map name="m"><area id="t" href="/x" role="${role}" shape="rect" coords="0,0,50,50"></map>`;
      const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${el}</main></body></html>`;
      const ctx = await b.newContext(); const page = await ctx.newPage();
      const f = path.join(__dirname, 'tmp', 'ar.html'); fs.writeFileSync(f, html); await page.goto('file://' + f);
      const cdp = await ctx.newCDPSession(page);
      const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.getElementById("t")' });
      await cdp.send('Accessibility.enable');
      const ax = (await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })).nodes[0];
      await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
      const r = await h.cdpEval(cdp, 'a11ycore.runa11yCoreInPage(location.href,null,{},null)', 60000);
      const hits = r.checksResults.filter((c) => (c.outcome === 'fail' || c.outcome === 'cantTell') && c.occurrences.some((o) => /#t\b|a\b|area/.test(o.selector || ''))).map((c) => c.ruleId + ':' + c.outcome);
      console.log(JSON.stringify({ role, chromeRole: ax.role && ax.role.value, chromeName: ax.name && ax.name.value, ignored: ax.ignored, hits }));
      await ctx.close();
    }
  }
  await h.closeBrowser();
})();
