'use strict';
process.env.ROOT=process.env.ROOT||'/home/user/r12-review';
const H=require('/tmp/surea11y-audit/r12/api/h.js');const vm=require('vm');
const html=H.page('<img src=a.png>');
const mk=(o)=>({name:'pk',version:'1.0.0',namespace:'pk',core:'*',rules:[{id:'pk-rule',meta:{title:'T',description:'d',tags:['wcag2a','wcag111'],wcagSc:['1.1.1']},runInPage(ctx){return {outcome:o.outcome,occurrences:[]}}}]});
const out=(s)=>s.err?('ERR '+s.err.message.slice(0,120)):(s.r.checksResults.find(c=>c.ruleId==='pk-rule')||{}).outcome;
// 1. same-realm: mutate nested data between scans
{const cfg={outcome:'pass'};const p=mk(cfg);p.rules[0].meta.title='A';
 console.log('same realm 1:',out(H.scan(html,{packs:[p]})),'frozen caller?',Object.isFrozen(p));
 p.rules[0].runInPage=function(){return{outcome:'fail',occurrences:[]}};console.log('same realm, function swapped:',out(H.scan(html,{packs:[p]})));}
// 2. cross-realm pack: plain object made in another realm
{const ctx=vm.createContext({});const p=vm.runInContext(`({name:'pk',version:'1.0.0',namespace:'pk',core:'*',rules:[{id:'pk-rule',meta:{title:'T',description:'d',tags:['wcag2a','wcag111'],wcagSc:['1.1.1']}}]})`,ctx);
 p.rules[0].runInPage=function(){return{outcome:'pass',occurrences:[]}};
 console.log('cross realm 1:',out(H.scan(html,{packs:[p]})),'frozen?',Object.isFrozen(p),Object.isFrozen(p.rules));
 p.rules[0].runInPage=function(){return{outcome:'fail',occurrences:[]}};
 console.log('cross realm after swap (want fail):',out(H.scan(html,{packs:[p]})));}
// 3. same-realm pack holding a cross-realm rules array
{const ctx=vm.createContext({});const rules=vm.runInContext('[]',ctx);const p=mk({outcome:'pass'});rules.push(p.rules[0]);p.rules=rules;
 console.log('xrealm array 1:',out(H.scan(html,{packs:[p]})));
 rules[0]={...rules[0],runInPage(){return{outcome:'fail',occurrences:[]}}};console.log('xrealm array after swap (want fail):',out(H.scan(html,{packs:[p]})));}
// 4. Object.create(null) data and a Map in pack
{const p=mk({outcome:'pass'});p.data=new Map([['a',1]]);console.log('map pack:',out(H.scan(html,{packs:[p]})));}
