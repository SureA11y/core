const {scan,page,close}=require('../../visual/h.js');
const sum=(o)=>o.map(r=>r.id+'='+r.outcome+(r.occ.length?'['+r.occ.map(x=>x.msg.slice(0,60)).join(';')+']':'')).join(' | ');
(async()=>{
 const C=['contrast-minimum'];
 const cases=[
  ['#777', `<p style="color:#777">t</p>`],
  ['#767676', `<p style="color:#767676">t</p>`],
  ['24px #949494 (3.03)', `<p style="font-size:24px;color:#949494">t</p>`],
  ['23.9px #949494', `<p style="font-size:23.9px;color:#949494">t</p>`],
  ['18.66px bold #949494', `<p style="font-size:18.67px;font-weight:700;color:#949494">t</p>`],
  ['18.5px bold #949494', `<p style="font-size:18.5px;font-weight:700;color:#949494">t</p>`],
  ['currentColor/var/light-dark', `<p style="--c:#ccc;color:var(--c)">t</p><p style="color-scheme:light;color:light-dark(#ddd,#000)">u</p>`],
  ['rgba alpha stack', `<div style="background:rgba(0,0,0,.5)"><p style="color:rgba(255,255,255,.3)">t</p></div>`],
  ['gradient bg', `<p style="background:linear-gradient(#000,#fff);color:#888">t</p>`],
  ['bg image', `<p style="background:url(data:image/gif;base64,R0lGODlhAQABAAAAACw=);color:#888">t</p>`],
  ['blend mode', `<p style="mix-blend-mode:difference;color:#888">t</p>`],
  ['filter', `<p style="filter:invert(1);color:#888">t</p>`],
  ['sr-only', `<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);color:#eee">t</span>`],
  ['visibility hidden', `<p style="visibility:hidden;color:#eee">t</p>`],
  ['opacity 0', `<p style="opacity:0;color:#eee">t</p>`],
  ['closed details', `<details><summary>S</summary><p style="color:#eee">t</p></details>`],
  ['disabled', `<button disabled style="color:#ddd">t</button>`],
 ];
 for (const [l,h] of cases) console.log(l.padEnd(28), sum(await scan(h,['contrast-minimum','contrast-computable'])));
 // target size spacing exception exact: two 10px targets, centres 24 apart vs 23.9
 for (const d of [24,23.9]) console.log('target centres',d, sum(await scan(`<button style="position:absolute;top:100px;left:100px;width:10px;height:10px;padding:0;border:0">a</button><button style="position:absolute;top:100px;left:${100+d}px;width:10px;height:10px;padding:0;border:0">b</button>`,['target-size-minimum'])));
 const p=await page('<p>x</p>'); const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{},['contrast-minimum'])); console.log('engine', JSON.stringify(r.engine)); await p.close();
 await close();
})();
