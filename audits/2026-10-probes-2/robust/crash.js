const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const D = Number(process.argv[2] || 5000), tag = process.argv[3] || 'div';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent('<!doctype html><html lang="en"><head><title>D</title></head><body><main id="m"><h1>x</h1></main></body></html>');
  await p.evaluate(({ D, tag }) => { let n = document.getElementById('m'); for (let i = 0; i < D; i++) { const d = document.createElement(tag); n.appendChild(d); n = d; } n.innerHTML = '<img src=x><button></button>'; }, { D, tag });
  try { console.log('layout', await p.evaluate(() => { const i = document.querySelector('img'); return [i.getBoundingClientRect().width, getComputedStyle(i).display, document.body.innerText.length]; })); } catch (e) { console.log('layout crash', e.message.slice(0, 80)); process.exit(0); }
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
  const ids = await p.evaluate(() => a11ycore.runa11yCoreInPage(location.href, '#nomatch', {}, null).checksResults.map(c => c.ruleId));
  if (process.argv[4] === 'full') { try { const r = await p.evaluate(() => { const r = a11ycore.runa11yCoreInPage(location.href, null, {}, null); return r.checksResults.filter(c => c.outcome === 'fail' || c.error).map(c => c.ruleId + ':' + c.outcome + (c.error ? '!' + c.error.slice(0, 60) : '')); }); console.log('full ok', r); } catch (e) { console.log('full crash', e.message.slice(0, 80)); } process.exit(0); }
  for (const id of ids) {
    try { await p.evaluate((id) => a11ycore.runa11yCoreInPage(location.href, null, {}, [id]).checksResults.length, id); }
    catch (e) { console.log(id, 'CRASH', e.message.slice(0, 80)); process.exit(0); }
  }
  console.log('no crash');
  process.exit(0);
})();
