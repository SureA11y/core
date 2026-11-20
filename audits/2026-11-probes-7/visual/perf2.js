const { run, close } = require('./h');
(async () => {
  const n = 5000;
  const dense = `<div style="display:flex;flex-wrap:wrap;width:1000px">` + Array.from({length:n},(_, i)=>`<button style="all:unset;width:18px;height:18px;margin:1px;background:#ccc">${i%10}</button>`).join('') + `</div>`;
  const spread = `<div style="display:flex;flex-wrap:wrap;width:1000px">` + Array.from({length:n},(_, i)=>`<button style="all:unset;width:30px;height:30px;margin:5px;background:#ccc">${i%10}</button>`).join('') + `</div>`;
  for (const [k,h] of [['dense',dense],['spread',spread]]) for (const rules of [['target-size-minimum'], ['target-size-enhanced'], ['target-size-minimum','target-size-enhanced']]) {
    const r = await run(h, rules, { eo: { wcagLevel: 'AAA' } });
    console.log(k, rules.join('+'), r.ms + 'ms');
  }
  await close();
})();
