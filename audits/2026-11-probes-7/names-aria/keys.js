const { launch, BUNDLE } = require('./harness');
(async()=>{const b=await launch(); const p=await b.newPage(); await p.setContent('<p>x</p>'); await p.addScriptTag({content:BUNDLE}); console.log(await p.evaluate(()=>Object.keys(window.a11ycore).join(' '))); await b.close();})();
