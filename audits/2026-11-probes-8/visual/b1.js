const { cases, close } = require('./multi');
const T = ['target-size-minimum'];
(async () => {
await cases([
 ['after hit-area extension', `<style>.b{position:relative;width:16px;height:16px;padding:0;border:0;background:#333}.b::after{content:"";position:absolute;inset:-8px}</style><button class="b" aria-label="x"></button> <button class="b" aria-label="y" style="margin-left:4px"></button>`],
 ['circle 24', `<button style="width:24px;height:24px;border-radius:50%;padding:0;border:0" aria-label="a"></button><button style="width:24px;height:24px;border-radius:50%;padding:0;border:0" aria-label="b"></button>`],
 ['range input', `<input type="range"><input type="range">`],
 ['checkbox default', `<label><input type="checkbox">A</label><label><input type="checkbox">B</label>`],
 ['checkbox in label row', `<div><label style="display:block"><input type="checkbox"> Accept terms</label><label style="display:block"><input type="checkbox"> News</label></div>`],
 ['zoom 0.5 container 40px', `<div style="zoom:.5"><button style="width:40px;height:40px">a</button><button style="width:40px;height:40px">b</button></div>`],
 ['scale .5', `<div style="transform:scale(.5);transform-origin:0 0"><button style="width:40px;height:40px">a</button><button style="width:40px;height:40px">b</button></div>`],
 ['pagination', `<nav><a href="#" style="padding:2px">1</a> <a href="#" style="padding:2px">2</a> <a href="#" style="padding:2px">3</a></nav>`],
 ['vertical-lr list', `<ul style="writing-mode:vertical-lr;list-style:none"><li><a href="#">One</a></li><li><a href="#">Two</a></li></ul>`],
 ['label for small checkbox', `<input type="checkbox" id="c" style="width:12px;height:12px;margin:0"><label for="c" style="display:inline-block;padding:8px">Agree</label>`],
 ['rtl icons', `<div dir="rtl"><button style="width:16px;height:16px;padding:0">a</button><button style="width:16px;height:16px;padding:0">b</button></div>`],
 ['svg a', `<svg width="200" height="50"><a href="#"><rect width="10" height="10"/></a><a href="#"><rect x="12" width="10" height="10"/></a></svg>`],
 ['area map', `<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" usemap="#m" width="100" height="100"><map name="m"><area href="#" shape="rect" coords="0,0,10,10" alt="a"><area href="#" shape="rect" coords="12,0,22,10" alt="b"></map>`],
 ['summary', `<details><summary style="font-size:10px;line-height:10px">More</summary>x</details><details><summary style="font-size:10px;line-height:10px">More</summary>x</details>`],
 ['contenteditable small', `<div contenteditable style="width:10px;height:10px;border:1px solid"></div><div contenteditable style="width:10px;height:10px;border:1px solid"></div>`],
], T);
await close();
})();
