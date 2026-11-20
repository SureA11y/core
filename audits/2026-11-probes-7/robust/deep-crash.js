const C=require('./chrome-lib.js');
(async()=>{for(const d of [+process.argv[2]]){const b=await C.launch();const p=await b.newPage();await p.setContent('<main></main>');
try{await p.evaluate((d)=>{let c=document.querySelector('main');for(let i=0;i<d;i++){const e=document.createElement('div');c.appendChild(e);c=e;}return 1},d);console.log(d,'built');
const h=await p.evaluate(()=>document.body.offsetHeight);console.log(d,'layout ok',h);}catch(e){console.log(d,'CRASH',e.message.slice(0,100))}await b.close();}})();
