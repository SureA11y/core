// Is page state the same after a scan? Records every DOM mutation during the
// scan, and compares outerHTML, scroll positions, focus, selection,
// animations, media, open states and stylesheets before/after.
const h = require('./harness');
const html = `<!doctype html><html lang="en"><head><title>t</title>
<style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} .sp{animation:spin 4s linear infinite}
.tr{transition:all 2s} .tr:focus{outline:5px solid red; padding:20px} #sc{height:100px;overflow:auto} </style></head>
<body><main><h1>Head</h1>
<div style="height:1500px">tall</div>
<div id="sc"><div style="height:1000px;width:3000px">scroll me <a href="#" class="tr">l</a></div></div>
<p contenteditable id="ce">edit me here</p>
<input id="in" value="hello world"><textarea id="ta">abc</textarea>
<button class="tr">B</button><button></button><img src="q.png"><div class="sp">spin</div>
<details open><summary>S</summary>D</details><dialog id="dlg">Dlg <button>x</button></dialog>
<div popover id="pop">pop <a href="#">in pop</a></div>
<div aria-hidden="true"><a href="#">hidden link</a><button>hb</button></div>
<video id="v" src="data:," muted loop></video>
<p style="letter-spacing:1px;word-spacing:2px;line-height:1">tight text</p>
<div style="overflow:hidden;height:20px;width:50px;white-space:nowrap">clipped text clipped text clipped</div>
<x-host></x-host>
</main>
<script>
customElements.define('x-host', class extends HTMLElement{ constructor(){super(); const r=this.attachShadow({mode:'open'}); r.innerHTML='<button></button><input id=si value=shadow>'}});
window.__muts=[];
new MutationObserver((rs)=>{ for(const r of rs) window.__muts.push(r.type+':'+(r.target.nodeName||'')+':'+(r.attributeName||'')+':'+r.addedNodes.length+'/'+r.removedNodes.length+':'+(r.attributeName?String(r.oldValue).slice(0,40):'')); }).observe(document,{subtree:true,attributes:true,childList:true,characterData:true,attributeOldValue:true});
document.querySelectorAll('x-host').forEach(e=>new MutationObserver((rs)=>{for(const r of rs) window.__muts.push('shadow:'+r.type+':'+r.target.nodeName+':'+(r.attributeName||''))}).observe(e.shadowRoot,{subtree:true,attributes:true,childList:true}));
document.getElementById('pop').showPopover();
window.scrollTo(0, 400); document.getElementById('sc').scrollTop=37; document.getElementById('sc').scrollLeft=55;
const i=document.getElementById('in'); i.focus(); i.setSelectionRange(2,7,'backward');
window.__focusEvents=[]; ['focus','blur','focusin','focusout'].forEach(t=>document.addEventListener(t,e=>window.__focusEvents.push(t+':'+(e.target.id||e.target.nodeName)),true));
window.__otherEvents=[]; ['scroll','selectionchange','toggle','animationstart','transitionstart','transitionrun','resize','click','keydown','input','change','mouseover','pointerover'].forEach(t=>document.addEventListener(t,e=>window.__otherEvents.push(t+':'+(e.target.id||e.target.nodeName)),true));
</script></body></html>`;
function snap() {
  const sel = document.getSelection();
  const ae = document.activeElement;
  const anims = document.getAnimations().map((a) => a.playState + ':' + Math.round(a.currentTime / 100));
  return {
    html: document.documentElement.outerHTML.length + ':' + (function (s) { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x; })(document.documentElement.outerHTML),
    shadowHtml: document.querySelector('x-host').shadowRoot.innerHTML,
    scroll: [scrollX, scrollY, document.getElementById('sc').scrollTop, document.getElementById('sc').scrollLeft],
    active: ae && (ae.id || ae.nodeName),
    inputSel: [document.getElementById('in').selectionStart, document.getElementById('in').selectionEnd, document.getElementById('in').selectionDirection],
    docSel: sel && sel.rangeCount ? [sel.anchorNode && sel.anchorNode.nodeName, sel.anchorOffset, sel.type] : null,
    anims,
    styleSheets: document.styleSheets.length + '/' + document.adoptedStyleSheets.length,
    popoverOpen: document.getElementById('pop').matches(':popover-open'),
    dialogOpen: document.getElementById('dlg').open,
    details: document.querySelector('details').open,
    hasFocus: document.hasFocus(),
    title: document.title,
    focusVisible: !!document.querySelector(':focus-visible'),
    computedPad: getComputedStyle(document.querySelector('button.tr')).padding,
    muts: window.__muts.length,
  };
}
(async () => {
  const b = await h.browser();
  const ctx = await b.newContext(); const page = await ctx.newPage();
  const fs = require('fs'), path = require('path');
  const f = path.join(__dirname, 'tmp', 'state.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html);
  await page.goto('file://' + f); await page.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(page);
  await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
  await h.cdpEval(cdp, 'window.__snap=' + snap.toString() + ';void 0', 1000);
  const before = await h.cdpEval(cdp, 'window.__muts.length=0;window.__focusEvents.length=0;window.__otherEvents.length=0;window.__snap()', 5000);
  const scan = await h.cdpEval(cdp, '(function(){const t=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,{},null);return {ms:performance.now()-t, fails:r.checksResults.filter(c=>c.outcome==="fail").map(c=>c.ruleId)}})()', 60000);
  const after = await h.cdpEval(cdp, 'window.__snap()', 5000);
  await page.waitForTimeout(200);
  const later = await h.cdpEval(cdp, '({snap:window.__snap(), muts:window.__muts.slice(0,60), mutCount: window.__muts.length, focusEvents: window.__focusEvents.slice(0,40), focusCount: window.__focusEvents.length, other: window.__otherEvents.slice(0,40), otherCount: window.__otherEvents.length})', 5000);
  console.log('scan ms', Math.round(scan.ms));
  for (const k of Object.keys(before)) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) console.log('CHANGED', k, JSON.stringify(before[k]), '->', JSON.stringify(after[k]));
  console.log('mutations during scan (recorded after microtasks):', later.mutCount); console.log(later.muts.join('\n'));
  console.log('focus events:', later.focusCount, later.focusEvents.join(' '));
  console.log('other events:', later.otherCount, later.other.join(' '));
  await ctx.close(); await h.closeBrowser();
})();
