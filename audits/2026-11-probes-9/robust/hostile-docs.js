'use strict';
// Odd documents and hostile pages, in Chromium: does a scan finish, without
// errors, and say something sensible?
const { serve, launch, addBundle } = require('./lib');

const deep = (n, tag = 'div') => '<' + tag + '>'.repeat(1) + Array(n).fill('<' + tag + '>').join('') + '<button></button>' + Array(n).fill('</' + tag + '>').join('');
const pages = {
  '/xhtml': { type: 'application/xhtml+xml', body: `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head><title>X</title></head><body><main><h1>Hi</h1><img src="a.png"/><button></button><a href="#x">link</a><svg xmlns="http://www.w3.org/2000/svg" role="img"><circle r="3"/></svg><table><tr><th>a</th></tr><tr><td>1</td></tr></table><input/></main></body></html>` },
  '/xhtml-nolang': { type: 'application/xhtml+xml', body: `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr"><head><title>X</title></head><body><p>Bonjour</p></body></html>` },
  '/xml': { type: 'application/xml', body: `<?xml version="1.0"?><root><item>hi</item><img/></root>` },
  '/svgdoc': { type: 'image/svg+xml', body: `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><title>S</title><a xlink:href="#x"><circle r="20" cx="30" cy="30"/></a><text x="10" y="100" fill="#eee">low contrast</text><foreignObject width="100" height="50"><button xmlns="http://www.w3.org/1999/xhtml"></button></foreignObject></svg>` },
  '/frameset': { body: `<!doctype html><html lang="en"><head><title>F</title></head><frameset cols="50%,50%"><frame src="/plain"><frame src="/plain" title="two"></frameset></html>` },
  '/plain': { body: `<!doctype html><html lang="en"><title>P</title><main><h1>Plain</h1><img src="x.png"><button></button></main>` },
  '/docwrite': { body: `<!doctype html><html lang="en"><head><title>W</title></head><body><script>document.write('<main><h1>W</h1><img src=q.png><button></button></main>')</script></body></html>` },
  '/docopen': { body: `<!doctype html><html lang="en"><head><title>O</title></head><body><script>addEventListener('load',()=>{document.open();document.write('<p>rewritten</p><button></button>');document.close();})</script></body></html>` },
  '/nobody': { body: `<!doctype html><html lang="en"><head><title>nb</title></head></html>` },
  '/nohtmlel': { body: '' },
  '/body-removed': { body: `<!doctype html><html lang="en"><title>t</title><body><p>x</p><script>document.body.remove()</script>` },
  '/html-removed': { body: `<!doctype html><html lang="en"><title>t</title><body><p>x</p><script>document.documentElement.remove()</script>` },
  '/root-is-svg': { body: `<!doctype html><html><body><script>const s=document.createElementNS('http://www.w3.org/2000/svg','svg');document.replaceChild(s,document.documentElement)</script>` },
  '/root-is-div': { body: `<!doctype html><html><body><script>const s=document.createElement('div');s.innerHTML='<button></button><img src=x>';document.replaceChild(s,document.documentElement)</script>` },
  '/deep10k': { body: `<!doctype html><html lang="en"><title>d</title><main><h1>d</h1>${deep(10000)}</main>` },
  '/deep10k-span-text': { body: `<!doctype html><html lang="en"><title>d</title><main><h1>d</h1><a href="#">${'<span>'.repeat(10000)}deep text${'</span>'.repeat(10000)}</a></main>` },
  '/deep-shadow': { body: `<!doctype html><html lang="en"><title>ds</title><main><h1>ds</h1><div id=r></div></main><script>let h=document.getElementById('r');for(let i=0;i<500;i++){const s=h.attachShadow({mode:'open'});const d=document.createElement('div');s.appendChild(d);h=d;}h.innerHTML='<button></button><img src=x>';</script>` },
  '/deep-closed-shadow': { body: `<!doctype html><html lang="en"><title>ds</title><main><h1>ds</h1><div id=r></div></main><script>let h=document.getElementById('r');for(let i=0;i<200;i++){const s=h.attachShadow({mode:i%2?'closed':'open'});const d=document.createElement('div');s.appendChild(d);h=d;}h.innerHTML='<button></button>';</script>` },
  '/decl-shadow': { body: `<!doctype html><html lang="en"><title>dsd</title><main><h1>dsd</h1><x-a><template shadowrootmode="open"><button></button><slot></slot><x-b><template shadowrootmode="open"><img src="y.png"><a href="#"></a></template></x-b></template><span>light</span></x-a><x-c><template shadowrootmode="closed"><button></button></template></x-c></main>` },
  '/huge-attr': { body: `<!doctype html><html lang="en"><title>h</title><main><h1>h</h1><img src="data:image/png;base64,${'A'.repeat(5e6)}" alt="${'word '.repeat(200000)}"><a href="#" aria-label="${'x'.repeat(2e6)}">a</a><div class="${'c '.repeat(500000)}" id="${'i'.repeat(1e6)}">t</div><button aria-describedby="${Array.from({ length: 50000 }, (_, i) => 'id' + i).join(' ')}">b</button><div role="${'button '.repeat(100000)}">r</div><p lang="${'en-'.repeat(100000)}x">t</p><p style="color:${'red;'.repeat(1)} ${'--a:1;'.repeat(100000)}">styled</p></main>` },
  '/iframes': { body: `<!doctype html><html lang="en"><title>if</title><main><h1>if</h1>
    <iframe title="same" src="/plain"></iframe>
    <iframe src="/plain"></iframe>
    <iframe title="sandboxed" sandbox src="/plain"></iframe>
    <iframe title="sandbox-scripts" sandbox="allow-scripts" src="/plain"></iframe>
    <iframe title="srcdoc" srcdoc="<button></button><iframe srcdoc='<img src=z>'></iframe>"></iframe>
    <iframe title="cross" src="http://localhost:PORT/plain"></iframe>
    <iframe title="blank"></iframe>
    <iframe title="js" src="javascript:'<button></button>'"></iframe>
    <iframe title="data" src="data:text/html,<button></button>"></iframe>
    <iframe title="404" src="/nope"></iframe>
    <iframe title="svg" src="/svgdoc"></iframe>
    <iframe title="xml" src="/xml"></iframe>
    <object data="/plain" type="text/html"></object><embed src="/plain" type="text/html">
    </main>` },
  '/base': { body: `<!doctype html><html lang="en"><head><title>b</title><base href="javascript:alert(1)//"></head><body><main><h1>b</h1><a href="#top">top</a><a href="page">rel</a><img src="x.png"><a href="http://[::1">bad</a><a href="%%%">pct</a><a href="#\u0000">nul</a></main></body></html>` },
  '/base2': { body: `<!doctype html><html lang="en"><head><title>b</title><base href="http://example.invalid/sub/"></head><body><main><h1>b</h1><a href="#main">skip</a><div id="main">x</div><a href="">empty</a><a href="?q=1">q</a></main></body></html>` },
  '/navigate-during': { body: `<!doctype html><html lang="en"><title>n</title><main><h1>n</h1><a href="#">a</a></main><script>document.addEventListener('focusin',()=>{location.hash='#moved'+Math.random()});</script>` },
  '/mutating': { body: `<!doctype html><html lang="en"><title>m</title><main><h1>m</h1><div id=box></div></main><script>new MutationObserver(()=>{}).observe(document,{subtree:true,childList:true,attributes:true});const b=document.getElementById('box');let i=0;const tick=()=>{b.innerHTML='<button>'+(i++)+'</button><img src=x'+i+'>';};document.addEventListener('scroll',tick,true);document.addEventListener('focusin',tick,true);window.addEventListener('resize',tick);setInterval(tick,0)</script>` },
  '/custom-el-side': { body: `<!doctype html><html lang="en"><title>c</title><main><h1>c</h1><x-side>t</x-side><x-side2>u</x-side2></main><script>
    let n=0;customElements.define('x-side',class extends HTMLElement{connectedCallback(){n++;}attributeChangedCallback(){this.parentNode.appendChild(document.createElement('x-side'))}static get observedAttributes(){return ['class','style','tabindex','aria-hidden','inert']}get role(){window.__roleReads=(window.__roleReads||0)+1;return 'button'}});
    customElements.define('x-side2',class extends HTMLElement{get shadowRoot(){throw new Error('nope')} get ariaLabel(){throw new Error('no')} getAttribute(n){if(n==='role')throw new Error('role');return super.getAttribute(n)}});</script>` },
  '/throwing-getters': { body: `<!doctype html><html lang="en"><title>t</title><main><h1>t</h1><button id=b>ok</button><a href=# id=a>l</a></main><script>for(const k of ['tabIndex','hidden','inert','isConnected','assignedSlot','labels','form','validity','ariaLabel','ariaHidden','dataset','style','classList','role']){try{Object.defineProperty(HTMLElement.prototype,k,{get(){throw new Error('getter '+k)},configurable:true})}catch(e){}}</script>` }
};

(async () => {
  const srv = await serve(pages);
  const port = srv.base.split(':').pop();
  pages['/iframes'].body = pages['/iframes'].body.replace('PORT', port);
  const { browser, context } = await launch();
  const only = process.argv[2];
  for (const p of Object.keys(pages)) {
    if (only && !p.includes(only)) continue;
    if (p === '/plain') continue;
    const page = await context.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror ' + String(e).slice(0, 120)));
    page.on('dialog', (d) => { errs.push('dialog ' + d.message()); d.dismiss(); });
    let line = p + ': ';
    try {
      await page.goto(srv.base + p, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(100);
      // XML documents: addScriptTag appends to head which may not exist
      await page.evaluate(async (src) => {
        await new Promise((res, rej) => {
          const s = document.createElementNS('http://www.w3.org/1999/xhtml', 'script');
          s.src = src; s.onload = res; s.onerror = () => rej(new Error('load fail'));
          (document.head || document.documentElement || document).appendChild(s);
        });
      }, srv.base + '/surea11y.browser.js').catch((e) => { line += 'bundle-add failed: ' + e.message.slice(0, 100) + ' '; });
      const t = Date.now();
      const r = await Promise.race([
        page.evaluate(async () => {
          try {
            const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, null);
            const errs = r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + String(c.error).slice(0, 140));
            const notNA = r.checksResults.filter((c) => c.outcome !== 'notApplicable' && c.outcome !== 'pass').map((c) => c.ruleId + '=' + c.outcome + 'x' + (c.occurrences || []).length);
            return { ok: true, errs, notNA, warnings: (r.warnings || []).map(String).slice(0, 5), frames: r.frames ? JSON.stringify(r.frames).slice(0, 300) : undefined };
          } catch (e) {
            return { ok: false, msg: String(e && e.stack || e).slice(0, 500), code: e && e.code };
          }
        }),
        new Promise((res) => setTimeout(() => res({ ok: false, msg: 'TIMEOUT 120s' }), 120000))
      ]);
      line += `${Date.now() - t}ms ` + JSON.stringify(r, null, 0).slice(0, 2500);
    } catch (e) {
      line += 'HARNESS ' + e.message.slice(0, 300);
    }
    console.log(line + (errs.length ? '\n   ' + errs.join(' | ') : ''));
    await page.close().catch(() => {});
  }
  await browser.close();
  srv.close();
})();
