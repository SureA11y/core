const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const { matchBaseline, buildBaselineEntries } = require('/home/user/core-r10/src/baseline.js');
let seed = +process.argv[2] || 1; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd()*a.length)];
const frags = ['<img src="x.png">','<img src="y.png" alt="">','<img src="z.png" alt="photo of a cat">','<a href="/a"></a>','<a href="/b">click here</a>','<button></button>','<button>Go</button>',
 '<input type="text">','<label>Name <input></label>','<input type="email" autocomplete="nope">','<p style="color:#aaa;background:#fff">low</p>','<p><b>Opening hours</b></p><p>Mon 9-5</p>',
 '<div role="button">x</div>','<span tabindex="3">t</span>','<table><tr><td>a</td><td>1</td></tr><tr><td>b</td><td>2</td></tr></table>','<h3>skip</h3>','<div id="d1">dup</div><div id="d1">dup</div>',
 '<select><option>a</option></select>','<video src="v.mp4" controls></video>','<p lang="xx-">bad</p>','<iframe src="about:blank"></iframe>','<ul><div>bad</div></ul>','<a href="#" role="img"></a>'];
function page() { let b=''; const n = 5 + Math.floor(rnd()*120); for (let i=0;i<n;i++) b += pick(frags); return `<!doctype html><html lang="en"><head><title>p</title></head><body><main>${b}</main></body></html>`; }
const strip = (r) => JSON.stringify({ c: r.checksResults.map(c => [c.ruleId, c.outcome, c.severity, c.margin && c.margin.value]), rr: r.rulesResults.map(x => [x.ruleId, x.outcome, JSON.stringify(x.profiles||null)]), p: JSON.stringify(r.profiles), v: r.checksResults.map(c=>JSON.stringify(c.verdicts||null)) });
const total = r => r.checksResults.reduce((a,c)=>a+(c.occurrences||[]).length+(c.occurrencesOmitted||0),0);
const quiet = console.warn; 
let bad = 0;
for (let k=0;k<+(process.argv[3]||10);k++) {
  const html = page(); const cap = 1 + Math.floor(rnd()*3);
  console.warn = () => {};
  const a = runa11yCoreOnHtml(html, { entryPointParity:false, engineOptions:{profile:['wcag21-aa','wcag22-aaa']} });
  const b = runa11yCoreOnHtml(html, { entryPointParity:false, engineOptions:{ profile:['wcag21-aa','wcag22-aaa'], output:{ maxOccurrencesPerRule: cap } } });
  const c = runa11yCoreOnHtml(html, { entryPointParity:false, engineOptions:{ profile:['wcag21-aa','wcag22-aaa'], output:{ maxOccurrencesPerRule: cap, detail:'findings' } } });
  const d = runa11yCoreOnHtml(html, { entryPointParity:false, engineOptions:{ profile:['wcag21-aa','wcag22-aaa'], output:{ detail:'findings' } } });
  console.warn = quiet;
  const msgs = [];
  if (strip(a)!==strip(b)) msgs.push('outcomes/rollups differ capped');
  if (total(a)!==total(b)) msgs.push(`total ${total(a)} vs ${total(b)}`);
  const ea = buildBaselineEntries(a);
  const ma = matchBaseline(a, ea), mb = matchBaseline(b, ea), mc = matchBaseline(c, ea), md = matchBaseline(d, ea);
  if (mb.totalFail !== ma.totalFail) msgs.push(`totalFail ${ma.totalFail} vs capped ${mb.totalFail}`);
  if (mc.totalFail !== ma.totalFail) msgs.push(`totalFail ${ma.totalFail} vs capped compact ${mc.totalFail}`);
  if (md.totalFail !== ma.totalFail) msgs.push(`totalFail ${ma.totalFail} vs compact ${md.totalFail}`);
  const la = matchBaseline(a, ea, {leanFail:true}).leanFail, lb = matchBaseline(b, ea, {leanFail:true}).leanFail;
  if (la.total !== lb.total || la.newCount !== lb.newCount) msgs.push(`leanFail ${JSON.stringify([la.total,la.newCount])} vs capped ${JSON.stringify([lb.total,lb.newCount])}`);
  // order: failures first
  for (const ch of b.checksResults) { const occ = ch.occurrences||[]; const fo = occ.map(o=>o.outcome||ch.outcome); const fi = fo.lastIndexOf('fail'), firstNon = fo.findIndex(x=>x!=='fail'); if (fi>=0 && firstNon>=0 && firstNon<fi) msgs.push('order '+ch.ruleId); if (ch.outcome==='fail' && !fo.includes('fail')) msgs.push('fail rule shows no failure '+ch.ruleId); }
  if (msgs.length) { bad++; console.log('seed', seed, 'cap', cap, msgs.slice(0,6)); }
}
console.log('done bad', bad);
