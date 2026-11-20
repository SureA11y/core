const { launch, runCase, summarize } = require('./harness');
const R=['listitem-parent-valid','list-children-valid','aria-required-parent','aria-required-children','dlitem-parent-valid','td-has-header'];
const cases=[
 {id:'li-slotted-into-ul', html:`<my-list><li data-t=a>One</li><li>Two</li></my-list>`, setup:()=>customElements.define('my-list', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<ul><slot></slot></ul>';}})},
 {id:'tab-slotted-into-tablist', html:`<my-tabs><button role=tab aria-selected=true data-t=a>One</button></my-tabs>`, setup:()=>customElements.define('my-tabs', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<div role=tablist aria-label=t><slot></slot></div>';}})},
 {id:'option-slotted-listbox', html:`<my-lb><div role=option aria-selected=false data-t=a>A</div></my-lb>`, setup:()=>customElements.define('my-lb', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<div role=listbox aria-label=l><slot></slot></div>';}})},
 {id:'dt-slotted-dl', html:`<my-dl><dt data-t=a>T</dt><dd>D</dd></my-dl>`, setup:()=>customElements.define('my-dl', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<dl><slot></slot></dl>';}})},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
