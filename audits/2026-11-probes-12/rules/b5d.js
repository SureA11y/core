const {run4,setMsg}=require('./h.js');setMsg(120);
const T='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.';
const B=`<div style="overflow:hidden;height:30px;width:200px">${T}</div>`;
const cases=[
 ['w641-std',`<!doctype html><html lang=en><body>${B}</body></html>`,{width:641,height:800}],
 ['w640-scrollbar',`<!doctype html><html lang=en><body style="height:3000px">${B}</body></html>`,{width:655,height:800}],
 ['w320',`<!doctype html><html lang=en><body>${B}</body></html>`,{width:320,height:800}],
 ['quirks-640',`<html lang=en><body>${B}</body></html>`,{width:640,height:800}],
 ['root-wider-than-vp',`<!doctype html><html lang=en style="min-width:1000px"><body>${B}</body></html>`,{width:640,height:800}],
 ['meta-viewport',`<!doctype html><html lang=en><head><meta name=viewport content="width=device-width"></head><body>${B}</body></html>`,{width:640,height:800}],
];
run4(cases.map(([n,h,v])=>({name:n,rules:['resize-text-content-loss','reflow-horizontal-scroll'],html:h,viewport:v,base:'v117'})),{modes:['chrome']});
