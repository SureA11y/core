const {createDom,runa11yCoreOnDom}=require('/home/user/core/tests/helpers/runa11yCoreOnHtml');
const {runa11yCoreInPage}=require('/home/user/core/src/index.js');
function go(label, html, ctx, eo, ro, shadow){
  const dom=createDom(html.startsWith('<!doctype')?html:`<!doctype html><html lang=en><head><title>t</title></head><body>${html}</body></html>`);
  if(shadow) shadow(dom.window.document);
  let r; try{ r=runa11yCoreInPage('https://e.test/',ctx,eo,ro);}catch(e){console.log(label,'THROW',e.code||'',e.message.slice(0,100));return;}
  const cr=r.checksResults.filter(Boolean);
  console.log(label.padEnd(10),'rules run:',cr.length, cr.slice(0,3).map(x=>x.ruleId+'='+x.outcome+'['+(x.occurrences||[]).map(o=>o.selector).join(';')+']'+(x.error?' err='+x.error:'')).join(' '), 'ctx=',JSON.stringify(r.contextSelector));
}
const imgs='<main><img class="a" src=a.png><img class="b" src=b.png><img class="keep2" src=c.png></main>';
go('1 comma', imgs, null, {excludeSelectors:'img:not(.a, .b)'}, ['img-alt-present']);
go('2 shadow', '<div id="widget"></div><p>x</p>', null, {excludeSelectors:['#widget']}, ['contrast-minimum'], d=>{d.getElementById('widget').attachShadow({mode:'open'}).innerHTML='<p style="color:#999;background:#fff">Low contrast text</p>';});
go('3 region', '<div id="banner"><p>Cookie text</p></div><main><p>m</p></main>', null, {excludeSelectors:['#banner']}, ['region']);
go('7 ctx el', imgs+'<footer><img src=d.png></footer>', {include:['main']}, {}, ['img-alt-present']);
go('8 tag str', imgs, null, {}, {type:'tag', values:'wcag2aaaa'});
go('10 proto', imgs, null, {customRules:[{id:'__proto__',meta:{},runInPage:()=>({outcome:'fail',occurrences:[]})}]}, ['__proto__']);
go('11 err', imgs, null, {customRules:[{id:'zz',meta:{},runInPage:()=>({outcome:'failed',error:'oops',occurrences:[]})}]}, ['zz']);
go('13 obj', imgs, null, {customRules:{id:'zz',meta:{},runInPage:()=>({outcome:'fail',occurrences:[]})}}, null);
try{ const r=runa11yCoreInPage('https://e.test/',null,{customRules:{id:'zz',meta:{},runInPage:()=>({outcome:'fail',occurrences:[]})}},null); console.log('13 skipped:',JSON.stringify(r.skippedCustomRules), r.checksResults.some(x=>x&&x.ruleId==='zz'));}catch(e){console.log('13 throw',e.message)}
go('14 prefix', imgs, null, {}, {excludeRuleIds:['a11ycore-wcag-1.1.1-non-text-content']});
go('16 tests', imgs, null, {tests:{include:['img-alt-presnt']}}, null);
