const { launch, BUNDLE } = require('./harness');
(async()=>{const b=await launch(); const p=await b.newPage(); await p.setContent('<main><button id=a>Save</button><header>h</header><a href=/x>L</a><h2>Hi</h2></main>'); await p.addScriptTag({content:BUNDLE});
for (const k of ['names','landmarks','headings']) console.log(k, JSON.stringify(await p.evaluate(async(k)=>{ console.table=()=>{}; return await window.a11ycore.inspect(k,{draw:false});},k)));
await b.close();})();
