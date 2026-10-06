const { scan, errs } = require('./h');
const r = scan('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Hi</h1><img src=x></main></body></html>');
console.log(r.err, r.ms, Object.keys(r.r), r.r.checksResults.length, errs(r.r));
console.log(JSON.stringify(r.r.checksResults.find(c=>c.outcome==='fail')).slice(0,800));
