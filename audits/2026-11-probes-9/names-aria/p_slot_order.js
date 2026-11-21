const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent(`<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>Title</h1><x-card id=c><h2 slot=body>Details</h2><h3 slot=head>Card heading</h3></x-card></main><script>customElements.define("x-card",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<slot name=head></slot><slot name=body></slot>";}})</script></body></html>`);
const cdp=await p.context().newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');
console.log(nodes.filter(n=>!n.ignored&&n.role.value==='heading').map(n=>n.name.value+' L'+n.properties.find(x=>x.name==='level').value.value).join(' -> '));await b.close();})();
