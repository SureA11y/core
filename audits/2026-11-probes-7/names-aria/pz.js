const { launch, runCase, summarize } = require('./harness');
const R=['page-zones-landmark'];
const full=b=>`<!doctype html><html lang=en><head><title>T</title></head><body>${b}</body></html>`;
const navl='<a href=/a>A</a><a href=/b>B</a><a href=/c>C</a>';
const cases=[
 {id:'nav-in-header-div', html: full(`<div class=header><div class=nav>${navl}</div></div><main><h1>x</h1></main>`)},
 {id:'header-role-banner-div', html: full(`<div id=header role=banner><ul class=menu>${navl}</ul></div><main>x</main>`)},
 {id:'menu-dropdown-in-nav', html: full(`<header><nav><ul><li>Products<ul class=menu>${navl}</ul></li></ul></nav></header><main>x</main>`)},
 {id:'menu-role-menu', html: full(`<header>h</header><main><div class=menu role=menu aria-label=Actions><div role=menuitem>Copy</div><div role=menuitem>Paste</div></div><button class=menu-toggle>≡</button></main>`)},
 {id:'search-form-in-search', html: full(`<header><search><form><input type=search name=q aria-label=q></form></search></header><main>x</main>`)},
 {id:'search-form-role', html: full(`<header><form role=search><input name=q aria-label=q></form></header><main>x</main>`)},
 {id:'search-in-main-filter', html: full(`<header>h</header><main><form><label>Filter products <input type=search name=filter></label></form></main>`)},
 {id:'login-form-q', html: full(`<header>h</header><main><form><label>Question <input name=q></label><button>Send</button></form></main>`)},
 {id:'footer-in-body-div', html: full(`<header>h</header><main>x</main><div class=footer><p>(c) 2026</p></div>`)},
 {id:'footer-class-in-card', html: full(`<header>h</header><main><div class=card><p>x</p><div class=footer>Card footer <a href=/a>A</a></div></div></main><footer>f</footer>`)},
 {id:'header-class-in-card-nobanner', html: full(`<main><div class=card><div class=header>Card title</div><p>x</p></div></main>`)},
 {id:'table-header-class', html: full(`<header>h</header><main><table><tr class=header><th>a</th></tr><tr><td>1</td></tr></table></main>`)},
 {id:'dialog-header', html: full(`<header>h</header><main><div role=dialog aria-label=d><div class=header>Title</div><div class=footer><button>OK</button></div></div></main><footer>f</footer>`)},
 {id:'nav-class-pagination', html: full(`<header>h</header><main><div class=nav>${navl}</div></main><footer>f</footer>`)},
 {id:'nav-class-hidden-mobile', html: full(`<header>h</header><nav>${navl}</nav><div class=nav style="display:none">${navl}</div><main>x</main>`)},
 {id:'header-template-shadow', html: full(`<site-header></site-header><main>x</main>`), setup: ()=>customElements.define('site-header', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<header><nav><a href=/a>A</a><a href=/b>B</a></nav></header>';}})},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
