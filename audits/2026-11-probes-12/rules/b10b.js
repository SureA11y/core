const {run4,setMsg}=require('./h.js');setMsg(160);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.2 sans-serif}</style></head><body><main>${b}</main></body></html>`;
const R=['text-spacing-content-loss'];
const J='日本語の長いテキストが入ります日本語の長いテキスト';
const cases=[
 ['plain-text','<p>Hello world</p>'],
 ['nav-nowrap',`<nav><a href=# style="display:inline-block;width:110px;white-space:nowrap;overflow:hidden">Products & services</a></nav>`],
 ['nav-nowrap-fits',`<nav><a href=# style="display:inline-block;width:150px;white-space:nowrap;overflow:hidden">Products & services</a></nav>`],
 ['vert-w60',`<div lang=ja style="writing-mode:vertical-rl;height:120px;width:60px;overflow:hidden">${J}</div>`],
 ['vert-w80',`<div lang=ja style="writing-mode:vertical-rl;height:120px;width:80px;overflow:hidden">${J}</div>`],
 ['vert-w200',`<div lang=ja style="writing-mode:vertical-rl;height:120px;width:200px;overflow:hidden">${J}</div>`],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b),base:'v117'})),{modes:['chrome']});
