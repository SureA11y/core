const { chromium } = require('/home/user/core/node_modules/playwright');
const links = n => Array.from({length:n},(_,i)=>`<p><a id="l${i}" href="#${i}">Link ${i}</a></p>`).join('');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 for (const [label, html, scroller] of [
  ['scroll-margin', `<style>a{scroll-margin-top:90px}</style><header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`, null],
  ['no margin', `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`, null],
  ['sticky in scroller', `<div id="sc" style="height:300px;overflow:auto"><div style="position:sticky;top:0;height:60px;background:#fff">S</div>${links(30)}</div>`, 'sc'],
 ]) {
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.setContent('<!doctype html>' + html);
  // find a scroll such that link 10 is under the header
  const out = await p.evaluate(async (scroller) => {
    const sc = scroller ? document.getElementById(scroller) : document.scrollingElement;
    const l = document.getElementById('l10');
    const base = scroller ? sc.getBoundingClientRect().top : 0;
    sc.scrollTop += l.getBoundingClientRect().top - base - 20; // put link 10 20px below top
    await new Promise(r => requestAnimationFrame(r));
    document.getElementById('l11').focus({ preventScroll: true });
    return { before: l.getBoundingClientRect().top - base, scroll: sc.scrollTop };
  }, scroller);
  await p.keyboard.press('Shift+Tab');
  const after = await p.evaluate((scroller) => { const sc = scroller ? document.getElementById(scroller) : document.scrollingElement; const base = scroller ? sc.getBoundingClientRect().top : 0; const l = document.activeElement; const r = l.getBoundingClientRect(); const top = document.elementFromPoint(r.left + 2, r.top + r.height/2); return { id: l.id, top: r.top - base, scroll: sc.scrollTop, hitIsLink: top === l || l.contains(top) }; }, scroller);
  console.log(label, JSON.stringify(out), JSON.stringify(after));
  await p.close();
 }
 await b.close();
})();
