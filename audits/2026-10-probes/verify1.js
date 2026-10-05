const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const dom=new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><main><button onclick="x()">b</button></main></body></html>');
Object.assign(global,{window:dom.window,document:dom.window.document,Node:dom.window.Node,Element:dom.window.Element,getComputedStyle:dom.window.getComputedStyle});
const core=require('/home/user/core/src/index.js');
const rule={runInPage(ctx){return {outcome:'fail',occurrences:[{__node:ctx.helpers.queryAll('[onclick]')[0]}]};}};
try{const r=core.runDomRulesInPage(null,null,{customRules:[{id:'z',meta:{title:'Z'},runInPage:rule.runInPage.toString()}]},null);
console.log('method-shorthand string -> z present?', r.checksResults.some(c=>c.ruleId==='z'));}catch(e){console.log('threw',e.message)}
try{core.runDomRulesInPage(null,null,{customRules:[{id:'y',meta:{deprecated:true},runInPage:()=>({outcome:'pass',occurrences:[]})}]},null);console.log('deprecated ok')}catch(e){console.log('deprecated threw:',e.message.slice(0,120))}
const r2=core.runDomRulesInPage(null,null,{customRules:[{id:'u',meta:{},runInPage:()=>undefined}]},null);console.log('undefined-return present?',r2.checksResults.some(c=>c.ruleId==='u'));
