const { four, page, close } = require('./h.js');
const ids = ['contrast-minimum','symbol-graphic-contrast'];
const G = 'color:#aaa;background:#fff';
const cases = [
 ['aria-disabled on plain span text', `<p><span aria-disabled="true" style="${G}">Sold out soon</span></p>`],
 ['aria-disabled on div card w/o control', `<div aria-disabled="true" style="${G}"><p>Plan details text</p></div>`],
 ['aria-disabled card containing button: card text', `<div aria-disabled="true" style="${G}"><p>Plan details</p><button style="${G}">Choose</button></div>`],
 ['role=button aria-disabled', `<div role="button" tabindex="0" aria-disabled="true" style="${G}">Submit</div>`],
 ['a without href aria-disabled (Bootstrap nav-link)', `<ul><li><a class="nav-link disabled" aria-disabled="true" style="${G}">Disabled</a></li></ul>`],
 ['a href tabindex=-1 aria-disabled (BS4 pager)', `<ul><li><a href="#" tabindex="-1" aria-disabled="true" style="${G}">Previous</a></li></ul>`],
 ['li.disabled > span (BS5 pagination, no aria)', `<ul><li class="page-item disabled"><span class="page-link" style="${G}">Previous</span></li></ul>`],
 ['role=group aria-disabled containing radios', `<div role="radiogroup" aria-disabled="true"><span style="${G}">Size</span><label><input type="radio" name="s"><span style="${G}">Small</span></label></div>`],
 ['aria-disabled on label of enabled input', `<label aria-disabled="true" style="${G}">Email <input></label>`],
 ['aria-disabled on li role=menuitem', `<ul role="menu"><li role="menuitem" aria-disabled="true" style="${G}">Paste</li></ul>`],
 ['aria-disabled on li in role=menu w/o role', `<ul role="menu"><li aria-disabled="true" style="${G}">Paste</li></ul>`],
 ['aria-disabled option in listbox', `<ul role="listbox" aria-label="x"><li role="option" aria-disabled="true" style="${G}">Blue</li></ul>`],
 ['tab aria-disabled', `<div role="tablist"><button role="tab" aria-disabled="true" style="${G}">Reviews</button></div>`],
 ['aria-disabled on summary', `<details><summary aria-disabled="true" style="${G}">More</summary>x</details>`],
 ['aria-disabled on contenteditable', `<div contenteditable="true" aria-disabled="true" style="${G}">Draft</div>`],
 ['aria-disabled on span inside button (child)', `<button style="${G}"><span aria-disabled="true">Pay</span></button>`],
 ['disabled star rating ★ in span role=img', `<span role="img" aria-label="4 of 5" aria-disabled="true" style="${G}">★★★★☆</span>`],
 ['× in aria-disabled button', `<button aria-disabled="true" style="${G}">×</button>`],
 ['× in aria-disabled span', `<span aria-disabled="true" style="${G}">×</span>`],
 ['custom element w/ shadow role=button aria-disabled', `<x-btn></x-btn><script>customElements.define('x-btn',class extends HTMLElement{connectedCallback(){this.setAttribute('role','button');this.setAttribute('aria-disabled','true');this.tabIndex=0;this.attachShadow({mode:'open'}).innerHTML='<span style="color:#aaa">Buy</span>'}})</script>`],
 ['input type=hidden aria-disabled sibling label', `<label style="${G}">Code<input type="hidden" aria-disabled="true"></label>`],
];
(async () => { for (const [l, b] of cases) await four(l, page(b), ids); await close(); })();
