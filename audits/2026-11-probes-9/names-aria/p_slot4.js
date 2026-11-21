const { chromium } = require('/home/user/core-r9/node_modules/playwright');
const html=`<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>T</h1><x-s id=c><h2 slot=b>B second</h2><h4 slot=a>A first</h4></x-s></main><script>customElements.define("x-s",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<slot name=a></slot><slot name=b></slot>";}})</script></body></html>`;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent(html);


await p.addScriptTag({path:'/home/user/core-r9/surea11y.browser.js'});
console.log(await p.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{},['page-has-heading-one','heading-order']);return JSON.stringify(r.checksResults.find(c=>c.ruleId==='heading-order').occurrences.map(o=>o.summary))}));
await b.close();})();
