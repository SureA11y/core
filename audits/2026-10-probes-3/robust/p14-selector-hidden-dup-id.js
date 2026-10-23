// The selector uniqueness index (dom-helpers.js createSelectorUniqIndex) is
// built from queryAllSmart, which drops hidden content. An id shared by a
// hidden element and a reported element then counts as unique, and the
// reported '#id' selector resolves to the hidden element.
const h = require('./harness');
const V = {
  hiddenFirst: '<div hidden id="x">old</div><button id="x"></button>',
  displayNoneFirst: '<div style="display:none"><span id="x">old</span></div><button id="x"></button>',
  templateLike: '<details><summary>S</summary><p id="x">closed details</p></details><button id="x"></button>',
  testidHidden: '<div hidden data-testid="save"></div><button data-testid="save"></button>',
  nameHidden: '<div hidden><input name="q"></div><input name="q">',
};
(async () => {
  for (const [n, body] of Object.entries(V)) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${body}</main></body></html>`;
    for (const [rt, r] of [['jsdom', h.runJsdom(html).r], ['chromium', (await h.runChromium(html, {}, { post: undefined })).r]]) {
      const hits = [];
      for (const c of r.checksResults) for (const o of c.occurrences || []) if (o.selector && /x|save|q/.test(o.selector) && (c.outcome === 'fail')) hits.push(c.ruleId + ' -> ' + o.selector + (o.html ? ' [' + String(o.html).slice(0, 50) + ']' : ''));
      console.log(n, rt, JSON.stringify(hits));
    }
  }
  // resolve the selector in Chromium
  const r = await h.runChromium('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><div hidden id="x">old</div><button id="x"></button></main></body></html>', {}, {
    post: () => { const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null); const o = r.checksResults.find((c) => c.ruleId === 'button-name-present').occurrences[0]; const el = document.querySelector(o.selector); return { selector: o.selector, resolvesTo: el && el.outerHTML, all: document.querySelectorAll(o.selector).length }; } });
  console.log('resolve:', JSON.stringify(r.post));
  await h.closeBrowser();
})();
