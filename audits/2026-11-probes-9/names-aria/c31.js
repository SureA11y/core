const R=['page-zones-landmark','landmark-no-duplicate-contentinfo','landmark-no-duplicate-banner','landmark-contentinfo-is-top-level','region'];
module.exports=[
{name:'shadow-footer', rules:R, html:'<header>Site</header><main>x</main><div id=footer>Footer text</div><x-foot id=s></x-foot><script>customElements.define("x-foot",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<footer id=f>Shadow footer</footer>";}})</script>', ax:['x-foot']},
{name:'internals-banner', rules:R, html:'<x-hdr id=hh>Site</x-hdr><main>x</main><div id=header>dup</div><script>customElements.define("x-hdr",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="banner";}})</script>', ax:['#hh']},
];
