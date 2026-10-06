const { scan, errs } = require('./h');
const gens = {
  bodyImgsBigSibling: n => '<html lang="en"><head><title>t</title></head><body>Hello <main><h1>x</h1>' + '<p>Some paragraph text that is moderately long to make textContent heavy.</p>'.repeat(20000) + '</main>' + '<img src="a.png" alt="logo">'.repeat(n) + '</body></html>',
  flatNoAlt: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + '<img src="a.png">'.repeat(n) + '</main></body></html>',
  mixedNoAlt: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + '<img src="a.png"><span>s</span>'.repeat(n) + '</main></body></html>',
  gridNoAlt: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + ('<div>'+'<img src="a.png">'.repeat(50)+'</div>').repeat(n/50) + '</main></body></html>',
  headingsReal: n => '<html lang="en"><head><title>t</title></head><body><main>' + Array.from({length:n},(_, i)=>`<h${1+i%6}>Topic number ${i}</h${1+i%6}><p>text</p>`).join('') + '</main></body></html>',
  headingsOnly: n => '<html lang="en"><head><title>t</title></head><body><main>' + Array.from({length:n},(_, i)=>`<h2>Heading ${i}</h2>`).join('') + '</main></body></html>',
  spansPlaceholder: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<div><h2>Heading ${i}</h2></div>`).join('') + '</main></body></html>',
  wideDiv: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + '<div>t</div>'.repeat(n) + '</main></body></html>',
  wideLinks: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<a href="/p${i}">Link ${i%50}</a>`).join('') + '</main></body></html>',
  wideIds: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<span id="i${i}" aria-labelledby="i${(i+1)%n}">s</span>`).join('') + '</main></body></html>',
  dupIds: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<span id="dup">s</span>`).join('') + '</main></body></html>',
  inputs: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1><form>' + Array.from({length:n},(_, i)=>`<label for="f${i}">Name ${i}</label><input id="f${i}" name="n${i}">`).join('') + '</form></main></body></html>',
  radios: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1><form>' + Array.from({length:n},(_, i)=>`<input type="radio" name="r" aria-label="r${i}">`).join('') + '</form></main></body></html>',
  headings: n => '<html lang="en"><head><title>t</title></head><body><main>' + Array.from({length:n},(_, i)=>`<h${1+i%6}>Heading ${i}</h${1+i%6}><p>text</p>`).join('') + '</main></body></html>',
  imgs: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<img src="a${i}.png" alt="pic ${i}">`).join('') + '</main></body></html>',
  tables: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1><table><tr>' + Array.from({length:20},(_, i)=>`<th>h${i}</th>`).join('') + '</tr>' + Array.from({length:n/20},()=> '<tr>' + '<td>c</td>'.repeat(20) + '</tr>').join('') + '</table></main></body></html>',
  lists: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1><ul>' + '<li>i</li>'.repeat(n) + '</ul></main></body></html>',
  buttons: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<button>B ${i}</button>`).join('') + '</main></body></html>',
  landmarks: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<nav aria-label="n${i}"><a href="#">x</a></nav><section aria-label="s"><p>x</p></section>`).join('') + '</main></body></html>',
  styled: n => '<html lang="en"><head><title>t</title><style>' + Array.from({length:200},(_, i)=>`.c${i}{color:#${(i*1234567%0xffffff).toString(16).padStart(6,'0')}}`).join('') + '</style></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<p class="c${i%200}" style="background:#fff">p ${i}</p>`).join('') + '</main></body></html>',
  shadow: n => '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>' + Array.from({length:n},(_, i)=>`<div><template shadowrootmode="open"><button>b${i}</button><img src=x></template></div>`).join('') + '</main></body></html>',
};
const which = process.argv[2]; const Ns = (process.argv[3]||'1000,2000,4000').split(',').map(Number);
for (const N of Ns) {
  const html = gens[which](N);
  const r = scan(html, { engineOptions: { profileRules: true, perfStats: true }, inPage: process.argv[4]==='inpage', runOnly: process.env.RULE ? [process.env.RULE] : null });
  const t = r.r && r.r.perfStats && r.r.perfStats.ruleTimings;
  let top='';
  if (t) { const arr = Array.isArray(t) ? t : Object.entries(t).map(([k,v])=>({ruleId:k, ms: typeof v==='number'?v:(v.ms||v.totalMs||v.total)})); top = arr.sort((a,b)=>(b.ms||b.totalMs||0)-(a.ms||a.totalMs||0)).slice(0,5).map(x=>(x.ruleId||x.id)+'='+Math.round(x.ms||x.totalMs||0)).join(' '); }
  console.log(which, N, r.err ? 'THROW '+r.err.message : '', r.ms+'ms', errs(r.r).slice(0,3), top);
}
