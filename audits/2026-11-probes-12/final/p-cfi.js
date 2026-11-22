// css-focus-indicator-suppressed alone, jsdom CPU: shop/forms pages; plus a shop page with one open shadow root (bypasses early exit)
const [root,pg,shadow]=process.argv.slice(2);const {JSDOM}=require('/home/user/r12-final/node_modules/jsdom');const core=require(root+'/src/index.js');
let html=require('fs').readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');
if(shadow)html=html.replace('</body>','<div id=sh></div><script>document.getElementById("sh").attachShadow({mode:"open"}).innerHTML="<p>x</p>"</script></body>');
const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:shadow?'dangerously':undefined});global.window=d.window;global.document=d.window.document;
const c=process.cpuUsage();const r=core.runDomRulesInPage('https://example.test/',null,{rules:{include:['css-focus-indicator-suppressed']}},null);const u=process.cpuUsage(c);
console.log(root.split('/').pop(),pg,shadow?'shadow':'',Math.round((u.user+u.system)/1000),'ms',r.checksResults[0].outcome);
