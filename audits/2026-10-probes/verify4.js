const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const dom=new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id=host></div><div id=a>x</div><div id=b><p id=d>1</p><p id=d>2</p></div></main></body></html>');
const w=dom.window;Object.assign(global,{window:w,document:w.document,Node:w.Node,Element:w.Element,getComputedStyle:w.getComputedStyle});
w.document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<img src=s.png><button></button>';
const core=require('/home/user/core/src/index.js');
const o=(r,id)=>r.checksResults.find(c=>c.ruleId===id)?.outcome;
let r=core.runDomRulesInPage('u','#host',{},['img-alt-present','button-name-present']);console.log('scope host:',o(r,'img-alt-present'),o(r,'button-name-present'));
r=core.runDomRulesInPage('u','main',{},['img-alt-present','button-name-present']);console.log('scope main:',o(r,'img-alt-present'),o(r,'button-name-present'));
try{core.runDomRulesInPage('u',null,{policyContract:'constructor'},null);console.log('ctor ok')}catch(e){console.log('policyContract ctor threw:',e.message)}
r=core.runDomRulesInPage('u',null,{},{includeRuleIds:['nope']});console.log('object typo ran',r.checksResults.length);
r=core.runDomRulesInPage('u','#a',{wcagVersion:'2.1'},['duplicate-id']);console.log('dup-id scoped:',o(r,'duplicate-id'));
