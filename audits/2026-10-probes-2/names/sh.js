const {createDom, runa11yCoreOnDom} = require('/home/user/core/tests/helpers/runa11yCoreOnHtml');
module.exports=function(label, light, shadowFn, rules, opts={}){
  const dom=createDom('<!doctype html><html lang="en"><head><title>t</title></head><body>'+light+'</body></html>');
  shadowFn(dom.window.document);
  let r;
  try{ r=runa11yCoreOnDom(dom, Object.assign({runOnly:rules, includeShadowDom:true},opts)); }catch(e){console.log('THROW',label,e.message);return;}
  console.log('## '+label);
  for(const res of r.checksResults){
    console.log('  '+res.ruleId+' => '+res.outcome+(res.error?' ERR '+res.error:''));
    for(const o of res.occurrences||[]) console.log('     '+(o.html||'').slice(0,80)+' | '+(o.data?.details?.reasonCode||'')+' | '+(o.summary||'').slice(0,100));
  }
};
