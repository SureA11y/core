// Hostile markup across every rule: look for rule errors
const { jrun } = require('./jsd');
const pieces = [
 `<div role="tablist" aria-owns="t1 t1 self" id="self"><div id="t1" role="tab" aria-owns="self">x</div></div>`,
 `<button aria-labelledby="a" id="a"></button><span id="b" aria-labelledby="b c"><span id="c" aria-labelledby="b">x</span></span>`,
 `<div role="list" aria-owns="l1"><div id="l1" role="listitem" aria-owns="l2"><div id="l2" role="list" aria-owns="l1"></div></div></div>`,
 `<table><tr><td headers="h h h h" id="h">x</td></tr></table><table><tr><th rowspan="0" colspan="1000">x</th></tr><tr><td colspan="65535">y</td></tr></table>`,
 `<label for="x"><label for="x">nested</label></label><input id="x"><label for="">e</label>`,
 `<select><option><option></select><select size="-1"><optgroup></select><datalist id="d"><option value="a"></datalist><input list="d" role="combobox">`,
 `<svg><a href="#"><text>t</text></a><foreignObject><button></button></foreignObject><title></title></svg>`,
 `<math><mi>x</mi><mtext><button>in math</button></mtext></math>`,
 `<div role="${'button '.repeat(500)}">x</div><div aria-label="${'x'.repeat(100000)}" role="img"></div>`,
 `<h1 aria-level="-1">a</h1><div role="heading" aria-level="NaN">b</div><div role="heading" aria-level="1e3">c</div>`,
 `<input type="radio" name="__proto__"><input type="checkbox" id="constructor"><label for="constructor">c</label><div id="toString" role="region" aria-labelledby="hasOwnProperty"></div><span id="hasOwnProperty">h</span>`,
 `<dialog open><dialog open><form method="dialog"><button></button></form></dialog></dialog>`,
 `<details open><summary><details><summary>inner</summary></details></summary></details>`,
 `<ul><li><ul><li><ul>${'<li><ul>'.repeat(300)}</ul></li></ul></li></ul>`,
 `<template shadowrootmode="open"><button></button><slot></slot></template>`,
 `<div id="host"></div><script>document.getElementById('host').attachShadow({mode:'closed'}).innerHTML='<button></button>'</script>`,
 `<a href="#" aria-describedby="${Array.from({length:2000},(_, i)=>'d'+i).join(' ')}">x</a>`,
 `<area href="#"><map><area></map><img usemap="#">`,
 `<fieldset><legend><legend>x</legend></legend></fieldset><output for="__proto__"></output>`,
 `<input aria-errormessage="" aria-invalid="true"><input aria-activedescendant="nope" role="combobox" aria-expanded="maybe">`,
];
(async()=>{ const t0=Date.now(); const res = await jrun(pieces.join('\n'));
 for (const r of res) if (r.error) console.log('ERR', r.ruleId, r.error.slice(0,300));
 console.log('rules', res.length, 'ms', Date.now()-t0);
 for (const [i,p] of pieces.entries()) { const rr = await jrun(p); const e = rr.filter(r=>r.error); if (e.length) console.log('piece', i, e.map(x=>x.ruleId+': '+x.error.slice(0,200)).join(' ; ')); }
})().catch(e=>console.log('CRASH', e.stack));
