const { chromium } = require('/home/user/core/node_modules/playwright');
const vals = ['0', '-1', 'abc', '10', '4294967297', '1e1', '2.5', '+2'];
const html = '<!doctype html><html lang="en"><body>' + vals.map((v, i) => `<h3 aria-level="${v}">h3 ${v}</h3><div role="heading" aria-level="${v}">div ${v}</div>`).join('') + '</body></html>';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(html);
  console.log(await p.locator('body').ariaSnapshot());
  if (p.accessibility) { const snap = await p.accessibility.snapshot(); console.log(JSON.stringify(snap.children.map(c => [c.name, c.level]))); }
  // CDP raw, with property dump for one node
  const s = await p.context().newCDPSession(p);
  const { nodes } = await s.send('Accessibility.getFullAXTree');
  for (const n of nodes) if (n.role && n.role.value === 'heading' && /abc|^h3 0/.test(n.name.value)) console.log(JSON.stringify(n.properties));
  await b.close();
})();
