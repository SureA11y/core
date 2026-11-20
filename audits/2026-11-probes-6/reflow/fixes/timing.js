// Median scan time of reflow alone on a deep plain page and on core's
// composite fixture page, for two bundles, in alternating rounds.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundles = { base: fs.readFileSync(process.argv[2], 'utf8'), new: fs.readFileSync(process.argv[3], 'utf8') };
const deep = (() => { let s = ''; for (let i = 0; i < 200; i++) s += '<div>'.repeat(100) + `<span>Item ${i}</span>` + '</div>'.repeat(100); return `<!doctype html><html lang="en"><head><title>t</title></head><body>${s}</body></html>`; })();
const fixture = fs.readFileSync('/home/user/core/tests/fixtures/index.html', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, html] of [['deep plain', deep], ['fixtures index', fixture]]) {
    const t = { base: [], new: [] };
    for (let round = 0; round < 7; round++) for (const k of round % 2 ? ['new', 'base'] : ['base', 'new']) {
      const p = await b.newPage({ viewport: { width: 320, height: 640 } });
      await p.setContent(html); await p.addScriptTag({ content: bundles[k] });
      t[k].push(await p.evaluate(() => { const s = performance.now(); window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null); return performance.now() - s; }));
      await p.close();
    }
    const med = (a) => a.sort((x, y) => x - y)[3].toFixed(0);
    console.log(name.padEnd(16), 'base', med(t.base), 'ms  new', med(t.new), 'ms');
  }
  await b.close();
})();
