const {run,core}=require('./h.js');
const cov=core.getLocaleCoverage(); console.log(JSON.stringify(cov).slice(0,600));
for (const loc of ['de','de-DE','DE','xx','',null,42,'  fr  ','ja','pt-BR','zh-Hant-TW','de_DE']) {
  const {r,err}=run({eo:{locale:loc}}); if(err){console.log(loc,'THROW',err.message);continue;}
  const b=r.checksResults.find(c=>c.ruleId==='button-name-present');
  console.log(JSON.stringify(loc).padEnd(14), JSON.stringify(r.engine.locale), '|', b.title, '|', b.occurrences[0].summary.slice(0,60), '| echo:', JSON.stringify(b.engineOptions.locale));
}
// messages override
let {r}=run({eo:{locale:'de', messages:{de:{'__nope':'x'}}}}); console.log('msgs de partial', JSON.stringify(r.engine.locale), 'echo has messages?', 'messages' in r.checksResults[0].engineOptions);
({r}=run({eo:{locale:'xx', messages:{xx:{}}}})); console.log('msgs xx empty', JSON.stringify(r.engine.locale));
({r}=run({eo:{locale:'xx', messages:'garbage'}})); console.log('msgs garbage', JSON.stringify(r.engine.locale));
({r}=run({eo:{locale:'xx', messages:null}})); console.log('msgs null', JSON.stringify(r.engine.locale));
