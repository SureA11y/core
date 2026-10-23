const {scan,out,tryit}=require('./h');
const html=`<html lang=en><head><title>t</title></head><body><main><div id=host></div></main><script>document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<img src=x.png><button></button>';</script></body></html>`;
// jsdom scripts don't run by default; attach manually
const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const core=require('/home/user/core/src/index.js');
function run(ctx){const dom=new JSDOM(html.replace(/<script.*<\/script>/,''),{url:'https://e.test/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
dom.window.document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<img src=x.png><button></button>';
const r=core.runa11yCoreInPage('https://e.test/',ctx,{},['img-alt-present','button-name-present']);
return r.checksResults.map(c=>c.id+':'+c.outcome).join(', ');}
tryit('#host',()=>run('#host')); tryit('main',()=>run('main'));
