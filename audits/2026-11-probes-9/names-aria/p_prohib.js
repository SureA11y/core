const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const html='<!doctype html><html lang=en><head><title>t</title></head><body><p id=c aria-label="intro">x</p><code id=d aria-label="c">x</code><strong id=s aria-label="s">x</strong><time id=t aria-label="t">x</time><p id=e aria-label="e"></p></body></html>';
const r=runa11yCoreOnHtml(html,{runOnly:['aria-prohibited-attr'],entryPointParity:false}).checksResults[0];
for(const o of r.occurrences) console.log(o.selector, o.data.details.reasonCode, 'role=',o.data.details.role, '|', o.summary);
