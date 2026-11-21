const R=['page-zones-landmark','landmark-no-duplicate-banner','landmark-banner-is-top-level','landmark-no-duplicate-contentinfo'];
module.exports=[
{name:'header-in-role-region', rules:R, html:'<div role=region aria-label="Top"><header id=h>Site</header></div><main>x</main>', ax:['#h']},
{name:'header-in-role-main-and-top', rules:R, html:'<header id=t>Top</header><div role=main><header id=h>Main header</header>x</div>', ax:['#t','#h']},
{name:'footer-in-role-article', rules:R, html:'<header>t</header><div role=article><footer id=f>a</footer></div><footer id=g>site</footer><main>x</main>', ax:['#f','#g']},
{name:'header-in-shadow-section', rules:R, html:'<section id=s aria-label=S></section><header id=t>Top</header><main>x</main><script>document.getElementById("s").attachShadow({mode:"open"}).innerHTML="<header id=h>inner</header>"</script>', ax:['#t']},
{name:'header-slotted-into-section', rules:R, html:'<x-s id=s><header id=h>Slotted</header></x-s><header id=t>Top</header><main>x</main><script>customElements.define("x-s",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<section aria-label=Sec><slot></slot></section>";}})</script>', ax:['#h','#t']},
];
