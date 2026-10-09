// Packs whose runInPage is written in different function forms, run in Chromium through packScript; prints each outcome/error.
const path = require('path');
const req = require('module').createRequire(path.join(path.resolve(process.argv[2]), 'x.js'));
const { definePack, packScript } = req('@surea11y/core/pack');
const { chromium } = req('playwright');
const html = '<!doctype html><html lang="en"><title>t</title><a href="/x">Read more</a></html>';
const R = (ctx) => ({ outcome: 'pass', occurrences: [] });
const forms = {
  arrow: { runInPage: (ctx) => ({ outcome: 'pass', occurrences: [] }) },
  method: { runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } },
  asyncMethod: { async runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } },
  bound: { runInPage: function (ctx) { return { outcome: 'pass', occurrences: [] }; }.bind(null) },
  generator: { runInPage: function* (ctx) { yield 1; } },
  stringSrc: { runInPage: 'function (ctx) { return { outcome: "pass", occurrences: [] }; }' },
  classMethod: { runInPage: new (class { runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } })().runInPage },
  scriptClose: { runInPage: (ctx) => ({ outcome: 'pass', occurrences: [], x: '</script><script>window.__pwned=1</script>' }) }
};
(async () => {
  const browser = await chromium.launch();
  for (const [label, f] of Object.entries(forms)) {
    const id = `zz-${label.toLowerCase()}`;
    let script;
    try {
      const pack = definePack({ name: `p-${label}`, version: '1.0.0', namespace: 'zz', core: '^1.10.0', rules: [{ id, meta: { tags: ['zz'] }, ...f }] });
      script = packScript([pack]);
    } catch (e) { console.log(`[${label}] packScript/definePack THROWS ${e.message.split('\n')[0]}`); continue; }
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
    await page.setContent(html);
    await page.addScriptTag({ path: req.resolve('@surea11y/core/browser') });
    try { await page.addScriptTag({ content: script }); } catch (e) { errors.push('addScriptTag: ' + e.message.split('\n')[0]); }
    const r = await page.evaluate(([name, id]) => {
      try {
        const res = window.a11ycore.runa11yCoreInPage(null, null, { packs: [name] }, [id]);
        const x = res.checksResults.find((c) => c.ruleId === id);
        return x ? { outcome: x.outcome, error: x.error, pwned: window.__pwned } : { missing: true, skipped: res.skippedPacks };
      } catch (e) { return { throws: e.message.split('\n')[0] }; }
    }, [`p-${label}@1.0.0`, id]);
    console.log(`[${label}]`, JSON.stringify(r).slice(0, 250), errors.length ? 'pageerrors: ' + errors.join(' ; ').slice(0, 200) : '');
    await page.close();
  }
  await browser.close();
})();
