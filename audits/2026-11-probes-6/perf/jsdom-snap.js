const v8 = require('v8');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Hi</h1><p>x</p></main></body></html>';
for (let i = 0; i < 3; i++) runa11yCoreOnHtml(html, {});
global.gc(); global.gc();
console.log(v8.writeHeapSnapshot(__dirname + '/s.heapsnapshot'));
