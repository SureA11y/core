const { chromium } = require('/home/user/core-r9/node_modules/playwright');
const pages={
shadowFooter:`<!doctype html><html lang="en"><head><title>T</title></head><body><header>Site</header><main>x</main><div id=footer>Footer text</div><x-foot></x-foot><script>customElements.define("x-foot",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<footer>Shadow footer</footer>";}})</script></body></html>`,
internalsBanner:`<!doctype html><html lang="en"><head><title>T</title></head><body><x-hdr>Site</x-hdr><main>x</main><div id=header>Header</div><script>customElements.define("x-hdr",class extends HTMLElement{constructor(){super();this._internals=this.attachInternals();this._internals.role="banner";}})</script></body></html>`};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [k,html] of Object.entries(pages)){const p=await b.newPage();await p.setContent(html);
const cdp=await p.context().newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');
await p.addScriptTag({path:'/home/user/core-r9/surea11y.browser.js'});
const out=await p.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{},['page-zones-landmark','landmark-no-duplicate-contentinfo','landmark-no-duplicate-banner','region']);return r.checksResults.map(c=>c.ruleId+': '+c.outcome+' '+c.occurrences.map(o=>o.selector+' '+o.summary).join(' ; '))});
console.log('##',k,'| AX landmarks:',nodes.filter(n=>!n.ignored&&['banner','contentinfo','main'].includes(n.role.value)).map(n=>n.role.value).join(','));console.log(out.join('\n'));await p.close();}
await b.close();})();
