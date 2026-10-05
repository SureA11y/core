const h = require('./h.js'); const { jscan } = require('./j.js');
const R = ['img-alt-quality','area-alt-quality','input-image-alt-quality'];
function page(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<img src="p${i}.png" alt="${i % 50 === 49 ? 'IMG_' + (1000 + i) + '.jpg' : 'Hikers on the trail, number ' + i}" width=5 height=5>`;
  s += `<img src="z.png" alt="DSC_9999"><map name=m>` + Array.from({length: 120}, (_, i) => `<area href="#" shape=rect coords="0,0,1,1" alt="${i > 100 ? 'image' : 'Region ' + i}">`).join('') + `</map><img usemap="#m" src="m.png" alt="Map">`;
  s += Array.from({length: 120}, (_, i) => `<input type=image src="b${i}.png" alt="${i > 100 ? 'submit.png' : 'Search ' + i}">`).join('');
  return s;
}
(async () => {
  for (const n of [500, 4000]) {
    const r = await h.scan(page(n), { rules: R, opts: { perfStats: true, profileRules: true }, full: true });
    for (const id of R) { const c = r.checksResults.find(c => c.ruleId === id); const sig = c.occurrences.filter(o => o.data && o.data.details && o.data.details.altSignal).length; console.log('chromium', n, id, c.outcome, 'occ', c.occurrences.length, 'sig', sig, 'details', JSON.stringify(c.data && c.data.details), 'ms', Math.round(r.perfStats.ruleTimings[id])); }
    const t0 = Date.now(); const j = jscan(page(n), { rules: R, full: true }); const jt = Date.now() - t0;
    for (const id of R) { const c = j.checksResults.find(c => c.ruleId === id); const sig = c.occurrences.filter(o => o.data && o.data.details && o.data.details.altSignal).length; console.log('jsdom   ', n, id, c.outcome, 'occ', c.occurrences.length, 'sig', sig); }
    console.log('jsdom total ms', jt);
  }
  await h.close();
})();
