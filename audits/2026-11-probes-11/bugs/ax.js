// Chromium AX tree dump helper: ax(html) -> list of {role,name,ignored,nodeId,parentId}
const CORE='/home/user/core-r11';
const { chromium } = require(CORE+'/node_modules/playwright');
let browser;
async function ax(html, { withEngine = null } = {}) {
  browser = browser || await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  let eng = null;
  if (withEngine) { await page.addScriptTag({ path: CORE+'/surea11y.browser.js' }); eng = await page.evaluate(withEngine); }
  await page.close();
  return { nodes: nodes.filter(n => !n.ignored).map(n => ({ id: n.nodeId, parent: n.parentId, role: n.role && n.role.value, name: n.name && n.name.value, be: n.backendDOMNodeId })), eng };
}
function show(nodes) { return nodes.filter(n => !['generic','none','InlineTextBox','StaticText','RootWebArea','main'].includes(n.role)).map(n => `${n.role}:${JSON.stringify(n.name)}`).join(' | '); }
async function close() { if (browser) await browser.close(); }
module.exports = { ax, show, close };
