const {chromeRun}=require('./h.js');
(async()=>{for(const t of ['v117','now'])for(const b of [`<nav><a href=# style="display:inline-block;width:110px;white-space:nowrap;overflow:hidden">Products & services</a></nav>`,`<div lang=ja style="writing-mode:vertical-rl;height:120px;width:60px;overflow:hidden">日本語の長いテキストが入ります日本語の長いテキスト</div>`,`<div style="width:110px;white-space:nowrap;overflow:hidden">Products and services here</div><p>Other text</p>`]){
const r=await chromeRun(t,{full:true,rules:['text-spacing-content-loss'],html:`<!doctype html><html lang=en><body style="font:16px/1.2 sans-serif">${b}</body></html>`,setup:null});
console.log(t,r['text-spacing-content-loss'].slice(0,300));}
process.exit(0)})();
