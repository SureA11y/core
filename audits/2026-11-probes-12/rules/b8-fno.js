const {run4,setMsg}=require('./h.js');setMsg(140);
const W=(b,dt='<!doctype html>')=>`${dt}<html lang=en><head><title>t</title><style>body{margin:0;font:16px/1.5 sans-serif}</style></head><body>${b}<main>${'<p>Text paragraph.</p>'.repeat(10)}${'<p><a href=#>Link</a></p>'.repeat(30)}${'<p>x</p>'.repeat(40)}</main></body></html>`;
const R=['focus-not-obscured-minimum','focus-not-obscured-enhanced'];
const cases=[
 ['sticky-header-bg','<header style="position:sticky;top:0;height:60px;background:#fff;z-index:9">Site</header>'],
 ['sticky-header-before','<style>header::before{content:"";position:absolute;inset:0;background:#fff;z-index:-1}</style><header style="position:sticky;top:0;height:60px;z-index:9">Site</header>'],
 ['sticky-header-inset-shadow','<header style="position:sticky;top:0;height:60px;box-shadow:inset 0 0 0 100px #fff;z-index:9">Site</header>'],
 ['sticky-header-scroll-padding','<style>html{scroll-padding-top:70px}</style><header style="position:sticky;top:0;height:60px;background:#fff;z-index:9">Site</header>'],
 ['sticky-header-scroll-padding-pct','<style>html{scroll-padding-top:10%}</style><header style="position:sticky;top:0;height:60px;background:#fff;z-index:9">Site</header>'],
 ['sticky-header-scroll-padding-clamp','<style>html{scroll-padding-top:clamp(50px, 10%, 90px)}</style><header style="position:sticky;top:0;height:60px;background:#fff;z-index:9">Site</header>'],
 ['fixed-in-transform','<div style="transform:translateZ(0)"><div style="position:fixed;top:0;height:60px;width:100%;background:#fff">Bar</div></div>'],
 ['fixed-in-container-type','<div style="container-type:inline-size"><div style="position:fixed;top:0;height:60px;width:100%;background:#fff">Bar</div></div>'],
 ['cookie-banner-bottom','<div style="position:fixed;bottom:0;left:0;right:0;height:120px;background:#333;color:#fff">We use cookies <button>OK</button></div>'],
 ['chat-bubble','<div style="position:fixed;bottom:16px;right:16px;width:60px;height:60px;border-radius:50%;background:#06f"></div>'],
 ['transparent-header','<header style="position:fixed;top:0;height:60px;width:100%">Site</header>'],
 ['rtl-fixed-sidebar','<div dir=rtl><aside style="position:fixed;right:0;top:0;bottom:0;width:200px;background:#eee">Side</aside></div>'],
 ['shadow-fixed-header','<x-h></x-h><script>customElements.define("x-h",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<div style=\\"position:fixed;top:0;left:0;right:0;height:60px;background:#fff\\">Hdr</div>"}})</script>'],
 ['wp-admin-bar','<div id=wpadminbar style="position:fixed;top:0;left:0;width:100%;height:32px;background:#1d2327;z-index:99999">Admin</div>',{excludeSelectors:['#wpadminbar']}],
 ['quirks-fixed-footer','<div style="position:fixed;bottom:0;left:0;right:0;height:80px;background:#333">F</div>','quirks'],
];
run4(cases.map(([n,b,o])=>({name:n,rules:R,html:o==='quirks'?W(b,''):W(b),opts:typeof o==='object'?o:undefined})),{modes:['chrome']});
