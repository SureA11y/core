process.env.PLAYWRIGHT_BROWSERS_PATH='/opt/pw-browsers';
const { chromium } = require('/home/user/core/node_modules/playwright');
const core=require('/home/user/core/src/index.js');
const {run,SAMPLE}=require('./h.js');
const fs=require('fs');
const src=core.runa11yCoreInPage.toString();
const shadowSetup=`(()=>{const h=document.getElementById('host'); const sr=h.attachShadow({mode:'open'}); sr.innerHTML='<div class="inner"><img src="s.png"><button></button></div>';})()`;
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await browser.newPage();
  async function cr(html, args){ await page.setContent(html); await page.evaluate(shadowSetup).catch(()=>{});
    return page.evaluate(({src,args})=>{ const fn=(0,eval)('('+src+')'); try { return {r:fn(...args)}; } catch(e){ return {err:{message:e.message, code:e.code}}; } }, {src,args}); }
  const out=[];
  // spot checks
  for (const [k,args] of Object.entries({
    invalidCtx:[null,'#a[',{},null], typoRO:[null,null,{},['img-alt-presnt']], hostCtx:[null,'#host',{},['img-alt-present','button-name-present']],
    unmatched:[null,'#nope',{},null], profile:[null,null,{profile:'section508'},null], de:[null,null,{locale:'de-AT'},null],
    policyCtor:[null,null,{policyContract:'constructor'},null], exInvalid:[null,null,{excludeSelectors:['#a[']},['img-alt-present']],
  })) { const x=await cr(SAMPLE,args); console.log('CHROME',k, x.err?'THROW '+(x.err.code||'')+' '+x.err.message.slice(0,100): JSON.stringify({cm:x.r.contextMatch,n:x.r.checksResults.length,eng:{p:x.r.engine.profile,w:x.r.engine.wcagVersion,l:x.r.engine.locale}, sel: x.r.checksResults.filter(c=>c.outcome==='fail').map(c=>c.ruleId+'/'+c.occurrences.length).join(',')})); }
  // parity on medium page(s)
  const pages={sample:SAMPLE, allpass: fs.readFileSync('/home/user/core/tests/fixtures/all-pass.html','utf8')};
  const extra=fs.readdirSync('/home/user/core/tests/fixtures').filter(f=>/landmark-unique|form-control-programmatic-label-quality|target-size|text-spacing|region-all/.test(f)).slice(0,4);
  for (const f of extra) pages[f]=fs.readFileSync('/home/user/core/tests/fixtures/'+f,'utf8');
  for (const [name,html] of Object.entries(pages)) {
    const c=await cr(html,[ 'https://example.test/', null, {}, null]);
    const j=run({html: name==='sample'?html:html, setup: name==='sample'?(doc)=>{const h=doc.getElementById('host'); const sr=h.attachShadow({mode:'open'}); sr.innerHTML='<div class="inner"><img src="s.png"><button></button></div>';}:undefined});
    const jm=Object.fromEntries(j.r.checksResults.map(x=>[x.ruleId,x.outcome+'/'+x.occurrences.length]));
    const diffs=[]; for (const x of c.r.checksResults) { const a=x.outcome+'/'+x.occurrences.length; if (jm[x.ruleId]!==a && jm[x.ruleId]?.split('/')[0]!==x.outcome) diffs.push(x.ruleId+': jsdom='+jm[x.ruleId]+' chrome='+a); }
    console.log('PARITY',name,'env',JSON.stringify(c.r.engine.environment),'diffs',diffs.length); diffs.forEach(d=>console.log('   ',d));
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
