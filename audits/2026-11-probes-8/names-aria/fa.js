const { runAll } = require('./harness');
const def = (fa) => `customElements.define('x-in${fa?'':'2'}', class extends HTMLElement{${fa?'static formAssociated=true;':''} constructor(){super(); this.i=this.attachInternals(); this.i.role='textbox'; this.tabIndex=0;}});`;
runAll([
 { id:'fa-textbox-unnamed', setup:def(true), html:`<x-in data-t="xj"></x-in>` },
 { id:'nonfa-textbox-unnamed', setup:def(false), html:`<x-in2 data-t="xk"></x-in2>` },
 { id:'fa-button-unnamed', setup:`customElements.define('x-b', class extends HTMLElement{static formAssociated=true; constructor(){super(); this.attachInternals().role='button'; this.tabIndex=0;}});`, html:`<x-b data-t="b"></x-b>` },
 { id:'fa-checkbox-unnamed', setup:`customElements.define('x-c', class extends HTMLElement{static formAssociated=true; constructor(){super(); this.attachInternals().role='checkbox'; this.tabIndex=0;}});`, html:`<x-c data-t="c"></x-c>` },
], ['textbox-name-present','form-control-programmatic-label-present','button-name-present','binary-control-name-present'], {}, true);
