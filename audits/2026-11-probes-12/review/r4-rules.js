const {run4,setMsg}=require('./rh.js');setMsg(150);
const W=(b,head='',title='Shop page')=>`<!doctype html><html lang=en><head><title>${title}</title>${head}</head><body><main><h1>h</h1>${b}</main></body></html>`;
const APC=['aria-prohibited-children','aria-required-children'],RT=['resize-text-content-loss'],TS=['text-spacing-content-loss'],CH=['click-handler-keyboard-operable'];
const ce=(name,inner)=>`<script>customElements.define("${name}",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML=${JSON.stringify(inner)}}})</script>`;
const cases=[
 ['APC1 list host, shadow ul > slot, slotted li + slotted button',APC,W('<x-l><li>a</li><button>b</button></x-l>'+ce('x-l','<ul><slot></slot></ul>'))],
 ['APC2 role=list host, light children unassigned (no slot)',APC,W('<x-n role=list><button>not rendered</button></x-n>'+ce('x-n','<div role=listitem>a</div>'))],
 ['APC3 role=menu, slot with fallback button only',APC,W('<x-m role=menu></x-m>'+ce('x-m','<div role=menuitem>a</div><slot><button>fallback</button></slot>'))],
 ['RT1 wholly hidden second line in fixed-height box',RT,W('<div style="height:1.2em;overflow:hidden;width:200px;font-size:16px">Free delivery<br>on orders over 50 euros</div>'),{width:1280,height:800}],
 ['RT1@400px',RT,W('<div style="height:1.2em;overflow:hidden;width:200px;font-size:16px">Free delivery<br>on orders over 50 euros</div>'),{width:400,height:800}],
 ['TS1 vertical-rl text cut',TS,W('<div style="writing-mode:vertical-rl;width:3em;height:5em;overflow:hidden">縦書きのテキストがここにあります長い長い</div>')],
 ['TS2 text already cut before spacing (ellipsis)',TS,W('<div style="width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">A long product name that is cut</div>')],
 ['CH1 close glyph span',CH,W('<div class=notice>Saved <span class=close onclick="this.parentNode.remove()" style="cursor:pointer">×</span></div>')],
 ['CH2 bordered padded span "Add to cart"',CH,W('<span onclick="go()" style="padding:6px 12px;border:1px solid #333">Add to cart</span><script>function go(){}</script>')],
 ['CH3 background-only span',CH,W('<span onclick="go()" style="padding:6px 12px;background:#06c;color:#fff">Add to cart</span><script>function go(){}</script>')],
 ['CH4 text visibility hidden in label',CH,W('<span onclick="go()" style="padding:6px 12px;border:1px solid #333"><span style="visibility:hidden">Secret long text that is not shown at all to anyone here</span>Go</span><script>function go(){}</script>')],
];
run4(cases.map(([n,r,h,v])=>({name:n,rules:r,html:h,viewport:v})));
