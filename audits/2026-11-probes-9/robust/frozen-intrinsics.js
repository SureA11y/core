'use strict';
// A page that freezes the JS intrinsics (as SES/hardened-JS lockdown() does): does a scan still work,
// and give the same verdicts?
const fs = require('fs');
const { serve, launch, addBundle, scanSummary, diff } = require('./lib');
const html = fs.readFileSync(__dirname + '/combined.html', 'utf8');
const freeze = `(() => {
  const seen = new Set();
  const deep = (o) => { if (o === null || (typeof o !== 'object' && typeof o !== 'function') || seen.has(o)) return; seen.add(o); Object.freeze(o); for (const k of Reflect.ownKeys(o)) { const d = Object.getOwnPropertyDescriptor(o, k); if (!d) continue; if ('value' in d) deep(d.value); else { deep(d.get); deep(d.set); } } deep(Object.getPrototypeOf(o)); };
  for (const n of ['Object','Array','Function','String','Number','Boolean','Symbol','Error','TypeError','RangeError','SyntaxError','Map','Set','WeakMap','WeakSet','RegExp','Promise','JSON','Math','Reflect','Date','ArrayBuffer','Uint8Array','Proxy','BigInt','Intl']) { try { deep(globalThis[n]); } catch (e) {} }
})()`;
(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  const run = async (code, label, before) => {
    const page = await context.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
    await page.goto(s.base + '/c');
    if (before) await page.evaluate((c) => (0, eval)(c), code);
    await addBundle(page, s.base).catch((e) => errs.push('addBundle: ' + e.message.slice(0, 150)));
    if (!before && code) await page.evaluate((c) => (0, eval)(c), code);
    const r = await scanSummary(page);
    await page.close();
    return { r, errs };
  };
  const base = await run('', 'clean');
  for (const [label, before] of [['frozen before bundle', true], ['frozen after bundle', false]]) {
    const { r, errs } = await run(freeze, label, before);
    if (!r.ok) console.log(label, 'THROW', r.code, r.msg.slice(0, 300), errs);
    else {
      const d = diff(base.r.out, r.out);
      console.log(label, d.length ? 'DIFF ' + d.length + '\n   ' + d.slice(0, 30).join('\n   ') : 'same', errs.length ? errs : '');
    }
  }
  await browser.close();
  s.close();
})();
