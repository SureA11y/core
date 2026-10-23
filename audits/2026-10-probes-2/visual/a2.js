const {page,close}=require('./h');
(async()=>{const p=await page(`<p id=a style="font-size:11pt;line-height:1.5 !important;letter-spacing:0.12em !important;word-spacing:0.16em !important">x y</p><p id=b style="font-size:1.1em;line-height:1.5 !important">x</p>`);
console.log(await p.evaluate(()=>[a,b].map(e=>{const c=getComputedStyle(e);return [c.fontSize,c.lineHeight,c.letterSpacing,c.wordSpacing, parseFloat(c.lineHeight)/parseFloat(c.fontSize), parseFloat(c.letterSpacing)/parseFloat(c.fontSize)].join(' ')})));await close();})();
