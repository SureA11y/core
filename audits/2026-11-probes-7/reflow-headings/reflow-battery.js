const h = require('./harness');
const R = 'reflow-horizontal-scroll';
const cases = [
 ['baseline-fits', '<p>Hello world</p>'],
 ['carousel-direct-children-ul', `<ul style="display:flex;overflow-x:auto;gap:8px;padding:0;margin:0;list-style:none">${[1,2,3,4].map(i=>`<li style="flex:0 0 85%"><img alt="" style="width:100%;height:80px;background:#ccc"><p>Item ${i} description text that wraps nicely.</p></li>`).join('')}</ul>`],
 ['carousel-track-wrapper', `<div style="overflow-x:auto"><div style="display:flex;gap:8px">${[1,2,3,4].map(i=>`<div style="flex:0 0 280px"><p>Item ${i} description text that wraps nicely.</p></div>`).join('')}</div></div>`],
 ['carousel-cards-with-qty-input', `<ul style="display:flex;overflow-x:auto;gap:8px;padding:0;margin:0;list-style:none">${[1,2,3,4].map(i=>`<li style="flex:0 0 85%"><p>Product ${i}</p><label>Qty <input type="number" value="1" style="width:200px"></label></li>`).join('')}</ul>`],
 ['carousel-track-cards-with-input', `<div style="overflow-x:auto"><div style="display:flex;gap:8px">${[1,2,3,4].map(i=>`<div style="flex:0 0 260px"><p>Product ${i}</p><label>Qty <input type="number" value="1" style="width:200px"></label></div>`).join('')}</div></div>`],
 ['chip-row-sr-only-checkboxes', `<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}</style><div style="display:flex;overflow-x:auto;gap:6px;white-space:nowrap">${['Red','Green','Blue','Yellow','Purple','Orange','Black','White'].map(c=>`<label style="position:relative;border:1px solid;padding:4px 10px;border-radius:12px"><input type=checkbox class=sr>${c}</label>`).join('')}</div>`],
 ['chip-row-opacity-checkboxes', `<div style="display:flex;overflow-x:auto;gap:6px;white-space:nowrap">${['Red','Green','Blue','Yellow','Purple','Orange','Black','White'].map(c=>`<label style="position:relative;border:1px solid;padding:4px 10px"><input type=checkbox style="position:absolute;inset:0;opacity:0;margin:0;width:100%;height:100%">${c}</label>`).join('')}</div>`],
 ['tab-bar-scroll', `<div role=tablist style="display:flex;overflow-x:auto;white-space:nowrap">${['Overview','Specifications','Reviews','Questions','Shipping'].map(t=>`<button role=tab style="padding:8px 16px">${t}</button>`).join('')}</div>`],
 ['inline-span-overflow-hidden', `<p>x <span style="overflow:hidden"><img style="width:600px;height:20px;display:inline-block;background:#ccc" alt="x"></span></p>`],
 ['rtl-scroll-box-field', `<html dir=rtl><body><div style="overflow-x:auto"><form style="display:flex;gap:8px"><input style="width:200px"><input style="width:200px"></form></div></body></html>`],
 ['ltr-scroll-box-field', `<div style="overflow-x:auto"><form style="display:flex;gap:8px"><input style="width:200px"><input style="width:200px"></form></div>`],
 ['rtl-wide', `<html dir=rtl><body><div style="width:500px">مرحبا</div></body></html>`],
 ['sticky-header-wide', `<header style="position:sticky;top:0;width:400px;background:#eee">Header</header><p>x</p>`],
 ['clip-margin-within', `<div style="overflow:clip;overflow-clip-margin:40px;width:280px"><div style="width:300px">text inside margin area that is long enough to cross</div></div>`],
 ['clip-margin-contentbox', `<div style="overflow:clip;overflow-clip-margin:content-box 40px;width:260px;padding:0 10px"><div style="width:300px;background:#eee">text text text</div></div>`],
 ['dialog-modal-wide', `<dialog id=d style="width:400px;max-width:none">Wide dialog content <input></dialog><script>document.getElementById('d').showModal()</script>`],
 ['popover-wide', `<div popover id=p style="width:400px">Popover content</div><script>document.getElementById('p').showPopover()</script>`],
 ['shadow-wide', `<div id=host></div><script>const s=document.getElementById('host').attachShadow({mode:'open'});s.innerHTML='<div style="width:500px">Shadow wide</div>'</script>`],
 ['grid-fixed-cols', `<div style="display:grid;grid-template-columns:repeat(3,150px)"><div>a</div><div>b</div><div>c</div></div>`],
 ['container-query-ok', `<style>.c{container-type:inline-size}@container (max-width:400px){.x{width:100%}}.x{width:600px}</style><div class=c><div class=x>Text</div></div>`],
 ['transform-scale', `<div style="width:200px;transform:scale(2);transform-origin:0 0">scaled</div>`],
 ['zoom-2', `<div style="width:200px;zoom:2">zoomed</div>`],
 ['vertical-body', `<body style="writing-mode:vertical-rl"><div style="width:500px">x</div></body>`],
 ['vertical-sub', `<div style="writing-mode:vertical-rl;height:100px">縦書きのテキストです縦書きのテキストです縦書きのテキストです縦書きのテキストです縦書きのテキストです</div>`],
 ['iframe-wide', `<iframe style="width:500px;height:100px" srcdoc="<p>hi</p>"></iframe>`],
 ['subgrid', `<div style="display:grid;grid-template-columns:1fr 1fr"><div style="display:grid;grid-column:1/3;grid-template-columns:subgrid"><div>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</div><div>b</div></div></div>`],
 ['long-url-no-wrap', `<p>Visit https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa for more</p>`],
 ['cookie-banner-fixed-wide', `<div style="position:fixed;bottom:0;left:0;width:400px;background:#eee">We use cookies. <button>Accept</button></div><p>x</p>`],
 ['offcanvas-abs-opacity', `<nav style="position:absolute;top:0;right:0;width:280px;transform:translateX(100%);opacity:0">Menu link link</nav><p>x</p>`],
 ['offcanvas-abs-vis-hidden', `<nav style="position:absolute;top:0;right:0;width:280px;transform:translateX(100%);visibility:hidden">Menu link link</nav><p>x</p>`],
 ['megamenu-hidden-dropdown', `<nav style="position:relative"><ul style="display:flex;gap:10px;list-style:none;padding:0"><li style="position:relative">Shop<div style="position:absolute;left:0;top:100%;width:600px;visibility:hidden">Dropdown panel content</div></li></ul></nav>`],
 ['100vw-section', `<div style="height:2000px"><section style="width:100vw;background:#eee">Full bleed</section></div>`],
 ['table-data-in-scroll', `<div style="overflow-x:auto"><table><tr><th>A</th><th>B</th></tr><tr><td style="min-width:200px">1</td><td style="min-width:200px">2</td></tr></table></div>`],
 ['table-data-page', `<table><tr><th>A</th><th>B</th></tr><tr><td style="min-width:200px">1</td><td style="min-width:200px">2</td></tr></table>`],
 ['pre-wide', `<pre>const x = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";</pre>`],
 ['content-visibility-hidden', `<div style="content-visibility:hidden;width:280px"><div style="width:400px">hidden content</div></div>`],
 ['html-overflowx-hidden-body-overflowx-auto', `<html style="overflow-x:hidden"><body style="overflow-x:auto;margin:0"><div style="width:500px">Wide</div></body></html>`],
 ['html-overflowx-hidden-body-overflowx-auto-margin', `<html style="overflow-x:hidden"><body style="overflow-x:auto"><div style="width:500px">Wide</div></body></html>`],
];
(async () => {
  const only = process.argv[2];
  for (const [name, html] of cases) {
    if (only && !name.includes(only)) continue;
    try { const r = await h.runChromium(html, R); console.log(name.padEnd(45), r.outcome, JSON.stringify(r.occ)); }
    catch (e) { console.log(name, 'ERR', e.message); }
  }
  await h.close();
})();
