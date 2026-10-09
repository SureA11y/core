// Does the scan's animation settling (dom-runner.js settleAnimations) fire
// events or resolve promises the page listens to?
const h = require('./harness');
const html = `<!doctype html><html lang="en"><head><title>t</title><style>
@keyframes fade{from{opacity:0}to{opacity:1}} @keyframes slide{from{transform:translateX(0)}to{transform:translateX(100px)}}
.a{animation:fade 10s 1} .b{animation:slide 3s infinite} .c{transition:opacity 10s} .c.go{opacity:.2}
.d{animation:fade 10s 1 forwards}
</style></head><body><main><h1>H</h1><p class="a">fading in</p><p class="b">marquee</p><p class="c" id="c">transition</p><p class="d">fwd</p></main>
<script>
window.__ev=[];
for (const t of ['animationend','animationiteration','animationstart','animationcancel','transitionend','transitioncancel','transitionstart','transitionrun'])
  document.addEventListener(t, e=>window.__ev.push(t+':'+e.target.className), true);
const wa = document.querySelector('.a').animate([{color:'red'},{color:'blue'}],{duration:10000});
wa.onfinish=()=>window.__ev.push('waapi-finish'); wa.finished.then(()=>window.__ev.push('waapi-finished-promise'));
document.getAnimations().forEach(a=>{ a.addEventListener('finish',()=>window.__ev.push('finish:'+(a.animationName||a.transitionProperty||'waapi'))); a.finished.then(()=>window.__ev.push('finished-promise:'+(a.animationName||a.transitionProperty||'waapi'))) });
requestAnimationFrame(()=>{ document.getElementById('c').classList.add('go'); requestAnimationFrame(()=>{ document.getAnimations().forEach(a=>{ if(a.transitionProperty){ a.addEventListener('finish',()=>window.__ev.push('finish:transition')); a.finished.then(()=>window.__ev.push('finished-promise:transition'))}}); window.__ready=1 }) });
</script></body></html>`;
(async () => {
  const b = await h.browser(); const ctx = await b.newContext(); const page = await ctx.newPage();
  const fs = require('fs'), path = require('path'); const f = path.join(__dirname, 'tmp', 'anim.html'); fs.writeFileSync(f, html);
  await page.goto('file://' + f); await page.waitForFunction(() => window.__ready === 1); await page.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(page);
  await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
  const before = await h.cdpEval(cdp, 'window.__ev.length=0; document.getAnimations().map(a=>a.playState+":"+Math.round(a.currentTime))', 5000);
  const r = await h.cdpEval(cdp, '(function(){const r=a11ycore.runa11yCoreInPage(location.href,null,{},null);return r.engine.environment})()', 60000);
  const after = await h.cdpEval(cdp, 'document.getAnimations().map(a=>a.playState+":"+Math.round(a.currentTime))', 5000);
  await page.waitForTimeout(500);
  const ev = await h.cdpEval(cdp, 'window.__ev', 5000);
  console.log('env', JSON.stringify(r));
  console.log('before', before.join(' '), '\nafter ', after.join(' '));
  console.log('events fired within 500ms after the scan:', JSON.stringify(ev));
  await ctx.close(); await h.closeBrowser();
})();
