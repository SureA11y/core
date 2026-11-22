process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const { chromium } = require('/home/user/r12-contrast/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent(`<body style="margin:0"><x-s style="font:40px sans-serif">Buy now</x-s><script>customElements.define('x-s',class extends HTMLElement{connectedCallback(){this.attachShadow({mode:'open'}).innerHTML='<div style="color:#aaa"><slot></slot></div>'}})</script>`);
const buf=await p.screenshot({clip:{x:0,y:0,width:200,height:50}});
const {PNG}=(()=>{try{return require('/home/user/r12-contrast/node_modules/pngjs')}catch(e){return {}}})();
if(PNG){const img=PNG.sync.read(buf);let min=255;for(let i=0;i<img.data.length;i+=4)min=Math.min(min,img.data[i]);console.log('darkest R',min);} else {require('fs').writeFileSync('slot.png',buf);console.log('saved')}
await b.close();})();
