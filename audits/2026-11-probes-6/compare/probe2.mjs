import { createRequire } from 'node:module';
const coreRequire = createRequire('/home/user/core/package.json');
const { chromium } = coreRequire('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const variants = ['<h3 aria-level="0">X</h3>','<h3 aria-level="-1">X</h3>','<h3 aria-level="abc">X</h3>','<h3 aria-level="10">X</h3>','<h3 aria-level=" 2">X</h3>','<h3 aria-level="2abc">X</h3>','<h3 aria-level="2.9">X</h3>','<div role="heading" aria-level="0">X</div>','<div role="heading" aria-level="10">X</div>','<div role="heading" aria-level="abc">X</div>','<div role="heading" aria-level="1e1">X</div>','<h3 aria-level="+2">X</h3>','<h4 role="heading" aria-level="">X</h4>'];
for (const v of variants) {
  const p = await b.newPage();
  await p.setContent(`<!doctype html><html lang=en><title>t</title><body>${v}<h6>Six</h6></body></html>`);
  const cdp = await p.context().newCDPSession(p);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const lvl = nodes.filter(n => n.role?.value==='heading').map(n => (n.properties||[]).find(q=>q.name==='level')?.value?.value);
  await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
  const r = await p.evaluate(() => { const c = window.a11ycore.runa11yCoreInPage(null, null, {}, ['heading-order']).checksResults[0]; return c.outcome + ' ' + (c.occurrences||[]).map(o=>o.data.details.fromLevel+'->'+o.data.details.toLevel).join(','); });
  await p.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const a = await p.evaluate(async () => { const r = await axe.run(document,{runOnly:{type:'rule',values:['heading-order']}}); return r.violations.length? 'fail':'pass'; });
  console.log(v.padEnd(48), 'chromium', JSON.stringify(lvl), '| ours', r, '| axe', a);
  await p.close();
}
await b.close();
