'use strict';
// Pure jsdom, no engine: getComputedStyle(button).textShadow depends on what was read before.
const {JSDOM}=require('/home/user/core-r8/node_modules/jsdom');
const html=`<!DOCTYPE html><html><body><main><label style="text-shadow:0 0 2px #000">then<button>x</button></label></main></body></html>`;
let d=new JSDOM(html);let w=d.window;const b=()=>w.document.querySelector('button');
console.log('button first:',JSON.stringify(w.getComputedStyle(b()).textShadow));
d=new JSDOM(html);w=d.window;w.getComputedStyle(w.document.querySelector('label')).textShadow;
console.log('label read first, then button:',JSON.stringify(w.getComputedStyle(b()).textShadow));
d=new JSDOM(html);w=d.window;const x=w.getComputedStyle(b()).textShadow;const y=w.getComputedStyle(b()).textShadow;
console.log('button twice:',JSON.stringify([x,y]));
d=new JSDOM(html);w=d.window;w.getComputedStyle(b()).getPropertyValue('color');
console.log('button color first then textShadow:',JSON.stringify(w.getComputedStyle(b()).textShadow));
console.log('jsdom version',require('/home/user/core-r8/node_modules/jsdom/package.json').version);
