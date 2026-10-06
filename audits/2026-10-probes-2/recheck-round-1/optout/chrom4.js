const http=require('http');const fs=require('fs');const {chromium}=require('/home/user/core/node_modules/playwright');
const xb=fs.readFileSync(__dirname+'/xf-bundle.js','utf8');
const srv=http.createServer((q,s)=>{const u=q.url;if(u==='/x.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end(xb);}
 if(u==='/hang.html'){return;} if(u==='/'){s.writeHead(200,{'content-type':'text/html'});return s.end('<html lang=en><title>t</title><script src=/x.js></script><body><iframe title=h src="/hang.html"></iframe><iframe title=b src="about:blank"></iframe><iframe title=sd srcdoc="<p>hi"></iframe><iframe title=x sandbox src="/hang2.html"></iframe>');} s.writeHead(404);s.end();});
srv.listen(0,async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const pg=await br.newPage();
await pg.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
const r=await pg.evaluate(async()=>{const inner=[...document.querySelectorAll('iframe')].map(f=>{try{return f.contentWindow.location.href}catch(e){return 'X'}});const r=await xcore.runa11yCoreAcrossFrames(location.href,null,{pingWaitTime:300,frameWaitTime:300},['img-alt-present']);return {inner,frames:r.frames.map(f=>({url:f.url,err:!!f.error}))};});
console.log(JSON.stringify(r));await br.close();process.exit(0);});
