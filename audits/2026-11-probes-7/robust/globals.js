// Which globals and window properties does a scan leave behind (beyond the bundle's own a11ycore)? Chromium and jsdom.
const C=require('./chrome-lib.js');const L=require('./lib.js');
const HTML='<html lang="en"><title>t</title><body><main><h1>x</h1><button></button><p style="color:#999">t</p></main></body></html>';
(async()=>{const b=await C.launch();const p=await b.newPage();await p.setContent(HTML);await C.inject(p);
const before=await p.evaluate(()=>Object.getOwnPropertyNames(window).concat(Object.getOwnPropertySymbols(window).map(String)));
await C.scan(p,{perStats:false});await C.scan(p,{perfStats:true});
const after=await p.evaluate(()=>Object.getOwnPropertyNames(window).concat(Object.getOwnPropertySymbols(window).map(String)));
console.log('chrome new globals after scans:',after.filter(x=>!before.includes(x)));
const docProps=await p.evaluate(()=>Object.getOwnPropertyNames(document).concat(Object.getOwnPropertyNames(document.documentElement)));console.log('chrome own props on document/html:',docProps);
await b.close();
const dom=L.open(HTML);const w=dom.window;const bw=Object.getOwnPropertyNames(w);const bd=Object.getOwnPropertyNames(w.document);
L.scanJsdom(HTML,{perfStats:true},null,dom);console.log('jsdom new window props:',Object.getOwnPropertyNames(w).filter(x=>!bw.includes(x)),'doc props:',Object.getOwnPropertyNames(w.document).filter(x=>!bd.includes(x)));
})();
