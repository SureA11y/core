const { scan, errs, summary } = require('./h');
const n = process.argv[2];
const page = (p) => `<!doctype html><html lang="en"><head><title>Clobber test</title></head><body><main><h1>Form</h1>
<form id="f1" aria-label="Sign up" title="Sign up form"><input name="${p}${n}" type="text"><label for="ok">Ok</label><input id="ok"><button></button><img src="x.png"></form></main></body></html>`;
const a = scan(page('z')), b = scan(page(''));
const sa = summary(a.r), sb = b.r ? summary(b.r) : {};
const d = Object.keys(sa).filter(k => sa[k] !== sb[k]).map(k => k + ' ' + sa[k] + '->' + sb[k]);
console.log(n, b.err ? 'THROW ' + b.err.message : '', b.ms + 'ms', d.join('; '), errs(b.r).join(' ; ').slice(0, 300));
