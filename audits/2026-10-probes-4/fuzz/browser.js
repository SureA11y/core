const {chromium}=require('/home/user/core/node_modules/playwright');const fs=require('fs');
const bundle=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage();
for(const html of process.argv.slice(2)){await p.setContent(html);await p.addScriptTag({content:bundle});
const out=await p.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(location.href,null,{});const o=[];for(const c of r.checksResults)for(const x of c.occurrences){if(!x.selector)continue;let root=document;for(const h of x.shadowHostSelectors||[])root=root.querySelector(h).shadowRoot;const el=root.querySelector(x.selector);o.push(c.ruleId+' '+c.outcome+' '+JSON.stringify(x.selector)+' '+(x.html||'').slice(0,40)+' => '+(el?el.outerHTML.slice(0,40):null));}return o;});
console.log('---');console.log(out.join('\n'));}
await b.close();})();
