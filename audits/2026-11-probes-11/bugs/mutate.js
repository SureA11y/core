// Checks what a full Chromium scan leaves changed: DOM, focus, scroll positions, form state, selection, media, animations, CSS custom state.
const CORE='/home/user/core-r11';
const { chromium } = require(CORE+'/node_modules/playwright');
const html = require('fs').readFileSync(process.argv[2], 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: Number(process.argv[3]||1280), height: 700 } });
  await p.setContent(html, { waitUntil: 'load' });
  const snap = () => p.evaluate(() => {
    const out = {};
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('script').forEach(s => { if (/a11ycore|surea11y/.test(s.textContent.slice(0, 5000)) || s.textContent.length > 100000) s.remove(); });
    out.html = clone.outerHTML;
    out.active = document.activeElement && (document.activeElement.id || document.activeElement.tagName);
    out.scroll = [scrollX, scrollY];
    out.scrollers = [...document.querySelectorAll('*')].filter(e => e.scrollTop || e.scrollLeft).map(e => (e.id||e.tagName) + ':' + e.scrollTop + ',' + e.scrollLeft);
    out.values = [...document.querySelectorAll('input,select,textarea')].map(e => (e.id||e.name) + '=' + (e.type==='checkbox'||e.type==='radio' ? e.checked : e.value));
    out.details = [...document.querySelectorAll('details')].map(d => d.open);
    out.dialogs = [...document.querySelectorAll('dialog')].map(d => d.open);
    out.popovers = [...document.querySelectorAll('[popover]')].map(d => d.matches(':popover-open'));
    out.anims = document.getAnimations().map(a => a.playState + '@' + Math.round(a.currentTime/100));
    out.sel = String(getSelection());
    out.title = document.title;
    out.sheets = document.styleSheets.length + ':' + [...document.styleSheets].map(s => { try { return s.cssRules.length } catch { return 'x' } }).join(',');
    out.adopted = document.adoptedStyleSheets.length;
    out.media = [...document.querySelectorAll('video,audio')].map(m => m.paused + ':' + m.muted + ':' + m.volume);
    out.globals = Object.keys(window).filter(k => !/^a11ycore|^__a11y|^__surea11y/.test(k)).length;
    out.bodyStyle = document.body.getAttribute('style') + '|' + document.documentElement.getAttribute('style');
    out.events = window.__ev || [];
    return out;
  });
  await p.evaluate(() => { window.__ev = []; ['focus','blur','focusin','focusout','scroll','resize','click','keydown','mouseover','pointerover','toggle','animationstart','transitionstart','transitionend','beforetoggle','input','change','selectionchange'].forEach(t => window.addEventListener(t, e => window.__ev.push(t + ':' + (e.target && (e.target.id || e.target.tagName || 'win'))), true)); });
  const before = await snap();
  await p.addScriptTag({ path: CORE+'/surea11y.browser.js' });
  const r = await p.evaluate(() => { const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null); return { n: r.checksResults.length, errs: r.checksResults.filter(c => c.outcome === 'error').map(c => c.ruleId + ':' + JSON.stringify(c.error||c.message||'').slice(0,200)) }; });
  await p.waitForTimeout(400);
  const after = await snap();
  console.log('rules', r.n, 'errors', JSON.stringify(r.errs));
  for (const k of Object.keys(before)) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
    if (k === 'html') { const a = before.html, c = after.html; let i = 0; while (a[i] === c[i]) i++; console.log('CHANGED html at', i, '\n  before:', JSON.stringify(a.slice(Math.max(0,i-100), i+150)), '\n  after: ', JSON.stringify(c.slice(Math.max(0,i-100), i+150))); }
    else console.log('CHANGED', k, '\n  before:', JSON.stringify(before[k]).slice(0,600), '\n  after: ', JSON.stringify(after[k]).slice(0,1500));
  }
  await b.close();
})();
