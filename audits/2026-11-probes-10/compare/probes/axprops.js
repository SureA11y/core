const { chromium } = require('/home/user/core-r10/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent('<!doctype html><html lang="en"><head><title>T</title></head><body><main>'+process.argv[2]+'</main></body></html>');
const cdp=await p.context().newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');
for(const n of nodes){ if(n.ignored) continue; const r=n.role&&n.role.value; if(['StaticText','InlineTextBox','RootWebArea','main','generic'].includes(r)) continue; console.log(r, JSON.stringify(n.name&&n.name.value), 'value='+JSON.stringify(n.value&&n.value.value), (n.properties||[]).map(x=>x.name+'='+JSON.stringify(x.value.value)).join(' '));}
await b.close();})();
