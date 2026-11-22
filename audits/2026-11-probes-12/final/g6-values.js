// Put value V on Object.prototype for groups of names the engine reads through the chain (g1 list); find names that change outcomes.
const fs=require('fs');const tree=process.argv[2];const V=JSON.parse(process.argv[3]||'true');const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');
const html=`<!doctype html><html lang=en><head><title>Shop page</title><style>.lo{color:#999}a.u{text-decoration:none;color:#36c}button:focus{outline:none}</style></head><body><header><nav aria-label=Main><a href=/>Home</a></nav></header><main><h1>Title</h1><img src=a.png><img src=b.png alt="photo"><p class=lo>Low contrast text</p><p>Read <a class=u href=/x>more here</a> now.</p>
<div aria-hidden=true><a href=#z>hidden link</a></div><input type=text><label>Name <input id=n></label><button></button><button>OK</button><div role=button onclick="x()">Go</div><span style="color:#ccc">€</span>45
<table><tr><th>A</th></tr><tr><td>1</td></tr></table><ul role=navigation><li><a href=#>a</a></li></ul><svg width=100 height=30><rect width=100 height=30 fill="#fff"/><text x=2 y=20 fill="#eee">Hi</text></svg><select><option>1</option></select><p lang=xx>t</p><a href=#>click here</a><a href=#>click here</a><h3>Skipped</h3><div tabindex=5>t</div></main><footer>f</footer></body></html>`;
const names=[...new Set(fs.readFileSync('/tmp/surea11y-audit/r12/final/g1-jsdom-composite.out','utf8').split('\n').map(l=>l.match(/^(\S+)\|(plain|array) /)).filter(Boolean).map(m=>m[1]))];
const {JSDOM,VirtualConsole}=require('/home/user/r12-final/node_modules/jsdom');
function run(l){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:new VirtualConsole()});d.window.eval(B);
 const OP=d.window.Object.prototype;const own=new Set(Object.getOwnPropertyNames(OP));for(const n of l)if(!own.has(n))OP[n]=V;
 let r;try{r=d.window.a11ycore.runa11yCoreInPage(null,null,{},null);}catch(e){d.window.close();return {err:(e.code||e.name)+' '+e.message.slice(0,100)};}
 const s={};for(const c of r.checksResults)s[c.ruleId]=c.outcome+':'+(c.occurrences||[]).map(x=>x.occurrenceOutcome+'/'+(((x.data||{}).details||{}).reasonCode||'')).join(',')+(c.error?' ERR '+String(c.error.message||c.error).slice(0,80):'');d.window.close();return {s,n:r.checksResults.length};}
const base=run([]);
const differs=(r)=>r.err?r.err:(Object.keys(base.s).filter(k=>base.s[k]!==r.s[k]).length||r.n!==base.n?Object.keys(base.s).filter(k=>base.s[k]!==r.s[k]).map(k=>k+' '+base.s[k].slice(0,60)+' => '+String(r.s[k]).slice(0,120)).join(' ;; '):null);
const found=[];
function search(l){const d=differs(run(l));if(!d)return;if(l.length===1){found.push(l[0]);console.log('HIT',l[0],'|',d.slice(0,600));return;}const h=l.length>>1;search(l.slice(0,h));search(l.slice(h));}
for(let i=0;i<names.length;i+=200)search(names.slice(i,i+200));
console.log('names',names.length,'hits',found.length,found.join(','));
