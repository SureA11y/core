'use strict';
// Before/after page state around a scan, on every fixture, in Chromium.
const fs = require('node:fs');
const path = require('node:path');
const { serve, launch, addBundle, diff } = require('./lib');

const DIR = '/home/user/core-r9/tests/fixtures';
const only = process.argv[2];
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).filter((f) => !only || f.includes(only)).sort();

function snapshot() {
  const out = {};
  const ser = (root) => {
    let s = '';
    const all = root.querySelectorAll('*');
    for (const el of all) {
      s += '<' + el.localName;
      for (const a of el.attributes) s += ' ' + a.name + '=' + JSON.stringify(a.value);
      s += '>';
      const own = Object.getOwnPropertyNames(el).concat(Object.getOwnPropertySymbols(el).map(String));
      if (own.length) s += '{own:' + own.join(',') + '}';
      if (el.shadowRoot) s += '[shadow:' + ser(el.shadowRoot) + ']';
      if (el.scrollTop || el.scrollLeft) s += `{scroll:${el.scrollTop},${el.scrollLeft}}`;
    }
    return s + '|text:' + (root.nodeType === 9 ? root.documentElement : root).textContent.length;
  };
  out.dom = ser(document);
  out.html = document.documentElement.outerHTML;
  out.sheets = document.styleSheets.length + ':' + [...document.styleSheets].map((s) => { try { return s.cssRules.length; } catch { return 'x'; } }).join(',');
  out.adopted = document.adoptedStyleSheets.length;
  out.globals = Object.getOwnPropertyNames(window).sort().join(',');
  out.globalSyms = Object.getOwnPropertySymbols(window).map(String).join(',');
  out.docOwn = Object.getOwnPropertyNames(document).join(',') + '|' + Object.getOwnPropertySymbols(document).map(String).join(',');
  out.scroll = scrollX + ',' + scrollY + ',' + document.scrollingElement.scrollTop;
  out.active = document.activeElement ? document.activeElement.outerHTML.slice(0, 80) : 'null';
  const sel = getSelection();
  out.sel = sel.rangeCount + ':' + sel.type + ':' + String(sel);
  out.anims = document.getAnimations().map((a) => a.playState + '@' + Math.round(a.currentTime || 0)).join(',');
  out.title = document.title;
  out.hash = location.href + '|' + history.length;
  out.protoPollution = Object.getOwnPropertyNames(Object.prototype).length + ',' + Object.getOwnPropertyNames(Array.prototype).length + ',' + Object.getOwnPropertyNames(Element.prototype).length + ',' + Object.getOwnPropertyNames(HTMLElement.prototype).length + ',' + Object.getOwnPropertyNames(Node.prototype).length + ',' + Object.getOwnPropertyNames(EventTarget.prototype).length + ',' + Object.getOwnPropertyNames(Document.prototype).length + ',' + Object.getOwnPropertyNames(CSSStyleDeclaration.prototype).length;
  out.styleProps = [...document.querySelectorAll('*')].map((e) => e.style ? e.style.cssText : '').join('|');
  out.inert = [...document.querySelectorAll('*')].filter((e) => e.inert).length;
  out.dialogs = [...document.querySelectorAll('dialog')].map((d) => d.open + ':' + d.matches(':modal')).join(',');
  out.popovers = [...document.querySelectorAll('[popover]')].map((d) => d.matches(':popover-open')).join(',');
  out.details = [...document.querySelectorAll('details')].map((d) => d.open).join(',');
  out.media = [...document.querySelectorAll('video,audio')].map((m) => m.paused + ':' + m.currentTime).join(',');
  out.forms = [...document.querySelectorAll('input,textarea,select')].map((e) => e.value + ':' + e.checked + ':' + (e.selectionStart ?? '')).join('|');
  return out;
}

(async () => {
  const pages = {};
  for (const f of files) pages['/' + f] = { body: fs.readFileSync(path.join(DIR, f)) };
  const { base, close } = await serve(pages);
  const { browser, context } = await launch();
  let findings = 0;
  for (const f of files) {
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    try {
      await page.goto(base + '/' + f, { waitUntil: 'load' });
      await page.waitForTimeout(50);
      const listeners = async () => {
        const { result: w } = await client.send('Runtime.evaluate', { expression: 'window' });
        const { result: d } = await client.send('Runtime.evaluate', { expression: 'document' });
        const lw = await client.send('DOMDebugger.getEventListeners', { objectId: w.objectId });
        const ld = await client.send('DOMDebugger.getEventListeners', { objectId: d.objectId });
        return 'win:' + lw.listeners.map((l) => l.type + (l.useCapture ? 'c' : '')).sort().join(',') + ' doc:' + ld.listeners.map((l) => l.type + (l.useCapture ? 'c' : '')).sort().join(',');
      };
      // freeze animations' clock so anims compare
      await page.evaluate(() => { const t = document.querySelector("h1") || document.body; const r = document.createRange(); r.selectNodeContents(t); getSelection().removeAllRanges(); getSelection().addRange(r); });
      const before = await page.evaluate(snapshot);
      before.listeners = await listeners();
      await addBundle(page, base);
      const mid = await page.evaluate(snapshot);
      mid.listeners = await listeners();
      const res = await page.evaluate(async () => {
        try {
          const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, null);
          return r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ':' + String(c.error).slice(0, 100));
        } catch (e) {
          return ['THROW ' + e.message];
        }
      });
      await page.waitForTimeout(100);
      const after = await page.evaluate(snapshot);
      after.listeners = await listeners();
      const d = [];
      for (const k of Object.keys(before)) {
        if (k === 'anims') continue; // anims time moves
        if (mid[k] !== after[k]) {
          let a = mid[k], b = after[k];
          if (k === 'globals') {
            const A = new Set(a.split(',')), B = new Set(b.split(','));
            d.push(`${k}: +[${[...B].filter((x) => !A.has(x))}] -[${[...A].filter((x) => !B.has(x))}]`);
            continue;
          }
          // find first differing index
          let i = 0;
          while (i < a.length && a[i] === b[i]) i++;
          d.push(`${k}: ...${String(a).slice(Math.max(0, i - 120), i + 120)}  =>  ...${String(b).slice(Math.max(0, i - 120), i + 120)}`);
        }
      }
      if (before.anims.split(',').map((x) => x.split('@')[0]).join() !== after.anims.split(',').map((x) => x.split('@')[0]).join()) d.push('animPlayState: ' + before.anims + ' => ' + after.anims);
      if (d.length || res.length) {
        findings++;
        console.log('== ' + f);
        for (const x of res) console.log('  ruleError ' + x);
        for (const x of d) console.log('  ' + x.slice(0, 700));
      }
    } catch (e) {
      console.log('== ' + f + ' harness error ' + e.message);
    }
    await page.close();
  }
  console.log('files', files.length, 'with diffs', findings);
  await browser.close();
  close();
})();
