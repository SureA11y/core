// Text sitting directly in <body> (or in a roleless div) outside every landmark
const { jrun, jsum } = require('./jsd');
const P = (b)=>`<!doctype html><html lang="en"><head><title>LM</title></head><body>${b}</body></html>`;
(async()=>{ for (const [id,b] of [
 ['body-text', `This is an important notice about your account that sits outside every landmark.<main><h1>T</h1></main>`],
 ['div-text', `<div>This is an important notice about your account that sits outside every landmark.</div><main><h1>T</h1></main>`],
 ['div-text-and-span', `<div>Notice: <span>your account</span> is locked.</div><main><h1>T</h1></main>`],
 ['body-link', `<a href="/terms">Terms</a><main><h1>T</h1></main>`],
]) console.log(jsum(id, await jrun(P(b), ['region']))); })();
