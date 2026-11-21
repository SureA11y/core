const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const r=runa11yCoreOnHtml('<!doctype html><html lang=en><head><title>t</title></head><body><header>h</header><main>x</main><footer>f</footer><img src="p.gif" width=1 height=1 alt="" border=0></body></html>',{runOnly:['region'],entryPointParity:false}).checksResults[0];
console.log(r.outcome, JSON.stringify(r.occurrences.map(o=>({s:o.selector,lean:o.lean&&o.lean.toward,d:o.data.details}))));
