'use strict';
// A scan scrolls the window (focus-not-obscured-*) and puts it back; the page still gets its 'scroll' event afterwards.
// A common pattern defers a widget until the first scroll; the scan loads it, and the next scan of the same page differs.
// node scroll-reaches-page.js [bundle]
const fs=require('fs');const C=require('./chrome-lib.js');
const BUNDLE=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):C.BUNDLE;
const links=Array.from({length:60},(_,i)=>`<p>Paragraph ${i} <a href="/l${i}">link ${i}</a></p>`).join('');
const PAGE=`<!DOCTYPE html><html lang="en"><head><title>T</title><style>body{margin:0}header{position:sticky;top:0;background:#fff;height:50px}</style></head><body>
<header><a href="/">Home</a></header><main><h1>Title</h1>${links}</main>
<script>
// Defer the chat widget until the reader first scrolls (a common pattern).
window.addEventListener('scroll',function load(){window.removeEventListener('scroll',load);
 const d=document.createElement('div');d.id='chat';d.style.cssText='position:fixed;right:0;bottom:0;width:100%;height:200px;background:#333;color:#fff';
 d.innerHTML='<button>Chat with us</button>';document.body.appendChild(d);});
</script></body></html>`;
(async()=>{const b=await C.launch();const p=await b.newPage({viewport:{width:1280,height:720}});await p.setContent(PAGE);await p.waitForTimeout(300);
await p.evaluate(BUNDLE);
const one=async()=>p.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['focus-not-obscured-minimum','region','target-size-enhanced']});return r.checksResults.map(c=>c.ruleId+':'+c.outcome+'/'+c.occurrences.length)});
const before=await p.evaluate(()=>!!document.getElementById('chat'));
const r1=await one();await p.waitForTimeout(300);
const mid=await p.evaluate(()=>({chat:!!document.getElementById('chat'),y:scrollY}));
const r2=await one();
const s1=await p.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['img-alt-present']});return 'ok'});
console.log(JSON.stringify({chatBeforeScan:before,scan1:r1,afterScan1:mid,scan2:r2}));await b.close();})();
