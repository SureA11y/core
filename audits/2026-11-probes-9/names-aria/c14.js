const S=['skip-link','bypass-blocks-present'];
module.exports=[
{name:'jump-to-top', rules:S, html:'<header><a href="/">Home</a></header><main><p>Long</p><a id=a href="#top">Jump to top</a></main>'},
{name:'skip-top-case', rules:S, html:'<main><p>x</p><a id=a href="#TOP">Skip to top</a></main>'},
{name:'skip-img-alt', rules:S, html:'<a id=a href="#nope"><img src="x.png" alt="Skip to content"></a><nav><a href="/">x</a></nav><main>x</main>'},
{name:'skip-content-target-in-shadow', rules:S, html:'<a id=a href="#content">Skip to content</a><x-app id=h></x-app>', setup:()=>{const s=document.getElementById('h').attachShadow({mode:'open'});s.innerHTML='<main id=content>x</main>';}},
{name:'skip-hidden-word', rules:S, html:'<a id=a href="#nope"><span aria-hidden=true>Skip</span> Home</a><main>x</main>'},
];
