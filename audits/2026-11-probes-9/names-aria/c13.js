const LM=['landmark-one-main','landmark-no-duplicate-main','landmark-no-duplicate-banner','landmark-no-duplicate-contentinfo','landmark-banner-is-top-level','landmark-contentinfo-is-top-level','landmark-complementary-is-top-level','landmark-main-is-top-level','landmark-unique','landmark-role-name-present','region','page-zones-landmark','bypass-blocks-present','skip-link'];
module.exports=[
{name:'aside-in-article', rules:LM, html:'<header>Site</header><main><article><h1>A</h1><aside id=s>Note</aside></article></main><footer>f</footer>', ax:['#s']},
{name:'aside-named-in-section', rules:LM, html:'<header>Site</header><main><section aria-label="S"><aside id=s aria-label="Related">Note</aside></section></main>', ax:['#s']},
{name:'header-in-main', rules:LM, html:'<header id=h1>Site</header><main><header id=h2>Main head</header>x</main>', ax:['#h1','#h2']},
{name:'footer-in-section', rules:LM, html:'<main>x<section><footer id=f2>sec foot</footer></section></main><footer id=f1>site</footer>', ax:['#f1','#f2']},
{name:'header-in-shadow', rules:LM, html:'<x-shell id=h></x-shell><main>x</main>', setup:()=>{const s=document.getElementById('h').attachShadow({mode:'open'});s.innerHTML='<header>Site</header>';}},
{name:'header-display-contents-body', rules:LM, html:'<div style="display:contents"><header id=h>Site</header></div><main>x</main>', ax:['#h']},
{name:'two-nav-unnamed', rules:LM, html:'<nav id=n1><a href=/>a</a></nav><main>x</main><nav id=n2><a href=/>b</a></nav>', ax:['#n1','#n2']},
{name:'two-nav-same-name', rules:LM, html:'<nav aria-label="Main"><a href=/>a</a></nav><main>x</main><nav aria-label="main"><a href=/>b</a></nav>'},
{name:'section-labelledby-heading', rules:LM, html:'<main><section id=s aria-labelledby=h><h2 id=h>Intro</h2></section><section id=t aria-labelledby=h>Again</section></main>', ax:['#s','#t']},
{name:'form-unnamed', rules:LM, html:'<main><form id=f><input aria-label=q></form><form id=g aria-label="Search"><input aria-label=q></form></main>', ax:['#f','#g']},
{name:'role-region-unnamed', rules:LM, html:'<main><div id=r role=region>x</div></main>', ax:['#r']},
{name:'main-hidden-dup', rules:LM, html:'<main>x</main><main hidden>y</main>'},
{name:'main-inside-dialog', rules:LM, html:'<main>x</main><dialog open><main>y</main></dialog>'},
{name:'search-element', rules:LM, html:'<search id=s><input aria-label=q></search><search id=t><input aria-label=r></search><main>x</main>', ax:['#s','#t']},
{name:'content-outside', rules:LM, html:'<div>Top promo text</div><main>x</main>'},
{name:'iframe-page-content', rules:LM, html:'<main>x</main><div><p>Footer text loose</p></div>'},
];
