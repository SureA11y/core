const root = process.argv[2], hint = process.argv[3] === 'hint';
const { runa11yCoreOnHtml } = require(root + '/src/testing.js');
const depth = 400; let inner = 'x';
for (let i = 0; i < depth; i++) inner = `<span>${inner} t${i}</span>`;
let body = ''; for (let i = 0; i < 5; i++) body += `<div>${inner}</div>`;
const html = `<!doctype html><html lang="en"><head><title>Perf</title></head><body${hint?' text="#333"':''}><main>${body}</main></body></html>`;
const t0 = process.hrtime.bigint(); runa11yCoreOnHtml(html, { entryPointParity: false, runOnly: ['contrast-minimum','link-in-text-block','scrollable-region-focusable'] });
console.log(root.split('/').pop(), hint?'hint':'nohint', (Number(process.hrtime.bigint()-t0)/1e6).toFixed(0),'ms');
