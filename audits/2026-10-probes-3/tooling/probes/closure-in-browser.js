// Scans one page in Chromium and in jsdom with the pack in argv[2] and prints the pack rule's outcome and error from both.
const path = require('path');
const packDir = path.resolve(process.argv[2]);
const req = require('module').createRequire(path.join(packDir, 'x.js'));
const pack = req(packDir);
const { packScript } = req('@surea11y/core/pack');
const { runa11yCoreOnHtml } = req('@surea11y/core/testing');
const { chromium } = req('playwright');
const html = '<!doctype html><html lang="en"><title>t</title><a href="/x">Read more</a></html>';
const ruleId = `${pack.namespace}-link-text-specific`;
(async () => {
  const node = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: [ruleId] });
  const n = node.checksResults.find((r) => r.ruleId === ruleId);
  console.log('jsdom   ', n && n.outcome, n && n.error);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.addScriptTag({ path: req.resolve('@surea11y/core/browser') });
  await page.addScriptTag({ content: packScript([pack]) });
  const r = await page.evaluate(([name, id]) => {
    const res = window.a11ycore.runa11yCoreInPage(null, null, { packs: [name] }, [id]);
    const x = res.checksResults.find((c) => c.ruleId === id);
    return x && { outcome: x.outcome, error: x.error };
  }, [`${pack.name}@${pack.version}`, ruleId]);
  console.log('chromium', r && r.outcome, r && r.error);
  await browser.close();
})();
