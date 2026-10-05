const { chromium } = require('/home/user/core/node_modules/playwright');
const core = require('./proj/node_modules/@surea11y/core');
const http = require('http');
async function launch(){ return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
// tiny server: routes map path -> {body, headers}
function serve(routes){ return new Promise(r=>{ const s=http.createServer((req,res)=>{ const rt=routes[req.url.split('?')[0]]; if(!rt){res.statusCode=404;return res.end('nf');} if(rt.delay){ return setTimeout(()=>{res.writeHead(200,rt.headers||{'content-type':'text/html'});res.end(rt.body)}, rt.delay);} if(rt.hang){return;} res.writeHead(200,rt.headers||{'content-type':'text/html; charset=utf-8'}); res.end(rt.body);}); s.listen(0,()=>r({server:s,base:'http://127.0.0.1:'+s.address().port})); }); }
const FN = core.runa11yCoreInPage.toString();
async function scanPage(page, url, ctx=null, opts={}, runOnly=null){
  return page.evaluate(([fn,u,c,o,ro])=>{ const f=(0,eval)('('+fn+')'); return f(u,c,o,ro); }, [FN,url,ctx,opts,runOnly]);
}
module.exports={launch,serve,scanPage,core,FN};
