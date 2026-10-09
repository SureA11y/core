'use strict';
// Prints geometry and painting facts for an element on a corpus page.
// usage: node probe-el.js <page.html> '<selector>' [shadowHost>>>...]
const fs = require('node:fs');
const { chromium } = require('playwright');
const [file, selector, hosts] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.route('**/*', (r) => r.abort());
  await page.setContent(fs.readFileSync(file, 'utf8'), { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1500);
  const out = await page.evaluate(({ selector, hosts }) => {
    let root = document;
    for (const h of (hosts ? hosts.split('>>>') : [])) root = root.querySelector(h.trim()).shadowRoot;
    const el = root.querySelector(selector);
    if (!el) return 'not found';
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement || (n.getRootNode() && n.getRootNode().host)) {
      const cs = getComputedStyle(n);
      const rr = n.getBoundingClientRect();
      chain.push(`${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.split(/\s+/).slice(0, 2).join('.') : ''} bg=${cs.backgroundColor} ov=${cs.overflow} pos=${cs.position} disp=${cs.display} vis=${cs.visibility} op=${cs.opacity} clip=${cs.clip}/${cs.clipPath} rect=${[rr.x, rr.y, rr.width, rr.height].map(Math.round)} scroll=${n.scrollTop},${n.scrollLeft}/${n.scrollHeight}x${n.scrollWidth} client=${n.clientHeight}x${n.clientWidth}`);
      if (chain.length > 25) break;
    }
    const stack = (document.elementsFromPoint(cx, cy) || []).slice(0, 6).map((n) => n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + ' bg=' + getComputedStyle(n).backgroundColor);
    return { outer: el.outerHTML.slice(0, 500), rect: [r.x, r.y, r.width, r.height], text: (el.innerText || '').slice(0, 100), name: el.getAttribute('aria-label'), stack, chain };
  }, { selector, hosts: hosts || '' });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
