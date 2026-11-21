const { chromium } = require('/home/user/core-r10/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent('<!doctype html><html lang="en"><head><title>T</title></head><body><main>'+process.argv[2]+'</main></body></html>');
const cdp=await p.context().newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');
const by=new Map(nodes.map(n=>[n.nodeId,n]));const root=nodes[0];
const pr=(n,d)=>{if(!n)return; const ig=n.ignored; console.log('  '.repeat(d)+(ig?'(ignored) ':'')+(n.role&&n.role.value)+' '+JSON.stringify(n.name&&n.name.value||'')+(ig?' '+(n.ignoredReasons||[]).map(r=>r.name).join(','):'')); for(const c of n.childIds||[]) pr(by.get(c),d+1);};
pr(root,0);await b.close();})();
