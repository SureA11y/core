const { chromium } = require('/home/user/core/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:320,height:640}});
await p.setContent('<!doctype html><html lang="ar"><head><title>t</title></head><body dir="rtl" style="margin:8px"><div id="w" style="width:600px;background:#eee">بداية النص هنا ... نهاية</div></body></html>');
console.log(await p.evaluate(()=>{const r=w.getBoundingClientRect();const s=document.scrollingElement;s.scrollLeft=1000;const a=s.scrollLeft;s.scrollLeft=-1000;return {l:r.left,r:r.right,sw:s.scrollWidth,cw:s.clientWidth,maxRight:a,minLeft:s.scrollLeft, dirHtml:getComputedStyle(document.documentElement).direction}}));
await b.close();})();
