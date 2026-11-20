const { launch, runCase, summarize } = require('./harness');
const R=['landmark-no-duplicate-banner','landmark-banner-is-top-level','landmark-unique','region','page-zones-landmark','landmark-no-duplicate-contentinfo','landmark-contentinfo-is-top-level'];
const setup=()=>customElements.define('x-card', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<article><slot name=head></slot><slot></slot><slot name=foot></slot></article>';}});
const full=b=>`<!doctype html><html lang=en><head><title>T</title></head><body>${b}</body></html>`;
const cases=[
 {id:'slotted-headers', html: full(`<header data-t=top>Site</header><div><x-card><header slot=head data-t=c1><h2>Card 1</h2></header><p>a</p><footer slot=foot data-t=f1>meta</footer></x-card><x-card><header slot=head><h2>Card 2</h2></header><p>b</p></x-card></div><main>m</main><footer>(c)</footer>`), setup},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
