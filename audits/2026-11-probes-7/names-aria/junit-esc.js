const {run}=require('./jsd');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
(async()=>{ const r=await run(`<main><img src=a.png alt="]]&gt;&lt;/failure&gt;&lt;x&gt; \u0001\u0008 ￾.png"><a href="/a">Read more</a><a href="/b">Read more</a><button aria-label="Next ]]&gt; \u0007">Prev</button></main>`,['img-alt-quality','label-in-name','identical-links-same-purpose']);
 const x=renderJunitReport(r,{}); const bad=x.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g); console.log('junit ctrl chars:', bad&&bad.map(c=>c.charCodeAt(0)));
 console.log('cdata count', (x.match(/<!\[CDATA\[/g)||[]).length, 'raw </failure><x>', /<\/failure><x>/.test(x));
 try { const {JSDOM}=require('/home/user/core/node_modules/jsdom'); const d=new JSDOM(x,{contentType:'text/xml'}); console.log('junit XML parses OK', d.window.document.documentElement.nodeName); } catch(e){ console.log('XML PARSE ERROR', e.message.slice(0,200)); }
 const s=renderSarifReport(r,{}); JSON.parse(typeof s==='string'?s:JSON.stringify(s)); console.log('sarif ok');
})();
