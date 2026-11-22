const [root,pg]=process.argv.slice(2);const {JSDOM}=require('/home/user/r12-final/node_modules/jsdom');const core=require(root+'/src/index.js');
let html=require('fs').readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8').replace('</body>','<div id=sh></div><script>document.getElementById("sh").attachShadow({mode:"open"}).innerHTML="<p>x</p>"</script></body>');
const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously'});global.window=d.window;global.document=d.window.document;
const c=process.cpuUsage();const r=core.runDomRulesInPage('https://example.test/',null,{perfStats:true,profileRules:true},null);const u=process.cpuUsage(c);
console.log(root.split('/').pop(),pg,'whole scan cpu',Math.round((u.user+u.system)/1000),'ms; css-focus',Math.round(r.perfStats.ruleTimings['css-focus-indicator-suppressed']),'ms');
