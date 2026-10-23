const {scan,tryit,core}=require('./h');const {renderHtmlReport}=require('/home/user/core/src/report.js');const E=require('/home/user/core/src/earl.js');
const r=scan('<html lang=en><title>t</title><body><img src=a>',null,{timestamp:'2020-01-02T03:04:05Z'});
const a=renderHtmlReport(r);
setTimeout(()=>{const b=renderHtmlReport(r);console.log('with ts deterministic:',a===b);
const r2=scan('<html lang=en><title>t</title><body><img src=a>');const c=renderHtmlReport(r2);setTimeout(()=>{console.log('no ts deterministic:',c===renderHtmlReport(r2), (c.match(/<title>[^<]*/)||[])[0]);},1100);},1100);
// O-12 size
const empty=scan('<html lang=en><title>t</title><body>');const s=JSON.stringify(empty);console.log('empty page size KB',(s.length/1024).toFixed(0),'checks KB',(JSON.stringify(empty.checksResults).length/1024).toFixed(0),'rollups KB',(JSON.stringify(empty.rulesResults).length/1024).toFixed(0));
let big='<html lang=en><title>t</title><body>';for(let i=0;i<1250;i++)big+='<div><p>para '+i+'</p><a href=#>l</a><img src=x></div>';
const bg=scan(big);console.log('5k-element size MB',(JSON.stringify(bg).length/1048576).toFixed(2));
tryit('output.compact',()=>JSON.stringify(scan('<html lang=en><title>t</title><body>',null,{output:{compact:true}})).length);
// O-15 EARL subjects
const u1=scan('<html lang=en><title>t</title><body><img src=a>');u1.url=undefined;const u2=JSON.parse(JSON.stringify(u1));
const e=E.renderEarlReport([u1,u2]);console.log('earl subjects',e['@graph'].length,e['@graph'].map(g=>g.source||g['@id']));
