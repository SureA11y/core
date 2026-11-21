const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const { leaningFailures } = require('/home/user/core-r10/src/index.js');
const frags = process.argv.slice(2);
const W = console.warn; console.warn = () => {};
for (const f of frags) { const r = runa11yCoreOnHtml(`<!doctype html><html lang="en"><head><title>p</title></head><body><main>${f.repeat(4)}</main></body></html>`, { entryPointParity:false }); console.warn=W;
 const by = {}; for (const l of leaningFailures(r)) by[l.ruleId+':'+l.reasonCode]=(by[l.ruleId+':'+l.reasonCode]||0)+1; console.log(f.slice(0,40), JSON.stringify(by)); console.warn=()=>{}; }
