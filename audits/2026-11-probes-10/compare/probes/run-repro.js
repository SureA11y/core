const { chromium } = require('/home/user/core-r10/node_modules/playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const f of fs.readdirSync('../repro').sort()){const p=await b.newPage();await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await p.goto('file:///tmp/surea11y-audit/r10/compare/repro/'+f);await p.addScriptTag({path:'/home/user/core-r10/surea11y.browser.js'});
const re={'c10-1':/deprecated/,'c10-2':/scrollable/,'c10-3':/click-handler/,'c10-4':/prohibited-children|required-children/,'c10-5':/embed|object-text-alternative-present/,'c10-6':/video-poster/,'c10-7':/aria-prohibited-attr/}[f.slice(0,5)];
const r=await p.evaluate(async(src)=>{const re=new RegExp(src);const res=await window.a11ycore.runa11yCoreInPage(null,null,{},null);return res.checksResults.filter(c=>re.test(c.ruleId)).map(c=>c.ruleId+': '+c.outcome+' '+JSON.stringify(c.occurrences.map(o=>[o.selector,o.occurrenceOutcome,o.data&&o.data.details&&o.data.details.reasonCode,o.lean&&o.lean.toward,o.summary&&o.summary.slice(0,90)])));},re.source);
console.log('##',f);for(const l of r)console.log('  '+l);await p.close();}
await b.close();})();
