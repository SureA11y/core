const { runAll } = require('./harness');
const P = (b)=>`<!doctype html><html lang="en"><head><title>Heads</title></head><body><main>${b}</main></body></html>`;
runAll([
 { id:'order-hidden-h2', html:P(`<h1>T</h1><h2 hidden>x</h2><h3>sub</h3>`) },
 { id:'order-sr-only-h2', html:P(`<h1>T</h1><h2 style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">x</h2><h3>sub</h3>`) },
 { id:'order-aria-level', html:P(`<h1>T</h1><h4 aria-level="2">two</h4><h2 aria-level="4">four</h2>`) },
 { id:'order-in-dialog', html:P(`<h1>T</h1><h2>a</h2><dialog open><h4>dlg</h4></dialog>`) },
 { id:'order-shadow', setup:`customElements.define('x-c', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<h4>card</h4><slot></slot>';}});`, html:P(`<h1>T</h1><x-c><h2>slotted</h2></x-c>`) },
 { id:'h1-role-none', html:P(`<h1 role="none">x</h1><h2>a</h2>`) },
 { id:'h1-role-presentation-focus', html:P(`<h1 role="presentation" tabindex="0">x</h1>`) },
 { id:'empty-heading-img-alt-empty', html:P(`<h1>T</h1><h2 data-t="h"><img src="x.png" alt=""></h2>`) },
 { id:'empty-heading-br', html:P(`<h1>T</h1><h2 data-t="h"><br></h2>`) },
 { id:'empty-heading-nbsp', html:P(`<h1>T</h1><h2 data-t="h">&nbsp;</h2>`) },
 { id:'empty-heading-zwsp', html:P(`<h1>T</h1><h2 data-t="h">&#8203;</h2>`) },
 { id:'heading-level-10', html:P(`<div role="heading" aria-level="10" data-t="h">x</div>`) },
], ['heading-order','page-has-heading-one','empty-heading','aria-allowed-role','presentation-role-conflict'], {}, false);
