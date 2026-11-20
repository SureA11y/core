const { page, withBrowser, scan } = require('./harness');
function build(n, depth) {
  let s = '';
  for (let i = 0; i < n; i++) {
    let open = '', close = '';
    for (let d = 0; d < depth; d++) { open += '<div>'; close += '</div>'; }
    s += open + '<span>Item ' + i + ' text</span>' + close;
  }
  return s;
}
(async () => {
  await withBrowser(async (b) => {
    const body = build(400, 25); // ~10k elements, depth 27+
    const variants = {
      plain: page('', body),
      hiddenWrapper: page('.wrap{overflow:hidden}', '<div class="wrap">' + body + '</div>'),
      appShell: page('html,body{height:100%;margin:0;overflow:hidden} .wrap{height:100%;overflow:auto}', '<div class="wrap">' + body + '</div>'),
      everyLevelHidden: page('div{overflow:hidden}', body),
      bodyClips: page('body{overflow-x:hidden}', body),
    };
    for (const [k, html] of Object.entries(variants)) {
      const times = [];
      let last;
      for (let i = 0; i < 3; i++) { const r = await scan(b, html); times.push(r.ms); last = r; }
      console.log(k, 'outcome', last.outcome, 'ms', times.join(','));
    }
  });
})();
