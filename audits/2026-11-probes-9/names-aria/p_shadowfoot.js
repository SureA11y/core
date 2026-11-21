const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent('<!doctype html><html lang=en><head><title>t</title></head><body><header>Site</header><main>x</main><div id=footer>Footer text</div><x-foot id=s></x-foot><script>customElements.define("x-foot",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<footer id=f>Shadow footer</footer>";}})</script></body></html>');
const cdp=await p.context().newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');
console.log(nodes.filter(n=>!n.ignored).map(n=>n.role.value+':'+(n.name&&n.name.value||'')).join(' | '));await b.close();})();
