const R=['page-zones-landmark'];
module.exports=[
{name:'zones-basic', rules:R, html:'<div id=header>Site</div><div class=nav><a href=/a>a</a><a href=/b>b</a></div><main>x</main><div id=footer>f</div>'},
{name:'zones-header-in-body-div', rules:R, html:'<div class=wrapper><header id=h>Site</header></div><main>x</main>'},
{name:'zones-header-in-main', rules:R, html:'<main><header>Site</header>x</main>'},
{name:'zones-search-form', rules:R, html:'<header>s</header><form action="/search"><input type=search name=q aria-label=q><button>Go</button></form><main>x</main>'},
{name:'zones-search-in-search-el', rules:R, html:'<header>s</header><search><form><input type=search name=q aria-label=q></form></search><main>x</main>'},
{name:'zones-header-nested-in-div-role-region', rules:R, html:'<div role=region aria-label="Top"><header>Site</header></div><main>x</main>'},
{name:'zones-nav-class-menu-ul', rules:R, html:'<header>s</header><ul class="menu"><li><a href=/a>a</a></li><li><a href=/b>b</a></li></ul><main>x</main>'},
{name:'zones-nav-inside-nav', rules:R, html:'<header>s</header><nav><div class="nav-list"><a href=/a>a</a><a href=/b>b</a></div></nav><main>x</main>'},
{name:'zones-menu-dropdown-role-menu', rules:R, html:'<header>s</header><div class="menu" role=menu><a role=menuitem href=/a>a</a><a role=menuitem href=/b>b</a></div><main>x</main>'},
{name:'zones-header-shadow', rules:R, html:'<x-shell id=s></x-shell><main>x</main><div id=footer>f</div>', setup:()=>{document.getElementById('s').attachShadow({mode:'open'}).innerHTML='<header>Site</header><footer>F</footer>';}},
{name:'zones-footer-in-article', rules:R, html:'<header>s</header><main><article>x<footer>art foot</footer></article></main>'},
{name:'zones-banner-via-custom-internals', rules:R, html:'<x-hdr id=hh>Site</x-hdr><main>x</main><div id=header>dup</div><script>customElements.define("x-hdr",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="banner";}})</script>'},
];
