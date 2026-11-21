'use strict';
// Pure jsdom: which computed properties give a different value on the first read than on the second, per element type.
const {JSDOM}=require('/home/user/core-r8/node_modules/jsdom');
const props=['color','background-color','text-shadow','font-size','font-weight','font-family','letter-spacing','word-spacing','line-height','visibility','opacity','text-decoration-line','outline-style','cursor','direction','white-space','text-transform','font-style','text-indent','text-align','display','-webkit-text-fill-color','text-decoration-color','caret-color','pointer-events'];
const st='color:#123456;text-shadow:0 0 2px #000;font-size:20px;font-weight:700;letter-spacing:2px;word-spacing:3px;line-height:30px;font-family:serif;cursor:pointer;direction:rtl;white-space:pre;text-transform:uppercase;font-style:italic;text-indent:5px;text-align:right;visibility:hidden;-webkit-text-fill-color:red;caret-color:blue';
const out={};
for(const tag of ['button','input','select','textarea','span','a','option','legend','summary']){
 for(const p of props){
  const d=new JSDOM(`<!DOCTYPE html><html><body><div style="${st}"><${tag}>x</${tag}></div></body></html>`);const w=d.window;const e=w.document.querySelector('div > *');
  const a=w.getComputedStyle(e).getPropertyValue(p);const b=w.getComputedStyle(e).getPropertyValue(p);
  if(a!==b)(out[tag]=out[tag]||[]).push(`${p}: ${JSON.stringify(a)} then ${JSON.stringify(b)}`);
 }}
console.log(JSON.stringify(out,null,1));
