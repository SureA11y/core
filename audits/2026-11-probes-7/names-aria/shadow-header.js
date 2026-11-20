const { launch, runCase, summarize } = require('./harness');
const R=['landmark-no-duplicate-banner','landmark-banner-is-top-level','landmark-unique','landmark-no-duplicate-contentinfo','landmark-contentinfo-is-top-level'];
const setup=()=>customElements.define('post-head', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<header data-t=sh><h2><slot></slot></h2></header>';}});
const full=b=>`<!doctype html><html lang=en><head><title>T</title></head><body>${b}</body></html>`;
const cases=[
 {id:'shadow-header-in-article', html: full(`<header data-t=top>Site</header><main><article><post-head data-t=h1>Post 1</post-head><p>a</p></article><article><post-head>Post 2</post-head><p>b</p></article></main><footer>(c)</footer>`), setup},
 {id:'shadow-header-in-article-nomain', html: full(`<header data-t=top>Site</header><div><article><post-head data-t=h1>Post 1</post-head><p>a</p></article><article><post-head>Post 2</post-head><p>b</p></article></div><main>m</main><footer>(c)</footer>`), setup},
];
(async () => { const b = await launch(); for (const c of cases) { const o=await runCase(b,c,R); console.log(summarize(c,o)); } await b.close(); })();
