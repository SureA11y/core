const { page, withBrowser, scan } = require('./harness.js');
function build(n, depth, abs) {
  let s = '';
  for (let i = 0; i < n; i++) {
    let open = '', close = '';
    for (let d = 0; d < depth; d++) { open += abs ? '<div style="position:absolute">' : '<div>'; close += '</div>'; }
    s += open + '<span>Item ' + i + '</span>' + close;
  }
  return s;
}
(async () => {
  await withBrowser(async (b) => {
    for (const [name, html] of [
      ['deep200x100 plain', page('', build(200, 100, false))],
      ['deep200x100 hidden wrapper', page('.wrap{overflow:hidden;position:static}', '<div class="wrap">' + build(200, 100, false) + '</div>')],
      ['deep200x100 abs in hidden wrapper', page('.wrap{overflow:hidden}', '<div class="wrap">' + build(200, 100, true) + '</div>')],
      ['big table 300x30 in scroller', page('', '<div style="overflow-x:auto"><table>' + Array.from({length:300},(_, r)=>'<tr>'+Array.from({length:30},(_, c)=>`<td>r${r}c${c}</td>`).join('')+'</tr>').join('') + '</table></div>')],
    ]) {
      const t = [];
      let r;
      for (let i = 0; i < 2; i++) { r = await scan(b, html); t.push(r.ms); }
      console.log(name, r.outcome, JSON.stringify(r.f.slice(0,2)), 'ms', t.join(','));
    }
  });
})();
