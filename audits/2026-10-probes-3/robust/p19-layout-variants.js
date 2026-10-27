// Same failing content (an unnamed button, an img without alt, low-contrast
// text) placed in layout situations; engine outcomes beside Chrome's
// accessibility tree for the button (ignored or not).
const h = require('./harness');
const fs = require('fs'), path = require('path');
const ITEM = '<button id="t"></button><img id="i" src="q.png"><p id="c" style="color:#999;background:#fff">low contrast text</p>';
const FILL = '<div style="height:3000px">filler</div>';
const V = {
  plain: ITEM,
  contentVisibilityAutoBelowFold: FILL + `<section style="content-visibility:auto;contain-intrinsic-size:auto 500px">${ITEM}</section>`,
  contentVisibilityAutoInView: `<section style="content-visibility:auto">${ITEM}</section>`,
  contentVisibilityHidden: `<section style="content-visibility:hidden">${ITEM}</section>`,
  hiddenUntilFound: `<div hidden="until-found">${ITEM}</div>`,
  closedDetails: `<details><summary>More</summary>${ITEM}</details>`,
  zoom2: `<div style="zoom:2">${ITEM}</div>`,
  zoomHalf: `<div style="zoom:.5">${ITEM}</div>`,
  scaleHalf: `<div style="transform:scale(.5);transform-origin:0 0">${ITEM}</div>`,
  scale0: `<div style="transform:scale(0)">${ITEM}</div>`,
  verticalRl: `<div style="writing-mode:vertical-rl;height:300px">${ITEM}</div>`,
  rtl: `<div dir="rtl">${ITEM}</div>`,
  stickyHeader: `<header style="position:sticky;top:0;background:#fff">${ITEM}</header>` + FILL,
  fixedOffscreenLeft: `<div style="position:fixed;left:-9999px">${ITEM}</div>`,
  modalDialogOpen: `<dialog id="d">${ITEM}</dialog><script>document.getElementById('d').showModal()</script>`,
  popoverOpen: `<div popover id="p">${ITEM}</div><script>document.getElementById('p').showPopover()</script>`,
  popoverClosed: `<div popover id="p">${ITEM}</div>`,
  opacity0: `<div style="opacity:0">${ITEM}</div>`,
  clipPathZero: `<div style="clip-path:inset(50%)">${ITEM}</div>`,
  visibilityHiddenChildVisible: `<div style="visibility:hidden"><div style="visibility:visible">${ITEM}</div></div>`,
  inertDiv: `<div inert>${ITEM}</div>`,
  scrolledOutInContainer: `<div style="height:50px;overflow:auto"><div style="height:2000px"></div>${ITEM}</div>`,
  iframeSrcdoc: `<iframe title="f" srcdoc='${ITEM.replace(/'/g, '&#39;')}'></iframe>`,
  shadowWithSlotFallbackHidden: `<x-h></x-h><script>customElements.define('x-h',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div style="display:none"><slot>${ITEM.replace(/'/g, "\\'")}</slot></div>'}})</script>`,
};
(async () => {
  const b = await h.browser();
  for (const [n, body] of Object.entries(V)) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${body}</main></body></html>`;
    const ctx = await b.newContext(); const page = await ctx.newPage();
    const f = path.join(__dirname, 'tmp', 'lv.html'); fs.writeFileSync(f, html); await page.goto('file://' + f); await page.waitForTimeout(100);
    const cdp = await ctx.newCDPSession(page);
    let chrome = 'n/a';
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.getElementById("t")' });
    if (result.objectId) { await cdp.send('Accessibility.enable'); const ax = (await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })).nodes[0]; chrome = ax.ignored ? 'ignored' : 'exposed'; }
    await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
    const r = await h.cdpEval(cdp, 'a11ycore.runa11yCoreInPage(location.href,null,{},null)', 60000);
    const o = (id) => { const c = r.checksResults.find((x) => x.ruleId === id); return c.outcome + '#' + c.occurrences.length; };
    console.log(JSON.stringify({ n, chromeButton: chrome, button: o('button-name-present'), img: o('img-alt-present'), contrast: o('contrast-minimum'), computable: o('contrast-computable') }));
    await ctx.close();
  }
  await h.closeBrowser();
})();
