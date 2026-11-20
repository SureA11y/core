const { chromium } = require('/home/user/core/node_modules/playwright');
const pages = [
  ['h1 then h2 aria-level=10', '<h1>A</h1><h2 aria-level="10">B</h2>'],
  ['h1 aria-level=10 + h2', '<h1 aria-level="10">A</h1><h2>B</h2>'],
  ['h2 aria-level=0 + h3', '<h2 aria-level="0">A</h2><h3>B</h3>'],
  ['div heading aria-level=abc + h3', '<div role="heading" aria-level="abc">A</div><h3>B</h3>'],
  ['h1 aria-level=99999999999999999999 + h2', '<h1 aria-level="99999999999999999999">A</h1><h2>B</h2>'],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  for (const [n, body] of pages) {
    await p.setContent(`<!doctype html><html lang="en"><head><title>T</title></head><body><main>${body}</main></body></html>`);
    const s = await p.context().newCDPSession(p);
    const { nodes } = await s.send('Accessibility.getFullAXTree');
    const lv = nodes.filter(x => x.role && x.role.value === 'heading').map(x => x.name.value + '=' + ((x.properties || []).find(q => q.name === 'level') || { value: {} }).value.value);
    await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
    const r = await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, {}, ['heading-order', 'page-has-heading-one']).checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.map(o => o.data.details.reasonCode).join('/')));
    console.log(n.padEnd(42), 'AX', lv.join(' '), '| engine', r.join(' '));
  }
  await b.close();
})();
