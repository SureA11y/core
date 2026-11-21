const { cases, close } = require('./multi');
const ALL = ['contrast-minimum','contrast-enhanced','contrast-computable','target-size-minimum','target-size-enhanced','focus-not-obscured-minimum','focus-not-obscured-enhanced','text-spacing-content-loss','css-orientation-lock','link-in-text-block','p-as-heading','css-focus-indicator-suppressed','css-hidden-focus','reflow-horizontal-scroll'];
(async () => {
await cases([
 ['display contents parent', `<div style="display:contents;color:#aaa"><p>contents text <a href="#">link</a></p></div>`],
 ['drop cap first-letter', `<style>p::first-letter{font-size:60px;color:#ddd;float:left}</style><p>Once upon a time there was text.</p>`],
 ['math', `<math><mi style="color:#ccc">x</mi><mo>=</mo><mn>2</mn></math>`],
 ['contenteditable', `<div contenteditable style="color:#bbb">Editable text</div>`],
 ['slot fallback', `<x-a></x-a><script>customElements.define('x-a',class extends HTMLElement{connectedCallback(){this.attachShadow({mode:'open'}).innerHTML='<slot style="color:#ccc">Fallback text</slot>'}})</script>`],
 ['closed shadow', `<div id=h></div><script>document.getElementById('h').attachShadow({mode:'closed'}).innerHTML='<p style="color:#ccc">closed</p><button style="width:10px;height:10px"></button>'</script>`],
 ['template', `<template><p style="color:#ccc">tpl</p></template><p>ok</p>`],
 ['frameset-less iframe', `<iframe srcdoc="<p style='color:#ccc'>frame</p>"></iframe>`],
 ['huge font', `<p style="font-size:100000px;color:#ccc">X</p>`],
 ['zero-size viewport-ish', `<p style="width:0;height:0;overflow:hidden;color:#ccc">x</p>`],
 ['NaN zoom', `<p style="zoom:0;color:#ccc">zoom zero</p>`],
 ['negative letter-spacing', `<p style="letter-spacing:-20px;color:#ccc">squashed</p>`],
 ['transform matrix3d singular', `<div style="transform:scale(0,1)"><button>Hidden</button><p style="color:#ccc">x</p></div>`],
 ['svg in button', `<button style="width:20px;height:20px;padding:0"><svg width="20" height="20"><circle r="5" cx="10" cy="10"/></svg></button><button style="width:20px;height:20px">b</button>`],
 ['writing-mode sideways-lr', `<p style="writing-mode:sideways-lr;color:#999">sideways</p>`],
 ['text-orientation upright', `<p style="writing-mode:vertical-rl;text-orientation:upright;color:#999">upright</p>`],
], ALL);
await close();
})();
