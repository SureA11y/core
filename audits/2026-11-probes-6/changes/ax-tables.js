const { chromium } = require('/home/user/core/node_modules/playwright');
const tables = [
  ['2x2 no th', '<table><tr><td>Mon</td><td>9-17</td></tr><tr><td>Tue</td><td>9-17</td></tr></table>'],
  ['presentation+aria-label', '<table role="presentation" aria-label="Prices"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>'],
  ['2 rows second empty tr', '<table><tr><td>Name</td><td>Price</td></tr><tr></tr></table>'],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  for (const [n, t] of tables) {
    await p.setContent('<!doctype html><html lang=en><body>' + t + '</body></html>');
    const s = await p.context().newCDPSession(p);
    const { nodes } = await s.send('Accessibility.getFullAXTree');
    const roles = nodes.filter(x => !x.ignored).map(x => x.role && x.role.value).filter(r => !['RootWebArea', 'StaticText', 'InlineTextBox', 'none', 'generic'].includes(r));
    console.log(n.padEnd(28), roles.join(','));
  }
  await b.close();
})();
