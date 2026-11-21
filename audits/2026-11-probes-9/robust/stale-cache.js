'use strict';
// Scan, change the page, scan again: is the second scan the same as a scan of a fresh page with
// the same change? (stale per-element caches kept between scans)
const fs = require('fs');
const { serve, launch, addBundle, diff } = require('./lib');
const html = fs.readFileSync(__dirname + '/' + (process.argv[2] || 'combined.html'), 'utf8');
const muts = {
  altRemoved: "for (const i of document.querySelectorAll('img[alt]')) i.removeAttribute('alt')",
  ariaHiddenMain: "for (const s of document.querySelectorAll('section:nth-of-type(2n)')) s.setAttribute('aria-hidden','true')",
  styleColor: "const st=document.createElement('style');st.textContent='p,span,a,li,td,label{color:#bbb!important;background:#fff!important}';document.head.appendChild(st)",
  inlineHide: "for (const s of document.querySelectorAll('section:nth-of-type(3n)')) s.style.display='none'",
  classToggle: "document.body.classList.add('x');const st=document.createElement('style');st.textContent='.x button{visibility:hidden}';document.head.appendChild(st)",
  textChange: "for (const b of document.querySelectorAll('button,a')) b.textContent=''",
  roleChange: "for (const d of document.querySelectorAll('div')) if (!d.hasAttribute('role')) d.setAttribute('role','button')",
  idsChange: "let k=0;for (const e of document.querySelectorAll('[id]')) e.id='z'+(k++%50)",
  labelsGone: "for (const l of document.querySelectorAll('label')) l.remove()",
  langChange: "document.documentElement.lang='zz-invalid-'",
  titleGone: "document.title=''",
  shadowAdd: "for (const s of [...document.querySelectorAll('section')].slice(0,40)) { const h=document.createElement('div'); s.prepend(h); h.attachShadow({mode:'open'}).innerHTML='<button></button><img src=q>'; }",
  resize: null
};
(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  const scan = (page) => page.evaluate(() => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
    const out = {};
    for (const c of r.checksResults) out[c.ruleId] = c.outcome + ' x' + (c.occurrences || []).length;
    return out;
  });
  for (const [name, code] of Object.entries(muts)) {
    const apply = async (p) => {
      if (code) await p.evaluate((c) => (0, eval)(c), code);
      else await p.setViewportSize({ width: 320, height: 640 });
      await p.waitForTimeout(100);
    };
    const p1 = await context.newPage();
    await p1.goto(s.base + '/c');
    await addBundle(p1, s.base);
    await scan(p1);
    await apply(p1);
    const second = await scan(p1);
    await p1.close();
    const p2 = await context.newPage();
    await p2.goto(s.base + '/c');
    await addBundle(p2, s.base);
    await apply(p2);
    const fresh = await scan(p2);
    await p2.close();
    const d = diff(fresh, second);
    console.log(name.padEnd(16), d.length ? 'STALE? ' + d.length + '\n    fresh -> rescanned: ' + d.join('\n    ') : 'same');
  }
  await browser.close();
  s.close();
})();
