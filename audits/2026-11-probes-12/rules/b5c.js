const {run4,setMsg}=require('./h.js');setMsg(300);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.5 sans-serif}</style></head><body><main>${b}</main></body></html>`;
const T='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const cases=[24,30,40,47,48,49,60,72].map(h=>[`h${h}`,`<div style="overflow:hidden;height:${h}px;width:200px">${T}</div>`]);
cases.push(['nowrap-whole-words-hidden',`<div style="overflow:hidden;width:100px;white-space:nowrap">Short <span style="display:inline-block;margin-left:200px">Hidden</span></div>`]);
cases.push(['two-text-nodes',`<div style="overflow:hidden;height:24px;width:300px">First line<br>Second line that is wholly hidden</div>`]);
run4(cases.map(([n,b])=>({name:n,rules:['resize-text-content-loss','text-spacing-content-loss'],html:W(b),viewport:{width:640,height:800},base:'none'})),{modes:['chrome']});
