const {runa11yCoreOnHtml}=require('/home/user/core/src/testing.js');
const r=runa11yCoreOnHtml('<html><body><img src=x><button></button><div role=foo aria-x=1>x</div></body></html>',{entryPointParity:false,engineOptions:{locale:'de'}});
for(const c of r.checksResults) if(c.occurrences.length){console.log(JSON.stringify(c.occurrences[0],null,1).slice(0,2500));break;}
console.log(JSON.stringify(r.engine).slice(0,800)); console.log(Object.keys(r.rulesResults[0]||{}), r.rulesResults.length)
