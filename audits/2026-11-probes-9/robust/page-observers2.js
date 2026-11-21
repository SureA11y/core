'use strict';
// What a page's own observers and listeners see during and after a scan of the combined fixtures page.
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const html = fs.readFileSync(__dirname + '/' + (process.argv[2] || 'combined.html'), 'utf8');
const spy = `<script>
window.__seen={mut:[],ev:{}};
new MutationObserver((recs)=>{for(const r of recs){const d=(n)=>n.nodeType===1?n.localName+(n.getAttribute&&n.getAttribute('data-surea11y')!=null?'[data-surea11y]':''):'#'+n.nodeName;__seen.mut.push(r.type+':'+(r.type==='childList'?('+'+[...r.addedNodes].map(d).join(',')+' -'+[...r.removedNodes].map(d).join(',')+' in '+r.target.nodeName):(r.attributeName+' on '+r.target.nodeName)))}}).observe(document,{subtree:true,childList:true,attributes:true,characterData:true});
for(const t of ['load','error','focus','blur','focusin','focusout','scroll','scrollend','resize','selectionchange','animationstart','animationend','animationcancel','transitionrun','transitionstart','transitionend','transitioncancel','toggle','beforetoggle','slotchange','visibilitychange','securitypolicyviolation','DOMContentLoaded','input','change','invalid','fullscreenchange','pointerover','mouseover']){document.addEventListener(t,(e)=>{__seen.ev[t]=(__seen.ev[t]||0)+1},true)}
</script>`;
(async () => {
  const s = await serve({ '/c': { body: html.replace('<head>', '<head>' + spy) } });
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto(s.base + '/c');
  await page.waitForTimeout(1500);
  await addBundle(page, s.base);
  await page.evaluate(() => { window.__seen = { mut: [], ev: {} }; });
  if (!process.env.NOSCAN) await page.evaluate(() => { window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 0; });
  await page.waitForTimeout(1500);
  const seen = await page.evaluate(() => window.__seen);
  const agg = {};
  for (const m of seen.mut) agg[m] = (agg[m] || 0) + 1;
  console.log('events seen by page capture listeners on document:', JSON.stringify(seen.ev));
  console.log('mutation records:', seen.mut.length);
  for (const [k, v] of Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log('  ', v, k);
  await browser.close();
  s.close();
})();
