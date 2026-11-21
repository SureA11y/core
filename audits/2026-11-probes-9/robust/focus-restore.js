'use strict';
// Focus and in-field selection the user had before a scan: are they the same after it?
const { serve, launch, addBundle } = require('./lib');
const hidden = '<div aria-hidden="true"><a href="#h">hidden link</a></div><div aria-hidden="true"><input aria-label="hid"></div><div aria-hidden="true"><div contenteditable>hid</div></div>';
const page = (extra, setup) => `<!doctype html><html lang="en"><title>t</title><main><h1>x</h1>${extra}${hidden}</main><script>addEventListener('load',()=>{${setup}})</script>`;
const pages = {
  '/input-sel': { body: page('<input id=f aria-label=f value="hello world">', "const f=document.getElementById('f');f.focus();f.setSelectionRange(2,7,'backward');") },
  '/textarea-sel': { body: page('<textarea id=f aria-label=f>line one\nline two</textarea>', "const f=document.getElementById('f');f.focus();f.setSelectionRange(5,12);") },
  '/ce-caret': { body: page('<div id=f contenteditable role=textbox aria-label=e>abcdef</div>', "const f=document.getElementById('f');f.focus();const r=document.createRange();r.setStart(f.firstChild,3);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);") },
  '/shadow-input': { body: page('<x-h id=h></x-h>', "const s=document.getElementById('h').attachShadow({mode:'open'});s.innerHTML='<input id=i aria-label=s value=shadowtext>';const i=s.getElementById('i');i.focus();i.setSelectionRange(1,4);") },
  '/closed-shadow-input': { body: page('<x-h id=h></x-h>', "const s=document.getElementById('h').attachShadow({mode:'closed'});s.innerHTML='<input id=i aria-label=s value=closedtext>';window.__i=s.getElementById('i');__i.focus();__i.setSelectionRange(1,4);") },
  '/iframe-input': { body: page('<iframe id=fr title=f srcdoc="<input id=i aria-label=x value=frametext>"></iframe>', "const d=document.getElementById('fr').contentDocument;const i=d.getElementById('i');i.focus();i.setSelectionRange(2,5);") },
  '/select-focused': { body: page('<select id=f aria-label=s><option>a<option selected>b</select>', "document.getElementById('f').focus()") },
  '/button-focused-scrolled': { body: page('<div style="height:3000px"></div><button id=f>far button</button>', "document.getElementById('f').focus()") }
};
(async () => {
  const s = await serve(pages);
  const { browser, context } = await launch();
  for (const p of Object.keys(pages)) {
    const pg = await context.newPage();
    await pg.goto(s.base + p, { waitUntil: 'load' });
    await pg.waitForTimeout(100);
    await addBundle(pg, s.base);
    const state = () => pg.evaluate(() => {
      let a = document.activeElement;
      const chain = [];
      for (let i = 0; a && i < 5; i++) {
        chain.push(a.localName + (a.id ? '#' + a.id : ''));
        let inner = null;
        if (a.shadowRoot && a.shadowRoot.activeElement) inner = a.shadowRoot.activeElement;
        else if (a.localName === 'iframe' && a.contentDocument) inner = a.contentDocument.activeElement;
        if (a === window.__i) break;
        a = inner;
      }
      const leaf = window.__i && document.activeElement && document.activeElement.id === 'h' ? window.__i : (() => { let x = document.activeElement; for (;;) { if (x && x.shadowRoot && x.shadowRoot.activeElement) x = x.shadowRoot.activeElement; else if (x && x.localName === 'iframe' && x.contentDocument && x.contentDocument.activeElement !== x.contentDocument.body) x = x.contentDocument.activeElement; else break; } return x; })();
      const fsel = leaf && 'selectionStart' in leaf ? (() => { try { return `${leaf.selectionStart}-${leaf.selectionEnd}/${leaf.selectionDirection}`; } catch { return 'n/a'; } })() : '';
      const s = getSelection();
      const docsel = s.rangeCount ? `${s.type}@${s.anchorNode && (s.anchorNode.nodeName + ':' + (s.anchorNode.data || '').slice(0, 10))}:${s.anchorOffset}` : 'none';
      return `focus=${chain.join('>')} fieldSel=${fsel} docSel=${docsel} scrollY=${Math.round(scrollY)} hasFocus=${document.hasFocus()}`;
    });
    const b = await state();
    await pg.evaluate(() => { window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 0; });
    const a = await state();
    console.log(p.padEnd(26), b === a ? 'SAME   ' + b : 'CHANGED\n     before ' + b + '\n     after  ' + a);
    await pg.close();
  }
  await browser.close();
  s.close();
})();
