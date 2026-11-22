const h=require('./h.js');
const R=['contrast-minimum','contrast-enhanced','contrast-computable','symbol-graphic-contrast'];
const nest=(n,inner,styleAt={})=>{let s=inner;for(let i=0;i<n;i++)s=`<div style="${styleAt[i]||''}">${s}</div>`;return s;};
const deep=[];
for(const at of [98,99,100,101,105,140])deep.push(`<section>${nest(150,'<span style="color:#777">deep '+at+'</span>',{[at]:'height:0;overflow:hidden'})}</section>`);
for(const at of [98,99,100,101])deep.push(`<section>${nest(150,'<span style="color:#777">stop '+at+'</span>',{[at]:'position:absolute',[at+2]:'height:0;overflow:hidden'})}</section>`);
const clipcase=`
<div style="height:0;overflow:clip"><p style="color:#777">clip</p></div>
<div style="height:20px;overflow:hidden"><div style="position:fixed;top:300px"><p style="color:#777">fixed in clip</p></div></div>
<div style="width:1px;overflow-x:hidden"><div style="overflow:auto;height:30px"><p style="color:#777">scroll in 1px</p></div></div>
<div style="clip-path:inset(50%)"><p style="color:#777">clip-path</p></div>
<div style="contain:paint;height:0"><p style="color:#777">contain paint</p></div>
<div style="overflow:hidden;height:40px"><div style="overflow:hidden;width:0.5px"><p style="color:#777">nested 0.5</p></div></div>
<div style="overflow-y:hidden;height:30px"><div style="overflow-x:hidden;width:200px;transform:translateX(-5000px)"><p style="color:#777">transformed</p></div></div>`;
const effects=`
<div style="background:#fff;opacity:.6"><p style="color:#000">op1</p><p style="color:#888">op2</p><div style="mix-blend-mode:multiply"><p style="color:#555">blend</p></div></div>
<div style="filter:invert(1);background:#000"><p style="color:#fff">filter</p></div>
<div style="-webkit-mask-image:linear-gradient(#000,transparent);mask-image:linear-gradient(#000,transparent)"><p style="color:#333">mask</p></div>
<div style="box-shadow:inset 0 0 0 100px #222;padding:10px"><p style="color:#eee">inset</p><p style="color:#333">inset2</p></div>
<div style="box-shadow:0 0 0 100px #222;padding:10px"><p style="color:#333">outset</p></div>
<div style="background:linear-gradient(#fff,#000)"><p style="color:#777">grad</p></div>
<div style="background:rgba(0,0,0,.5)"><div style="opacity:.5"><div style="background:#fff;mix-blend-mode:normal"><p style="color:#999">mixdepth</p></div></div></div>
<div style="transform:scale(.5)"><p style="color:#666">scaled</p></div>
<dialog open style="background:#000"><p style="color:#444">open dialog</p></dialog>
<div popover id="pp" style="background:rgba(255,255,255,.5)"><p style="color:#888">popover</p></div>
<dialog id="md" style="background:rgba(0,0,0,.3)"><p style="color:#666">modal</p></dialog>
<div style="position:absolute;top:900px;background:rgba(0,0,0,.4)"><p style="color:#777">abs</p></div>
<script>try{document.getElementById('pp').showPopover()}catch(e){}</script>`;
const modal=`<style>dialog::backdrop{background:rgba(0,0,0,.6)}</style><dialog id="md2" style="background:rgba(255,255,255,.5);position:static"><p style="color:#666">modal backdrop</p></dialog><p style="color:#777">behind</p><script>document.getElementById('md2').showModal()</script>`;
const wrap=b=>`<!doctype html><html lang="en"><head><title>t</title></head><body><main>${b}</main></body></html>`;
h.run4([{name:'deep',html:wrap(deep.join('')),rules:R},{name:'clips',html:wrap(clipcase),rules:R},{name:'effects',html:wrap(effects),rules:R,scripts:true},{name:'modal',html:wrap(modal),rules:R,scripts:true}].slice(0,2),{verbose:true,modes:['chrome']});
