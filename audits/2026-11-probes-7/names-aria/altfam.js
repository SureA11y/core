const {run}=require('./jsd');
const big='x'.repeat(100000);
const cases=[
 ['input-image-alt-quality', `<input type=image src=a.png alt="${big}.png">`],
 ['input-image-alt-quality', `<input type=image src=a.png alt="button">`],
 ['area-alt-quality', `<img src=m.png usemap=#m alt=Map><map name=m><area href=/x alt="${big}.gif" shape=rect coords="0,0,5,5"></map>`],
 ['area-alt-quality', `<img src=m.png usemap=#m alt=Map><map name=m><area href=/x alt="click here" shape=rect coords="0,0,5,5"></map>`],
 ['svg-text-alternative-quality', `<svg role=img aria-label="${big}.svg"></svg>`],
 ['svg-text-alternative-quality', `<svg role=img><title>image</title></svg>`],
 ['object-text-alternative-quality', `<object data=a.pdf type=application/pdf aria-label="${big}.pdf"></object>`],
 ['embed-text-alternative-quality', `<embed src=a.swf title="${big}.swf">`],
 ['canvas-text-alternative-quality', `<canvas aria-label="${big}.png"></canvas>`],
 ['image-of-text', `<img src=a.png alt="${big}">`],
 ['img-alt-decorative', `<img src=a.png alt="spacer.gif">`],
 ['form-control-programmatic-label-quality', `<input aria-label="${big}">`],
 ['label-title-only', `<input title="${big}">`],
 ['control-name-title-only', `<button title="${big}"></button>`],
 ['heading-quality', `<h2>${big}</h2>`],
 ['table-duplicate-name', `<table summary="${big}"><caption>${big}</caption><tr><th>a</th></tr><tr><td>1</td></tr></table>`],
 ['link-name-quality', `<a href=/a>${big}</a>`],
];
(async()=>{ for (const [rule,h] of cases){ const r=await run(`<main>${h}</main>`,[rule]); const c=r.checksResults[0]; const o=(c.occurrences||[])[0]||{}; console.log(rule, c.outcome, 'sum', (o.summary||'').length, 'json', JSON.stringify(c).length, '|', (o.summary||'').slice(0,110).replace(/x{20,}/g,m=>`x*${m.length}`)); } })();
