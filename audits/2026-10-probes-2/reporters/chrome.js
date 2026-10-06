const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => { errs.push('DIALOG ' + d.message()); d.dismiss(); });
  await p.addInitScript(() => { window.__x = []; });
  await p.goto('file://' + process.argv[2]);
  await p.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; document.querySelectorAll('input[type=checkbox]').forEach(c => { if (!c.checked) c.click(); }); });
  await p.waitForTimeout(300);
  console.log('executed', await p.evaluate(() => window.__x), 'errors', errs);
  console.log('rows', await p.evaluate(() => document.querySelectorAll('#findings-body tr').length), await p.evaluate(() => document.getElementById('page-info').textContent));
  if (process.argv[3]) console.log(await p.evaluate((s) => [...document.querySelectorAll(s)].map(e => e.textContent).join('\n'), process.argv[3]));
  await b.close();
})();
