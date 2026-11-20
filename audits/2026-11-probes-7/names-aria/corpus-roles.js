module.exports=[
 ['hf', `<header data-t=a>top</header><main data-t=b><article><header data-t=c>x</header><footer data-t=d>y</footer></article></main><aside data-t=e><header data-t=f>as</header></aside><nav data-t=g aria-label="Main"><footer data-t=h>nf</footer></nav><footer data-t=i>bottom</footer>`],
 ['hf-role-generic-ancestors', `<div role=article><header data-t=a>in role=article</header></div><div role=main><footer data-t=b>in role main</footer></div><div role=region aria-label=r><header data-t=c>in region</header></div><section><header data-t=d>in unnamed section</header></section><section aria-label=S><footer data-t=e>in named section</footer></section>`],
 ['hf-shadow', `<x-shell data-t=host></x-shell>`, ()=>customElements.define('x-shell', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<header data-t=a>sh</header><main data-t=m><slot></slot></main><footer data-t=b>sf</footer>';}})],
 ['slotted-header-in-article', `<x-art><header data-t=a>slotted header</header></x-art>`, ()=>customElements.define('x-art', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<article><slot></slot></article>';}})],
 ['section-names', `<section data-t=a aria-label="">empty label</section><section data-t=b title="T">title</section><section data-t=c aria-labelledby=nonexist>bad ref</section><section data-t=d aria-label="  ">ws</section>`],
 ['form-names', `<form data-t=a title="Search form"><input aria-label=x></form><form data-t=b aria-labelledby=fh><h2 id=fh>Login</h2></form><form data-t=c name="contact"><input aria-label=y></form>`],
 ['aside-scoping', `<main><aside data-t=a>in main</aside><article><aside data-t=b>in article</aside></article><section aria-label=S><aside data-t=c>in named section</aside></section><section><aside data-t=d>in unnamed section</aside></section></main><aside data-t=e aria-label="side">top</aside>`],
 ['search-variants', `<search data-t=a>s</search><search data-t=b aria-label="Site">s</search><div role=search data-t=c>s</div>`],
 ['main-hidden', `<main data-t=a hidden>x</main><main data-t=b>y</main>`],
 ['nav-in-header', `<header><nav data-t=a>n</nav></header>`],
 ['role-region-unnamed', `<div role=region data-t=a>x</div><div role=region aria-label=R data-t=b>y</div>`],
];
