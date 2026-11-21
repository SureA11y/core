// Selectors for findings at the top of a shadow root: does each one, read in its shadow root, find exactly its element? (Chromium)
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync(process.env.OLD ? '/home/user/core/surea11y.browser.js' : '/home/user/core-r8/surea11y.browser.js', 'utf8');
const shapes = {
  topSiblings: '<img src=a.png id=i1><img src=b.png id=i2><span>x</span><img src=c.png id=i3>',
  mixedWithText: 'text<img src=a.png id=i1>more<img src=b.png id=i2>',
  nestedHost: '<img src=a.png id=i1><x-inner></x-inner><img src=b.png id=i2>',
  svgAndHtmlA: '<svg><a href="/x"><text>1</text></a></svg><a href="/y" id=a1></a><a href="/z" id=a2></a>',
  slotted: '<slot></slot><img src=a.png id=i1><img src=b.png id=i2>',
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [k, inner] of Object.entries(shapes)) {
    const page = await b.newPage();
    await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><x-host><img src=l.png></x-host><x-host></x-host></main></body></html>');
    await page.evaluate((inner) => {
      customElements.define('x-inner', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = '<img src=n1.png><img src=n2.png>'; } });
      customElements.define('x-host', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = inner; } });
    }, inner);
    await page.addScriptTag({ content: BUNDLE });
    const res = await page.evaluate(async () => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ['img-alt-present', 'link-name-present'] } }, null);
      const out = [];
      for (const c of r.checksResults) for (const o of c.occurrences || []) {
        let root = document;
        for (const h of o.shadowHostSelectors || (o.target && o.target.shadowHostSelectors) || []) { const host = root.querySelector(h); root = host && host.shadowRoot; if (!root) break; }
        const found = root ? root.querySelectorAll(o.selector) : [];
        out.push(c.ruleId + ' ' + JSON.stringify(o.shadowHostSelectors || null) + ' ' + o.selector + ' -> ' + found.length + (found.length === 1 ? '' : ' !!'));
      }
      return out;
    });
    console.log('== ' + k + '\n   ' + res.join('\n   '));
    await page.close();
  }
  await b.close();
})();
