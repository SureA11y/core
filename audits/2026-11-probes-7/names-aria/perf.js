const { launch, NAME_RULES, BUNDLE } = require('./harness');
const N=+process.argv[2]||3000;
function page(kind){
 let b='';
 if(kind==='links') for(let i=0;i<N;i++) b+=`<li><a href="/p${i}"><img src=a.png alt=""><span>Read more</span><span class=x> about item ${i}</span></a></li>`;
 if(kind==='lb') { b+='<div id=shared>'+'word '.repeat(200)+'</div>'; for(let i=0;i<N;i++) b+=`<span id=l${i}>Label ${i} <span aria-labelledby="l${(i+1)%N}">x</span></span><input aria-labelledby="l${i} shared">`; }
 if(kind==='table') { b+='<table>'; for(let r=0;r<Math.round(N/10);r++){ b+='<tr>'; for(let c=0;c<10;c++) b+=`<td>${r}-${c}</td>`; b+='</tr>'; } b+='</table>'; for(let t=0;t<N/10;t++) b+='<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>'; }
 if(kind==='headings') for(let i=0;i<N;i++) b+=`<h${1+(i%6)}>H ${i}</h${1+(i%6)}><p>t</p><div role=heading aria-level=${1+(i%9)}>d</div>`;
 if(kind==='zones') for(let i=0;i<N;i++) b+=`<div class="nav card"><a href=/a>a</a><a href=/b>b</a><form><input type=search name=q aria-label=q></form></div>`;
 if(kind==='deep') { b+='<div>'.repeat(N/3)+'<button>Go</button><a href=/x><span>Read</span> more</a>'+'</div>'.repeat(N/3); }
 return `<!doctype html><html lang=en><head><title>t</title></head><body><main><ul>${b}</ul></main></body></html>`;
}
const RULES=NAME_RULES.concat(['td-has-header','heading-order','page-has-heading-one','page-zones-landmark','link-name-quality','link-name-quality-link-only','identical-links-same-purpose','img-alt-quality','form-control-label-quality','region','table-th-has-data-cells']);
(async()=>{ const b=await launch();
 for (const kind of ['links','lb','table','headings','zones','deep']) {
  const p=await b.newPage(); await p.setContent(page(kind)); await p.addScriptTag({content:BUNDLE});
  const times=[];
  for (const r of RULES) { const t=await p.evaluate(async(r)=>{const t0=performance.now(); const res=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:[r]}},null); return [performance.now()-t0, res.checksResults[0]&&res.checksResults[0].outcome, res.checksResults[0]&&(res.checksResults[0].occurrences||[]).length];}, r); times.push([r,...t]); }
  times.sort((a,b)=>b[1]-a[1]);
  console.log('==',kind,'N='+N, times.slice(0,6).map(t=>`${t[0]} ${t[1].toFixed(0)}ms ${t[2]} occ=${t[3]}`).join(' | '));
  await p.close(); }
 await b.close(); })();
