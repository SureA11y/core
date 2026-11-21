'use strict';
// Does a scan reach the page's own code? Listeners for focus/scroll/resize/pointer/etc., MutationObserver,
// ResizeObserver, IntersectionObserver, custom element callbacks, style/class reads, location/history changes.
// node side-effects.js [bundle]
const fs = require('fs');
const C = require('./chrome-lib.js');
const BUNDLE = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : C.BUNDLE;
const PAGE = `<!DOCTYPE html><html lang="en"><head><title>T</title>
<style>.sticky{position:sticky;top:0;background:#fff;height:60px} .fixed{position:fixed;bottom:0;height:50px;width:100%;background:#eee}
a:focus,button:focus{outline:2px solid blue} body{margin:0} .wide{width:1400px}</style></head><body>
<header class="sticky"><nav><a href="#m">Skip</a> <a href="/a">A</a></nav></header>
<main id="m"><h1>Title</h1>
${Array.from({ length: 40 }, (_, i) => `<p>Para ${i} <a href="/l${i}">link ${i}</a> <button>b${i}</button> <input aria-label="f${i}"></p>`).join('')}
<x-el tabindex="0">custom</x-el><details><summary>More</summary><p>hidden</p></details>
<dialog id="d"><button>close</button></dialog><div popover id="pop">pop</div>
<div style="overflow:auto;height:80px"><div style="height:400px">scroll box <a href="/s">s</a></div></div>
<marquee>moving</marquee><div class="wide">wide</div>
<iframe srcdoc="<button>in frame</button><a href='/x'>x</a>"></iframe>
</main><div class="fixed">cookie bar <button>OK</button></div>
<script>
window.__ev = {};
const bump = (k) => { window.__ev[k] = (window.__ev[k] || 0) + 1; };
for (const t of ['focus','blur','focusin','focusout','scroll','resize','pointerover','pointerenter','mouseover','mouseenter','mousemove','click','keydown','keyup','input','change','select','selectionchange','toggle','beforetoggle','animationstart','transitionstart','visibilitychange','load','hashchange','popstate','wheel','touchstart','contextmenu','copy','beforeinput','invalid','cancel','close','securitypolicyviolation','DOMContentLoaded','fullscreenchange','scrollend'])
  { window.addEventListener(t, () => bump('win:' + t), true); document.addEventListener(t, () => bump('doc:' + t), true); }
new MutationObserver((ms) => { for (const m of ms) bump('mut:' + m.type + ':' + (m.attributeName || (m.target.nodeName))); }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
new ResizeObserver((es) => { if (window.__roReady) bump('resize-observer:' + es.length); }).observe(document.querySelector('main'));
setTimeout(() => { window.__roReady = true; }, 300);
const io = new IntersectionObserver((es) => { if (window.__ioReady) bump('intersection:' + es.length); });
document.querySelectorAll('button').forEach((b) => io.observe(b));
setTimeout(() => { window.__ioReady = true; }, 300);
customElements.define('x-el', class extends HTMLElement {
  static get observedAttributes() { return ['style', 'class', 'tabindex', 'aria-label', 'hidden', 'inert']; }
  attributeChangedCallback(n) { if (window.__ready) bump('ce-attr:' + n); }
  connectedCallback() { if (window.__ready) bump('ce-connected'); }
  disconnectedCallback() { if (window.__ready) bump('ce-disconnected'); }
});
const hs = history.length; window.__hs = hs;
</script></body></html>`;
(async () => {
  const b = await C.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.setContent(PAGE);
  await p.waitForTimeout(600);
  await p.evaluate(() => { window.__ready = true; window.__ev = {}; });
  await p.evaluate(BUNDLE);
  const before = await p.evaluate(() => ({ url: location.href, hist: history.length, scroll: [scrollX, scrollY], active: document.activeElement && document.activeElement.outerHTML.slice(0, 40), title: document.title, w: innerWidth, h: innerHeight }));
  await p.evaluate(() => { window.__ev = {}; });
  const scan = await p.evaluate(() => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
    return { errors: r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ':' + c.error), syncEvents: { ...window.__ev } };
  });
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({ url: location.href, hist: history.length, scroll: [scrollX, scrollY], active: document.activeElement && document.activeElement.outerHTML.slice(0, 40), title: document.title, w: innerWidth, h: innerHeight, events: { ...window.__ev }, globals: Object.keys(window).filter((k) => /a11y|surea11y/i.test(k)) }));
  console.log(JSON.stringify({ errors: scan.errors, syncEvents: scan.syncEvents, asyncEvents: after.events, before, after: { ...after, events: undefined } }, null, 1));
  await b.close();
})();
