const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const fs=require('fs');
(async()=>{
 const html=fs.readFileSync('/home/user/core-r8/tests/fixtures/all-pass.html','utf8');
 let t=Date.now();
 const r=await runa11yCoreOnHtml(html,{engineOptions:{locale:'de',perfStats:true,profileRules:true}});
 console.log(Date.now()-t, Object.keys(r), r.checksResults.length, r.engine && r.engine.locale);
 console.log(JSON.stringify(r.perfStats).slice(0,600));
 const c=r.checksResults.find(c=>c.occurrences.length);
 console.log(c && JSON.stringify(c.occurrences[0]).slice(0,500));
})();
