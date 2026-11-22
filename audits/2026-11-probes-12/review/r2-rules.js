const {run4,setMsg}=require('./rh.js');setMsg(150);
const W=(b,head='',title='t')=>`<!doctype html><html lang=en><head><title>${title}</title>${head}</head><body><main><h1>h</h1>${b}</main></body></html>`;
const TS=['target-size-minimum'];
const cases=[
 ['T1 unstyled text inputs stacked',TS,W('<form><input aria-label=a><br><input aria-label=b></form>')],
 ['T2 author height 20px inputs stacked (author-modified)',TS,W('<form><input aria-label=a style="height:20px;box-sizing:border-box"><br><input aria-label=b style="height:20px;box-sizing:border-box"></form>')],
 ['T3 WooCommerce qty input author width 3em',TS,W('<form class=cart><div class=quantity><input type=number class="input-text qty text" step=1 min=1 value=1 aria-label=Qty style="width:3.6em"></div><a href=#>x</a></form>')],
 ['T4 unstyled buttons tiny font (not exempt)',TS,W('<button style="font-size:9px">a</button><button style="font-size:9px">b</button>')],
 ['T5 zoom .5 on ancestor of checkboxes',TS,W('<div style="zoom:.5"><input type=checkbox aria-label=a><input type=checkbox aria-label=b></div>')],
 ['T6 select size=2147483648 (list box in Chromium)',TS,W('<select size=2147483648 aria-label=s style="height:20px"><option>a</option></select><select size=2147483648 aria-label=t style="height:20px"><option>a</option></select>')],
 ['T7 range defaults',TS,W('<input type=range aria-label=r><br><input type=range aria-label=s>')],
 ['T8 fixed bar with background over scrolling page link',TS,W('<header style="position:fixed;top:0;left:0;right:0;height:40px;background:#fff"><a href=#a style="display:inline-block;width:16px;height:16px">a</a></header><div style="height:60px"></div><p><a href=#b style="display:inline-block;width:16px;height:16px">b</a></p><div style="height:3000px"></div>')],
 ['T9 fixed bar transparent background',TS,W('<header style="position:fixed;top:0;left:0;right:0;height:40px"><a href=#a style="display:inline-block;width:16px;height:16px">a</a></header><div style="height:60px"></div><p><a href=#b style="display:inline-block;width:16px;height:16px">b</a></p><div style="height:3000px"></div>')],
 ['T10 fixed side button, page link far left horizontally, pinned top only',TS,W('<a href=#a style="position:fixed;top:100px;right:0;display:block;width:16px;height:16px">a</a><p style="margin:0"><a href=#b style="display:inline-block;width:16px;height:16px;margin-left:5px">b</a></p><div style="height:3000px"></div>')],
];
run4(cases.map(([n,r,h])=>({name:n,rules:r,html:h})),{modes:['chrome']});
