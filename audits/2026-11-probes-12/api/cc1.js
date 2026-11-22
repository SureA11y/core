const B = require('./bh.js');
const pg = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title><script src="/core.js"></script></head><body><main><h1>t</h1><div id="a"><img id="i1" src="a.png"></div><div id="b"><img id="i2" src="b.png"></div><button id="btn" style="display:none"></button></main></body></html>`;
(async () => {
  await B.start();
  const { page } = await B.open('/', pg);
  const out = await page.evaluate(() => {
    const run = (eo, ro) => a11ycore.runa11yCoreInPage(location.href, null, eo || {}, ro || ['img-alt-present', 'button-name-present']);
    const sel = (r) => r.checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.filter(o => (o.occurrenceOutcome || 'fail') !== 'pass').map(o => o.selector).join('|')).join(' ; ');
    const res = [];
    res.push(['base', sel(run())]);
    document.getElementById('i1').alt = 'x'; res.push(['alt set i1', sel(run())]);
    document.getElementById('btn').style.display = ''; res.push(['btn shown', sel(run())]);
    res.push(['excl #a', sel(run({ excludeSelectors: ['#b'] }))]);
    res.push(['excl #b->#a', sel(run({ excludeSelectors: ['#a'] }))]);
    document.getElementById('i1').removeAttribute('alt'); document.getElementById('a').id = 'b2'; res.push(['id changed, excl #a', sel(run({ excludeSelectors: ['#a'] }))]);
    res.push(['hidden incl', sel(run({ includeHiddenElements: true }))]);
    document.getElementById('btn').style.display = 'none'; res.push(['btn hidden again', sel(run())]);
    return res;
  });
  for (const r of out) console.log(r.join(' => '));
  await B.stop();
})();
