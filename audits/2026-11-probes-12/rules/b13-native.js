const {run4,setMsg}=require('./h.js');setMsg(130);
const W=(b,cs='')=>`<!doctype html><html lang=en><head><title>t</title>${cs}</head><body><main>${b}</main></body></html>`;
const R=['target-size-minimum','target-size-enhanced'];
const cases=[
 ['cb-default','<input type=checkbox aria-label=a><input type=checkbox aria-label=b>'],
 ['cb-w10','<input type=checkbox aria-label=a style="width:10px;height:10px;margin:0"><input type=checkbox aria-label=b style="width:10px;height:10px;margin:0">'],
 ['cb-margin0-only','<input type=checkbox aria-label=a style="margin:0"><input type=checkbox aria-label=b style="margin:0">'],
 ['cb-zoom','<input type=checkbox aria-label=a style="zoom:0.7;margin:0"><input type=checkbox aria-label=b style="zoom:0.7;margin:0">'],
 ['cb-scale','<input type=checkbox aria-label=a style="transform:scale(.7);margin:0"><input type=checkbox aria-label=b style="transform:scale(.7);margin:0">'],
 ['cb-dark','<input type=checkbox aria-label=a style="margin:0"><input type=checkbox aria-label=b style="margin:0">','<meta name=color-scheme content=dark>'],
 ['cb-accent','<input type=checkbox aria-label=a style="margin:0;accent-color:red"><input type=checkbox aria-label=b style="margin:0;accent-color:red">'],
 ['radio-fontsize','<span style="font-size:8px"><input type=radio name=r aria-label=a style="margin:0"><input type=radio name=r aria-label=b style="margin:0"></span>'],
 ['range-default','<input type=range aria-label=a><br><input type=range aria-label=b>'],
 ['range-styled-h','<input type=range aria-label=a style="height:8px"><input type=range aria-label=b style="height:8px">'],
 ['select-default','<select aria-label=a><option>x</option></select><select aria-label=b><option>y</option></select>'],
];
run4(cases.map(([n,b,cs])=>({name:n,rules:R,html:W(b,cs)})),{modes:['chrome']});
