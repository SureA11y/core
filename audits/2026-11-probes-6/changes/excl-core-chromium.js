const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const src = fs.readFileSync('/home/user/core/tests/excluded-areas.test.js', 'utf8');
const PROBLEMS = /const PROBLEMS = `([\s\S]*?)`;/.exec(src)[1];
const EXTRA = `<div style="position:fixed;top:0;left:0;width:100%;height:60px;background:#fff">Sticky</div>
<a href="/t" style="display:inline-block;width:10px;height:10px">t</a><a href="/u" style="display:inline-block;width:10px;height:10px">u</a>
<div style="width:2000px">wide</div><p style="line-height:1;height:16px;overflow:hidden">Text spacing clipped text that is long enough to wrap and wrap again and again</p>
<button style="outline:none" onclick="1">B</button><span style="color:#777;background:#888">low contrast</span>`;
const PAGE = `<!doctype html><html lang="en"><head><title>T</title></head><body><div id="excluded">${PROBLEMS}${EXTRA}</div><main id="main"><h1>Page</h1><p>Fine content.</p></main></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(PAGE);
  await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
  const out = await p.evaluate((IDS) => {
    const ids = IDS;
    const r0 = window.a11ycore.runa11yCoreInPage(null, null, {}, ids);
    const r = window.a11ycore.runa11yCoreInPage(null, null, { excludeSelectors: ['#excluded'] }, ids);
    const inside = (res) => res.checksResults.filter(c => c.occurrences.some(o => { try { const e = document.querySelector(o.selector); return e && e.closest('#excluded'); } catch { return false; } })).map(c => c.ruleId);
    return { before: inside(r0).length, after: inside(r), dropped: r.checksResults.filter(c => c.excludedOccurrences).map(c => c.ruleId + ':' + JSON.stringify(c.excludedOccurrences)) };
  }, JSON.parse(fs.readFileSync(__dirname + '/ids.json','utf8')));
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
