const fs=require('fs'); const {launch}=require('./lib.cjs');
const LV=new Set(['none','note','warning','error']);
for(const k of ['violations','nasty','huge','clean','empty']){
 const raw=fs.readFileSync(`out-${k}.sarif`,'utf8'); const s=JSON.parse(raw); const issues=[];
 if(s.version!=='2.1.0') issues.push('version'); if(!s.$schema) issues.push('schema');
 const run=s.runs[0]; const ids=run.tool.driver.rules.map(r=>r.id); if(new Set(ids).size!==ids.length) issues.push('dup rule ids');
 for(const r of run.tool.driver.rules){ if(!r.helpUri) {issues.push('noHelpUri'); break;} }
 for(const r of run.results){ if(!ids.includes(r.ruleId)) issues.push('unknown ruleId '+r.ruleId); if('ruleIndex' in r && ids[r.ruleIndex]!==r.ruleId) issues.push('ruleIndex mismatch'); if(!LV.has(r.level)) issues.push('level '+r.level); if(!r.message||typeof r.message.text!=='string'||!r.message.text) issues.push('message missing '+r.ruleId); if(!r.locations||!r.locations.length) issues.push('noloc'); if(/\u0000/.test(r.partialFingerprints['surea11y/violation/v1'])) issues.push('NUL in fingerprint'); }
 const fpl=run.results.map(r=>r.partialFingerprints['surea11y/violation/v1'].length); 
 console.log('SARIF',k,'bytes',raw.length,'results',run.results.length,'maxFingerprintLen',Math.max(0,...fpl),'version',run.tool.driver.version,[...new Set(issues)].join('; '));
}
(async()=>{ const b=await launch(); const page=await b.newPage(); let alerts=[]; page.on('dialog',async d=>{alerts.push(d.message()); await d.dismiss();}); page.on('pageerror',e=>console.log('  PAGEERROR',e.message));
 await page.goto('about:blank');
 for(const k of ['violations','nasty','huge','clean','empty']){
  const xml=fs.readFileSync(`out-${k}.xml`,'utf8');
  const res=await page.evaluate(x=>{ const d=new DOMParser().parseFromString(x,'application/xml'); const pe=d.getElementsByTagName('parsererror')[0]; return {err:pe?pe.textContent.slice(0,200):null, suites:d.getElementsByTagName('testsuite').length, cases:d.getElementsByTagName('testcase').length, fails:d.getElementsByTagName('failure').length}; }, xml);
  console.log('JUNIT',k,'bytes',xml.length,JSON.stringify(res), 'ctrlchars', /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(xml));
 }
 for(const k of ['violations','nasty','huge']){
  alerts=[]; await page.goto('file://'+process.cwd()+`/out-${k}.html`); await page.waitForTimeout(300);
  // open details, search, page through
  await page.evaluate(()=>{document.querySelector('details').open=true;}); 
  const imgs=await page.evaluate(()=>document.querySelectorAll('img').length + document.querySelectorAll('tbody img').length);
  await page.fill('#search','onerror'); await page.waitForTimeout(100);
  const rowsShown=await page.evaluate(()=>document.querySelectorAll('#findings-body tr').length);
  const title=await page.title();
  console.log('HTML',k,'alerts',alerts.length,'imgElements',imgs,'searchRows',rowsShown,'title',title.slice(0,60));
 }
 await b.close(); })();
