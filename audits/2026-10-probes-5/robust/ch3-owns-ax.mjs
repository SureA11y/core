// Does Chromium build the tree from ariaOwnsElements? Compare with the attribute.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/core/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const mode of ['attr', 'elements']) {
  const p = await b.newPage();
  await p.setContent(`<div id="own" role="listbox" aria-label="Fruit" tabindex="0" ${mode === 'attr' ? 'aria-owns="o1 o2"' : ''}></div><p>Choices:</p><div role="option" id="o1">Apple</div><div role="option" id="o2">Pear</div>`);
  if (mode === 'elements') await p.evaluate(`own.ariaOwnsElements=[o1,o2]`);
  await p.waitForTimeout(300);
  console.log(mode, 'version', b.version(), 'reflect:', await p.evaluate(`JSON.stringify([own.getAttribute('aria-owns'), (own.ariaOwnsElements||[]).length])`));
  const cdp = await p.context().newCDPSession(p); await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const lb = nodes.find(n => n.role && n.role.value === 'listbox');
  const o = nodes.filter(n => n.role && n.role.value === 'option');
  console.log(' listbox children:', (lb.childIds || []).map(i => byId.get(i)).map(n => n && n.role.value), ' option parents:', o.map(n => byId.get(n.parentId) && byId.get(n.parentId).role.value));
  await p.close();
}
await b.close();
