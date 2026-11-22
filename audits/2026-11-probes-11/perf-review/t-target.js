const h=require('./h.js');
const box=(attrs,txt='x')=>`<div ${attrs} style="display:inline-block;width:10px;height:10px;margin:0">${txt}</div>`;
const html=`<!doctype html><html lang="en"><body>
<div id="a">${box('role="x button" tabindex="0"')} ${box('role="button " tabindex="0"')} ${box('role="\u000Bbutton" tabindex="0"')}</div>
<div id="b">${box('role="BUTTON" tabindex="0"')} ${box('role="foo button" tabindex="0"')} ${box('role="tooltip button"')}</div>
<table role="grid"><tr><td role="gridcell" tabindex="0" style="width:5px;height:5px">1</td><td tabindex="0" style="width:5px;height:5px">2</td><td role="x" tabindex="-1">3</td></tr></table>
<x-b role="foo">b</x-b><x-c>c</x-c>
<script>customElements.define('x-b',class extends HTMLElement{constructor(){super();try{this.attachInternals().role='button'}catch(e){}}});
customElements.define('x-c',class extends HTMLElement{constructor(){super();try{this.attachInternals().role='button'}catch(e){}}});</script>
</body></html>`;
h.run4([{name:'target-roles',html,rules:['target-size-minimum'],scripts:true}],{verbose:true});
