const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const gens = {
  flatFits: (n) => Array.from({length:n},(_,i)=>`<p>Item ${i}</p>`).join(''),
  flatWide: (n) => Array.from({length:n},(_,i)=>`<div style="width:400px">Item ${i}</div>`).join(''),
  clippedMany: (n) => `<div style="overflow:hidden">` + Array.from({length:n},(_,i)=>`<div style="width:400px">Item ${i} <input></div>`).join('') + `</div>`,
  scrollMany: (n) => `<div style="overflow-x:auto">` + Array.from({length:n},(_,i)=>`<div style="width:400px">Item ${i} <input></div>`).join('') + `</div>`,
  hiddenDeepClipped: (n) => `<div style="overflow:hidden"><div style="visibility:hidden">` + '<div style="width:400px">'.repeat(Math.min(n,500)) + 'x' + '</div>'.repeat(Math.min(n,500)) + `</div></div>` + Array.from({length:Math.max(0,n-500)},()=>'<p>y</p>').join(''),
  hiddenFlatClipped: (n) => `<div style="overflow:hidden"><div style="visibility:hidden">` + Array.from({length:n},()=>'<div style="width:400px"><span>x</span><span>y</span></div>').join('') + `</div></div>`,
  deep: (n) => '<div>'.repeat(Math.min(n,500)) + '<span style="white-space:nowrap">aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</span>' + '</div>'.repeat(Math.min(n,500)),
  wideTableBig: (n) => '<table>' + Array.from({length:n/10},()=>'<tr>'+'<td>cell content</td>'.repeat(9)+'</tr>').join('') + '</table>',
  textNodes: (n) => '<div style="white-space:nowrap">' + Array.from({length:n},(_,i)=>`<span>w${i}</span> `).join('') + '</div>',
  shadowMany: (n) => `<div id=root></div><script>const r=document.getElementById('root');for(let i=0;i<${n/10};i++){const d=document.createElement('div');r.appendChild(d);const s=d.attachShadow({mode:'open'});s.innerHTML='<div style="width:400px"><slot></slot>'+'<span>x</span>'.repeat(8)+'</div>';}</script>`,
};
(async () => {
  const which = process.argv[2]; const sizes = (process.argv[3]||'1000,5000,20000').split(',').map(Number);
  for (const [name, g] of Object.entries(gens)) {
    if (which && which !== 'all' && name !== which) continue;
    for (const n of sizes) {
      const r = await h.runChromium(D + g(n) + '</body></html>', 'reflow-horizontal-scroll');
      const codes = {}; r.occ.forEach(o => codes[o.code] = (codes[o.code]||0)+1);
      console.log(name.padEnd(18), String(n).padStart(6), r.ms + 'ms', r.outcome, JSON.stringify(codes), JSON.stringify(r.data||''), r.error ? 'ERR '+JSON.stringify(r.error).slice(0,200) : '');
    }
  }
  await h.close();
})();
