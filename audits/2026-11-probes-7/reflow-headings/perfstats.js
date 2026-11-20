const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const gen = { cards: (n)=>Array.from({length:n/4},(_,i)=>`<div class=c><div><b>Title ${i}</b></div><div>${L}</div><p>x</p></div>`).join(''),
  plain: (n)=>Array.from({length:n/4},(_,i)=>`<div class=c><div>Title ${i}</div><div>${L}</div><p>x</p></div>`).join(''),
  lead: (n)=>Array.from({length:n/3},(_,i)=>`<p><b>Title ${i}</b><br>${L}</p>`).join(''),
  deep: (n)=>'<div>'.repeat(n) + '<b>Deep title</b>' + '</div>'.repeat(n) + `<p>${L}</p>`,
};
(async()=>{
 for (const spec of process.argv.slice(2)) { const [kind, n, rule='p-as-heading'] = spec.split(':');
  const html = '<!doctype html><html><body>'+gen[kind](Number(n))+'</body></html>';
  const t=Date.now(); const r = await runa11yCoreOnHtml(html, { rules: { include: rule }, entryPointParity:false }); const c=r.checksResults[0];
  console.log(kind, n, rule, Date.now()-t, 'ms', c.outcome, c.occurrences.length); await new Promise(r=>setImmediate(r)); }
})();
