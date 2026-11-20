const {run}=require('./jsd');
const big='x'.repeat(200000);
const cases=[
 ['img-alt-quality', `<img src=a.png alt="${big}.png">`],
 ['img-alt-quality', `<img src=a.png alt="image ${'\u{1F600}'.repeat(3)}">`],
 ['link-name-quality', `<a href=/a>click here${' '.repeat(5000)}</a>`],
 ['dialog-name-present', `<div role=dialog><h2>${big}</h2></div>`],
 ['form-control-programmatic-label-present', `<label for=q style="display:none">${big}</label><input id=q>`],
 ['button-name-present', `<button><span style="visibility:hidden">${big}</span></button>`],
 ['heading-order', `<h1>a</h1><h3>${big}</h3>`],
 ['form-control-label-quality', `<label>${big} <input type=checkbox></label><label>${big} <input type=checkbox></label>`],
 ['identical-links-same-purpose', `<a href="/${big}">Read more</a><a href=/b>Read more</a>`],
 ['label-in-name', `<button aria-label="${big}">Send</button>`],
 ['aria-valid-attr-value', `<div aria-live="${big}">x</div>`],
 ['image-redundant-alt', `<a href=/x><img src=a.png alt="${big}">${big}</a>`],
];
(async()=>{ for (const [rule,h] of cases){ const r=await run(`<main>${h}</main>`,[rule]); const c=r.checksResults[0]; const o=(c.occurrences||[])[0]||{}; console.log(rule, c.outcome, 'summary', (o.summary||'').length, 'hint', (o.hint||'').length, 'json', JSON.stringify(c).length, '|', (o.summary||'').slice(0,90).replace(/x{20,}/g,m=>`x*${m.length}`)); } })();
