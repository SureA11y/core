const {run4}=require('./h.js');
const mk=(nr,ne,kind)=>{let css='';for(let i=0;i<nr;i++)css+=kind==='match'?`.c${i%50} a:focus{outline:none;color:red}\n`:`.x${i} a:focus{outline:none}\n`;
 let b='';for(let i=0;i<ne;i++)b+=`<div class="c${i%50}"><a href="#${i}">L${i}</a> <button>B</button></div>`;
 return `<!doctype html><html lang=en><head><title>t</title><style>${css}</style></head><body><main>${b}</main></body></html>`;};
run4([
 {name:'200rules-nomatch-2000el',html:mk(200,2000,'x'),rules:['css-focus-indicator-suppressed'],time:true,w:120},
 {name:'200rules-match-2000el',html:mk(200,2000,'match'),rules:['css-focus-indicator-suppressed'],time:true,w:120},
 {name:'1000rules-match-500el',html:mk(1000,500,'match'),rules:['css-focus-indicator-suppressed'],time:true,w:120},
]);
