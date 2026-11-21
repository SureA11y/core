'use strict';
// A native <marquee> moves its text by its own timer (not a CSS animation the scan holds still), so the contrast rules
// count and judge different text nodes from one scan to the next. node marquee-contrast.js [bundle]
const fs=require('fs');const C=require('./chrome-lib.js');
const BUNDLE=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):C.BUNDLE;
const PAGE=`<!DOCTYPE html><html lang="en"><head><title>T</title></head><body><main><h1>News</h1>
<marquee scrollamount="40" style="width:300px"><span style="color:#999;background:#aaa">Breaking: low contrast ticker</span> <b style="color:#000">ok</b></marquee>
<p>Body text</p></main></body></html>`;
(async()=>{const b=await C.launch();const p=await b.newPage();await p.setContent(PAGE);await p.evaluate(BUNDLE);
const seen={};for(let k=0;k<30;k++){await p.waitForTimeout(97);
const r=await p.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['contrast-minimum','contrast-computable']});return r.checksResults.map(c=>c.ruleId+':'+c.outcome+'/'+c.occurrences.length+' '+(c.occurrences[0]&&c.occurrences[0].summary||'').replace(/^.*?(\d+ text|Eligible text nodes: \d+)/,'$1').slice(0,40)).join(' | ')});
seen[r]=(seen[r]||0)+1;}
console.log(JSON.stringify(seen,null,1));await b.close();})();
