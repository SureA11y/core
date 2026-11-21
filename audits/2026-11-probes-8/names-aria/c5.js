const { runAll } = require('./harness');
const R = ['landmark-role-name-present','landmark-unique','landmark-one-main','landmark-no-duplicate-banner','landmark-no-duplicate-contentinfo','landmark-no-duplicate-main','landmark-banner-is-top-level','landmark-contentinfo-is-top-level','landmark-main-is-top-level','landmark-complementary-is-top-level','region','page-zones-landmark','page-has-heading-one','heading-order','empty-heading','p-as-heading','bypass-blocks-present','skip-link'];
const P = (body) => `<!doctype html><html lang="en"><head><title>Shop page</title></head><body>${body}</body></html>`;
const cases = [
 { id:'typical', html:P(`<a href="#main" class="skip">Skip to content</a><header><nav aria-label="Main"><a href="/">Home</a></nav></header><main id="main"><h1>Title</h1><section aria-labelledby="s1"><h2 id="s1">Sub</h2><p>x</p></section><aside><h2>Related</h2></aside></main><footer><p>c</p></footer>`) },
 { id:'two-navs-unnamed', html:P(`<header><nav><a href="/">A</a></nav></header><main><h1>T</h1></main><footer><nav><a href="/">B</a></nav></footer>`) },
 { id:'aside-in-main-in-section', html:P(`<main><h1>T</h1><article><aside data-t="a">note</aside></article></main>`) },
 { id:'aside-in-aside', html:P(`<main><h1>T</h1></main><aside><h2>x</h2><aside data-t="a">y</aside></aside>`) },
 { id:'header-in-section', html:P(`<header>Site</header><main><h1>T</h1><section aria-label="s"><header>Sec</header></section></main>`) },
 { id:'header-in-div-role-main', html:P(`<header>Site</header><div role="main"><h1>T</h1><header>inner</header></div>`) },
 { id:'footer-in-aside', html:P(`<main><h1>T</h1></main><aside aria-label="side"><footer>Side foot</footer></aside><footer>Site</footer>`) },
 { id:'dialog-with-main', html:P(`<main><h1>T</h1></main><dialog open><main>inner</main></dialog>`) },
 { id:'hidden-main', html:P(`<main><h1>T</h1></main><main hidden>2</main>`) },
 { id:'two-mains', html:P(`<main><h1>T</h1></main><div role="main">2</div>`) },
 { id:'form-landmark-named', html:P(`<main><h1>T</h1><form aria-label="Sign up"><input aria-label="e"></form><form><input aria-label="f"></form></main>`) },
 { id:'section-named-twice-same', html:P(`<main><h1>T</h1><section aria-label="News">a</section><section aria-label="News">b</section></main>`) },
 { id:'nav-same-name', html:P(`<nav aria-label="Pages">a</nav><main><h1>T</h1></main><nav aria-label="Pages">b</nav>`) },
 { id:'nav-same-name-diff-case', html:P(`<nav aria-label="Pages">a</nav><main><h1>T</h1></main><nav aria-label="pages ">b</nav>`) },
 { id:'search-element', html:P(`<header><search><form><input type="search" aria-label="q"></form></search></header><main><h1>T</h1></main>`) },
 { id:'h1-in-header-only', html:P(`<header><h1>Brand</h1></header><main><h2>Page</h2></main>`) },
 { id:'heading-skip', html:P(`<main><h1>T</h1><h3>skip</h3><h2>ok</h2><h4>skip2</h4></main>`) },
 { id:'heading-aria-level-div', html:P(`<main><div role="heading" aria-level="1">T</div><div role="heading">no level</div></main>`) },
 { id:'heading-in-shadow', setup:`customElements.define('x-h', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<h1>Shadow title</h1>';}});`, html:P(`<main><x-h></x-h><p>x</p></main>`) },
 { id:'hgroup', html:P(`<main><hgroup><h1>Title</h1><p>Subtitle</p></hgroup></main>`) },
 { id:'h1-hidden-visually', html:P(`<main><h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Products</h1><h2>a</h2></main>`) },
 { id:'content-outside-landmarks', html:P(`<header>h</header><main><h1>T</h1></main><div><p>Orphan paragraph</p></div><footer>f</footer>`) },
 { id:'content-in-dialog-outside', html:P(`<header>h</header><main><h1>T</h1></main><div role="dialog" aria-label="Cookies"><p>We use cookies</p><button>OK</button></div>`) },
 { id:'content-in-popover', html:P(`<header>h</header><main><h1>T</h1></main><div popover id="p">tip</div>`) },
 { id:'content-in-alert', html:P(`<header>h</header><main><h1>T</h1></main><div role="alert">Saved</div>`) },
];
runAll(cases, R);
