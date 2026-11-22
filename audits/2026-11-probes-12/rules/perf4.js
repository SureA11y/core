const {jsdomRun}=require('./h.js');
const mk=(nr,ne)=>{let css='';for(let i=0;i<nr;i++)css+=`.wp-block-x${i} .el-${i} a:focus, .woo-${i} button:focus-visible{outline:2px solid}\n`;
 let b='';for(let i=0;i<ne;i++)b+=`<div class="c"><a href="#${i}">L${i}</a></div>`;
 return `<!doctype html><html lang=en><head><title>t</title><style>${css}</style></head><body><main>${b}</main></body></html>`;};
(async()=>{for(const [nr,ne] of [[0,800],[150,800],[150,1600],[300,800]]){for(const t of ['r8','now']){const r=await jsdomRun(t,{html:mk(nr,ne),rules:['css-focus-indicator-suppressed']});console.log(nr,'rules',ne,'links',t,r._ms,'ms');}}})();
