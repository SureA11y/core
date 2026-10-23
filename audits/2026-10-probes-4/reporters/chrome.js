'use strict';
const L = require('./lib.js');
const fs = require('fs');
const { chromium } = require(L.C + '/node_modules/playwright');
const { evilResult, evilCrossFrame } = require('./evil.js');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const cases = {
    evil: L.renderHtmlReport(evilResult(), { title: '<script>window.__pwn=1</script>' }),
    evilFrames: L.renderHtmlReport(evilCrossFrame()),
  };
  for (const [name, html] of Object.entries(cases)) {
    fs.writeFileSync(__dirname + '/out/' + name + '.html', html);
    const page = await browser.newPage();
    const dialogs = []; page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.setContent(html);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => (d.open = true)));
    // tick all filters, search, hover all, to trigger lazy paths
    await page.evaluate(() => { document.querySelectorAll('#filters input').forEach(i => { if (!i.checked) i.click(); }); });
    await page.fill('#search', 'img');
    await page.fill('#search', '');
    const info = await page.evaluate(() => ({
      pwn: window.__pwn || null,
      imgs: document.querySelectorAll('img').length,
      svgs: document.querySelectorAll('svg').length,
      scripts: document.querySelectorAll('script').length,
      onAttrs: [...document.querySelectorAll('*')].flatMap(e => [...e.attributes].filter(a => /^on/i.test(a.name)).map(a => e.tagName + '@' + a.name)),
      links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
      langs: [...document.querySelectorAll('[lang]')].map(e => e.getAttribute('lang')).filter((v, i, a) => a.indexOf(v) === i),
      rows: document.querySelectorAll('#findings-body tr').length,
    }));
    console.log(name, JSON.stringify({ ...info, dialogs, errors }, null, 1));
    // raw string checks
    const bad = [];
    for (const ch of ['‮', '\u0000', '￾']) if (html.includes(ch)) bad.push('raw U+' + ch.codePointAt(0).toString(16));
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(html)) bad.push('lone surrogate in output');
    console.log(name, 'string checks:', bad);
    await page.close();
  }
  await browser.close();
})();
