const {chromium}=require('/home/user/core/node_modules/playwright');
const bundle=process.argv[2];
const gen=(n,wrap)=>'<!doctype html><html lang=en><head><title>t</title><style>html{background:#fff}</style></head><body><main>'+Array.from({length:n},(_,i)=>wrap?`<div><p style="color:#000">Paragraph ${i} text</p></div>`:`<p style="color:#000">Paragraph ${i} text</p>`).join('')+'</main></body></html>';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const wrap of [false,true])for(const n of [5000,10000,20000,40000]){const p=await b.newPage();await p.setContent(gen(n,wrap));await p.addScriptTag({path:bundle});
const t=await p.evaluate(()=>{const ts=[];for(let k=0;k<2;k++){const r=window.a11ycore.runa11yCoreInPage(null,null,{perfStats:true,profileRules:true},['contrast-minimum']);ts.push(Math.round(r.perfStats.ruleTimings['contrast-minimum']));}return ts;});
console.log(wrap?'wrapped ':'siblings',n,t.join(' / '),'ms');await p.close();}
await b.close();})();
