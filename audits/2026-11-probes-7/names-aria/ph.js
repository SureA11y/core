const { launch, runCase, summarize } = require('./harness');
const R=['form-control-programmatic-label-present','textbox-name-present','button-name-present','form-control-programmatic-label-quality','label-title-only','control-name-title-only','input-image-alt-present'];
const cases=[
 {id:'input-ph', html:`<input data-t=a placeholder="Search">`},
 {id:'textarea-ph', html:`<textarea data-t=b placeholder="Message"></textarea>`},
 {id:'input-title', html:`<input data-t=c title="Search">`},
 {id:'textarea-title', html:`<textarea data-t=d title="Message"></textarea>`},
 {id:'submit-empty-value', html:`<form><input type=submit value="" data-t=e></form>`},
 {id:'reset-empty-value', html:`<form><input type=reset value="" data-t=f></form>`},
 {id:'input-image-value', html:`<input type=image src=go.png value=Go data-t=g>`},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
