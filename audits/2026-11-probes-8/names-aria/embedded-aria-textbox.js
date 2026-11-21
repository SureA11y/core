// accname 2C: an ARIA textbox or div combobox reached through aria-labelledby gives its value (content), not its aria-label
const { diff } = require('./diff-names');
const { launch } = require('./harness');
(async()=>{ const b=await launch(); for (const [id,body] of [
 ['lb-textbox', `<div id="r" role="textbox" aria-label="X">typed</div><button data-t=a aria-labelledby="r"></button>`],
 ['lb-div-combobox', `<div id="c" role="combobox" aria-label="Y" aria-expanded="false" tabindex="0">Apple</div><button data-t=b aria-labelledby="c"></button>`],
 ['lb-span-with-textbox', `<span id="lx">Pay <span role="textbox" aria-label="q">10</span> now</span><input data-t=c aria-labelledby="lx">`],
]) console.log(await diff(b,id,body)); await b.close(); })();
