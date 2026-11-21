'use strict';
// p-as-heading alone under jsdom, 1.17.0 vs main bundle, bold-paragraph page and the grid page; median of 5.
const J=require('./jsdom-bundle.js');const L=require('./lib.js');const {kinds}=require('./perf-pages.js');Object.assign(kinds,require('./perf-pages2.js').kinds);
(async()=>{for(const [kind,n] of [['bold',3000],['grid',3000],['mixed',3000]]){const html=kinds[kind](n);const t={base:[],head:[]};let o={};
for(let k=0;k<5;k++)for(const v of k%2?['head','base']:['base','head']){const {r,dom}=J.scanWith(v,html,{perfStats:true,profileRules:true},{includeRuleIds:['p-as-heading']});t[v].push(r.perfStats.ruleTimings['p-as-heading']);o[v]=r.checksResults[0].outcome+'/'+r.checksResults[0].occurrences.length;dom.window.close();await new Promise(r=>setTimeout(r,5));}
console.log(JSON.stringify({kind,n,baseMs:+L.median(t.base).toFixed(1),headMs:+L.median(t.head).toFixed(1),ratio:+(L.median(t.head)/L.median(t.base)).toFixed(2),o}));}})();
