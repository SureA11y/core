const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const core = require('/home/user/core/src/index.js');
const SRC = core.runa11yCoreInPage.toString();
const dir = '/home/user/core/tests/fixtures';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    try {
      await page.setContent(html, { waitUntil: 'load', timeout: 5000 });
    } catch (e) { console.log(f, 'load fail'); continue; }
    const res = await page.evaluate((src) => {
      const fn = new Function('return (' + src + ')')();
      const out = {};
      const eo = { visibilityMode: 'styleAndGeometry' };
      let a, b;
      try { a = fn(location.href, null, eo, null); b = fn(location.href, null, eo, null); } catch (e) { return { err: e.message }; }
      const bad = [];
      const walk = (v, p, seen) => {
        if (v === null || typeof v !== 'object') { if (typeof v === 'function' || typeof v === 'bigint' || typeof v === 'symbol' || (typeof v === 'number' && !Number.isFinite(v))) bad.push(p + ':' + typeof v + ':' + String(v)); return; }
        if (seen.has(v)) { bad.push(p + ':cycle-or-shared'); return; }
        if (typeof Node !== 'undefined' && v instanceof Node) { bad.push(p + ':DOMNode'); return; }
        const proto = Object.getPrototypeOf(v);
        if (proto !== Object.prototype && proto !== Array.prototype && proto !== null) bad.push(p + ':proto:' + (v.constructor && v.constructor.name));
        seen.add(v);
        for (const k of Object.keys(v)) walk(v[k], p + '.' + k, seen);
        seen.delete(v);
      };
      walk(a, 'r', new Set());
      const sa = JSON.stringify(a), sb = JSON.stringify(b);
      const diffs = [];
      if (sa !== sb) for (let i = 0; i < a.checksResults.length; i++) if (JSON.stringify(a.checksResults[i]) !== JSON.stringify(b.checksResults[i])) diffs.push(a.checksResults[i].ruleId);
      return { bad: bad.slice(0, 5), diffs };
    }, SRC);
    if (res.err || res.bad.length || res.diffs.length) console.log(f, JSON.stringify(res));
  }
  await browser.close();
  console.log('done');
})();
