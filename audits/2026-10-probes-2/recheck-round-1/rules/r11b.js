const {page,close}=require('../../visual/h.js');
const btn='display:inline-block;padding:0;border:0;margin:0;position:absolute;';
const nb=(l)=>`<button style="${btn}width:10px;height:10px;top:100px;left:${l}px">n</button>`;
const cases=[
 ['clipped to 10x10 (+neighbour)', `<div style="width:10px;height:10px;overflow:hidden;position:absolute;top:100px;left:100px"><button style="${btn}width:40px;height:40px;top:0;left:0">x</button></div>${nb(115)}`],
 ['2/3 covered (+neighbour)', `<div style="position:absolute;top:100px;left:100px"><button style="${btn}width:30px;height:30px;top:0;left:0">x</button><div style="position:absolute;top:0;left:0;width:20px;height:30px;background:red"></div></div>${nb(135)}`],
 ['rotated 20x20 (+neighbour)', `<button style="${btn}width:20px;height:20px;transform:rotate(45deg);top:100px;left:100px">x</button>${nb(130)}`],
 ['display contents (+neighbour)', `<div style="position:absolute;top:100px;left:100px"><a href="#" style="display:contents"><span style="display:inline-block;width:10px;height:10px;background:#000"></span></a></div>${nb(112)}`],
 ['23.98 (+neighbour)', `<button style="${btn}width:23.98px;height:30px;top:100px;left:100px">x</button>${nb(126)}`],
 ['23.98 alone (margin)', `<button style="${btn}width:23.98px;height:30px;top:100px;left:100px">x</button>`],
];
(async()=>{for(const [l,h] of cases){const p=await page(h);const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{},['target-size-minimum']));const c=r.checksResults[0].ruleId==='target-size-minimum'?r.checksResults[0]:r.checksResults.find(x=>x.ruleId==='target-size-minimum');
console.log('==',l,c.outcome,JSON.stringify(c.margin&&{v:c.margin.value,sel:c.margin.selector}));for(const o of c.occurrences||[])console.log('   ',o.selector,'::',o.summary, JSON.stringify(o.data&&o.data.details&&o.data.details.measured));await p.close();}await close();})();
