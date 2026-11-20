const { run, close } = require('./h');
(async () => {
  for (const n of [500, 1000, 2000, 5000]) {
    const dense = `<div style="display:flex;flex-wrap:wrap;width:1000px">` + Array.from({length:n},(_, i)=>`<button style="all:unset;width:18px;height:18px;margin:1px;background:#ccc">${i%10}</button>`).join('') + `</div>`;
    const spread = `<div style="display:flex;flex-wrap:wrap;width:1000px">` + Array.from({length:n},(_, i)=>`<button style="all:unset;width:30px;height:30px;margin:5px;background:#ccc">${i%10}</button>`).join('') + `</div>`;
    const inline = Array.from({length:Math.ceil(n/5)},(_, i)=>`<p>Para ${i} with <a href="#">a</a> and <a href="#">b</a>, <a href="#">c</a>; <a href="#">d</a> or <a href="#">e</a> words.</p>`).join('');
    const sticky = `<header style="position:sticky;top:0;height:60px;background:#fff">H</header>` + Array.from({length:n},(_, i)=>`<a href="#" style="display:block">L${i}</a>`).join('') + `<footer style="position:fixed;bottom:0;left:0;right:0;height:50px;background:#333"></footer>`;
    const out = [];
    for (const [k, h, rules] of [['dense', dense, ['target-size-minimum','target-size-enhanced']], ['spread', spread, ['target-size-minimum','target-size-enhanced']], ['inline', inline, ['target-size-minimum','target-size-enhanced']], ['sticky', sticky, ['focus-not-obscured-minimum','focus-not-obscured-enhanced']]]) {
      const r = await run(h, rules, { eo: { wcagLevel: 'AAA' } });
      out.push(`${k}=${r.ms}ms[${r.res.map(c=>c.ruleId.split('-').pop()+':'+c.outcome+'/'+c.occ.length).join(',')}]`);
    }
    console.log(n, out.join('  '));
  }
  await close();
})();
