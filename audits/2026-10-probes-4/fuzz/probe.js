const {runa11yCoreOnHtml}=require('/home/user/core/src/testing.js');
const fs=require('fs');
const html=fs.readFileSync('/home/user/core/tests/fixtures/all-pass.html','utf8');
let t=Date.now();
const r=runa11yCoreOnHtml(html,{entryPointParity:false,engineOptions:{perfStats:true,profileRules:true}});
console.log(Date.now()-t, Object.keys(r), r.checksResults.length);
console.log(JSON.stringify(r.perfStats).slice(0,1500));
console.log(JSON.stringify(r.checksResults.find(c=>c.outcome==='fail')||r.checksResults[0]).slice(0,1500));
t=Date.now();runa11yCoreOnHtml(html,{entryPointParity:false});console.log('2nd',Date.now()-t);
