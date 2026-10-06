const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const CORE_SRC = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
async function withPage(fn) {
  let browser;
  try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
  const page = await browser.newPage();
  page.on('console', m => { if (process.env.CONSOLE) console.log('[page]', m.text()); });
  try { return await fn(page, browser); } finally { await browser.close(); }
}
async function inject(page) { await page.addScriptTag({ content: CORE_SRC }); }
module.exports = { withPage, inject, CORE_SRC };
