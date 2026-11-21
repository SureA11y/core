// css-focus-indicator-suppressed alone: time vs number of :focus rules (R) and of focusable elements (E). Median of 3.
const C=require('./chrome-lib.js');const L=require('./lib.js');
const page=(R,E)=>{let css='';for(let i=0;i<R;i++)css+=`.c${i}:focus{outline:none}\n.c${i}{color:#222}\n`;let b='';for(let i=0;i<E;i++)b+=`<a class="c${i%R}" href="#${i}">L${i}</a> `;return `<!DOCTYPE html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main><p>${b}</p></main></body></html>`};
(async()=>{const b=await C.launch();
for(const [R,E] of JSON.parse(process.argv[2])){const ts=[];let occ;for(let k=0;k<3;k++){const p=await b.newPage();await p.setContent(page(R,E));await C.inject(p);
const r=await p.evaluate(()=>{const t=performance.now();const r=window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['css-focus-indicator-suppressed']});return [performance.now()-t,r.checksResults[0].occurrences.length]});ts.push(r[0]);occ=r[1];await p.close();}
console.log(JSON.stringify({R,E,ms:+L.median(ts).toFixed(0),occ}));}
await b.close();})();
