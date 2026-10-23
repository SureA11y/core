const {JSDOM}=require('/home/user/core/node_modules/jsdom');
function scan(html){const dom=new JSDOM(html);
Object.assign(global,{window:dom.window,document:dom.window.document,Node:dom.window.Node,Element:dom.window.Element,getComputedStyle:dom.window.getComputedStyle});
delete require.cache[require.resolve('/home/user/core/src/index.js')];
return require('/home/user/core/src/index.js').runDomRulesInPage('http://x/',null,{},null);}
const b=require('/home/user/core/src/baseline.js');const sarif=require('/home/user/core/src/sarif.js');const junit=require('/home/user/core/src/junit.js');
console.log(Object.keys(b));
const a=scan('<!doctype html><html><head><title>t</title></head><body><main><h1>x</h1><p>a</p></main></body></html>');
const c=scan('<!doctype html><html><head><title>t</title></head><body><main><h1>x</h1><p>a</p><p>new para</p></main></body></html>');
const base=b.buildBaselineEntries? b.buildBaselineEntries(a):null;
const m=b.matchBaseline(c,base);console.log(JSON.stringify(Object.fromEntries(Object.entries(m).map(([k,v])=>[k,Array.isArray(v)?v.map(x=>x.ruleId||x):v]))).slice(0,400));
const xf={topFrame:a,frames:[]};
const j=junit.renderJunitReport? junit.renderJunitReport(xf):Object.keys(junit);console.log(String(j).slice(0,300));
