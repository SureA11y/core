// node fixdiff.js [chrome|jsdom] -> prints outcome diffs main vs worktree across tests/fixtures/*.html
const fs=require('fs');const path=require('path');
const mode=process.argv[2]||'chrome';
const FIX='/home/user/r12-speed/tests/fixtures';
const files=fs.readdirSync(FIX).filter(f=>f.endsWith('.html'));
const sig=r=>{const o={};for(const c of r.checksResults)o[c.ruleId]=c.outcome+'/'+JSON.stringify(c.occurrences||[])+JSON.stringify(c.metrics||null);return o;};
(async()=>{
 const out={};
 if(mode==='jsdom'){
  const {JSDOM}=require('/home/user/core/node_modules/jsdom');
  for(const which of ['/tmp/scratch/f126/base','/home/user/r12-speed']){
   delete require.cache[require.resolve(which+'/src/core.js')];
   const core=require(which+'/src/core.js');
   for(const f of files){const html=fs.readFileSync(path.join(FIX,f),'utf8');
    const dom=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
    let r;try{r=sig(core.runDomRulesInPage(dom.window.location.href,null,{},null));}catch(e){r={err:String(e)}}
    (out[f]=out[f]||[]).push(r);dom.window.close();}
  }
 } else {
  const {chromium}=require('/home/user/core/node_modules/playwright');
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const bundles=[fs.readFileSync('/tmp/scratch/f126/base/surea11y.browser.js','utf8'),fs.readFileSync('/home/user/r12-speed/surea11y.browser.js','utf8')];
  for(const f of files){const html=fs.readFileSync(path.join(FIX,f),'utf8');
   for(const B of bundles){const p=await b.newPage();await p.setContent(html);await p.addScriptTag({content:B});
    let r;try{r=await p.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{},null);const o={};for(const c of r.checksResults)o[c.ruleId]=c.outcome+'/'+JSON.stringify(c.occurrences||[])+JSON.stringify(c.metrics||null);return o;});}catch(e){r={err:String(e).slice(0,100)}}
    (out[f]=out[f]||[]).push(r);await p.close();}
  }
  await b.close();
 }
 let n=0;for(const f of files){const [a,b]=out[f];for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(a[k]!==b[k]){n++;console.log(f,k,String(a[k]).slice(0,300),'=>',String(b[k]).slice(0,300));}}
 console.log('diffs',n,'files',files.length,'rules in first',Object.keys(out[files[0]][0]).length, JSON.stringify(out[files[0]][0]).slice(0,200));
})();
