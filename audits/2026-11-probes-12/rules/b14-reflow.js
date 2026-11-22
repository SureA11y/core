const {run4,setMsg}=require('./h.js');setMsg(150);
const W=(b,d='')=>`<!doctype html><html lang=en ${d}><head><title>t</title><meta name=viewport content="width=device-width"><style>body{margin:8px;font:16px/1.5 sans-serif}</style></head><body><main>${b}</main></body></html>`;
const R=['reflow-horizontal-scroll'];const V={width:320,height:640};
const cases=[
 ['wide-table','<table><tr>'+'<td>Cell content</td>'.repeat(8)+'</tr></table>'],
 ['fixed-width-div','<div style="width:600px">Wide box text here</div>'],
 ['pre-code','<pre>const x = "a very long line of code that does not wrap at all in the box";</pre>'],
 ['long-url','<p>https://example.com/a/very/long/path/that/does/not/break/anywhere/in/the/text</p>'],
 ['img-wide','<img src="x.png" width=800 height=10 alt="Wide banner">'],
 ['rtl-wide','<div style="width:600px">نص عربي عريض</div>','dir=rtl'],
 ['vertical-page','<div style="writing-mode:vertical-rl;height:200px">縦書き'.repeat(1)+'の文章が続きます。'.repeat(20)+'</div>'],
 ['cut-field','<div style="overflow:hidden;width:300px"><input style="width:500px" aria-label=x></div>'],
 ['carousel','<div style="overflow:hidden"><div style="display:flex;width:900px"><div style="width:300px">Slide 1</div><div style="width:300px">Slide 2</div></div></div>'],
 ['shadow-wide','<x-w></x-w><script>customElements.define("x-w",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<div style=\\"width:700px\\">Wide in shadow</div>"}})</script>'],
 ['gutenberg-cols','<div class="wp-block-columns" style="display:flex;gap:2em"><div style="flex-basis:50%;min-width:250px">Col A text</div><div style="flex-basis:50%;min-width:250px">Col B text</div></div>'],
 ['ok','<p>Simple text that wraps fine.</p>'],
];
run4(cases.map(([n,b,d])=>({name:n,rules:R,html:W(b,d),viewport:V,base:'v117'})),{modes:['chrome']});
