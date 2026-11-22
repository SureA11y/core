const {run4,setMsg}=require('./h.js');setMsg(160);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.5 sans-serif} .s{display:inline-block;width:16px;height:16px;padding:0;border:0;margin:0}</style></head><body><main>${b}</main></body></html>`;
const R=['target-size-minimum','target-size-enhanced'];
const card=`<div style="position:relative;width:300px;height:100px;border:1px solid"><a href=#p style="position:absolute;inset:0" aria-label="Product">.</a><button class=s style="position:relative;z-index:2;margin:40px 0 0 10px">a</button></div>`;
const cover=`<div style="position:relative"><button class=s>a</button><button class=s style="margin-left:10px">b</button><div style="position:absolute;inset:0;background:#fff"></div></div>`;
const cases=[
 ['card-top',card],
 ['card-below',`<div style="height:2000px"></div>`+card],
 ['cover-top',cover],
 ['cover-below',`<div style="height:2000px"></div>`+cover],
 ['scroll-box-below',`<div style="height:120px;overflow:auto"><div style="height:500px"></div><button class=s>a</button><button class=s>b</button></div>`],
 ['label-wrapped-hidden-cb',`<label style="display:inline-block;padding:4px"><input type=checkbox style="appearance:none;width:12px;height:12px;border:1px solid;margin:0"> Accept terms</label> <label><input type=checkbox style="appearance:none;width:12px;height:12px;border:1px solid;margin:0"> News</label>`],
 ['native-cb-pair','<input type=checkbox aria-label=a><input type=checkbox aria-label=b>'],
 ['native-radio-resized','<input type=radio name=r aria-label=a style="width:12px;height:12px;margin:0"><input type=radio name=r aria-label=b style="width:12px;height:12px;margin:0">'],
 ['native-range','<input type=range aria-label=v>'],
 ['native-color','<input type=color aria-label=c><input type=color aria-label=d>'],
 ['native-date','<input type=date aria-label=d style="font-size:10px">'],
 ['native-file','<input type=file aria-label=f>'],
 ['native-search-small','<input type=search aria-label=s style="height:14px;font-size:10px"><button style="height:14px;font-size:10px">Go</button>'],
 ['summary','<details><summary style="font-size:10px;line-height:12px">More</summary>x</details><details><summary style="font-size:10px;line-height:12px">More2</summary>y</details>'],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b)})),{modes:['chrome']});
