// The HTML report of each saved result at 320px and 1280px: sideways scroll, card order, lang, English chrome in other locales.
import { launch, serve } from './h.mjs';
import fs from 'node:fs';
const S = process.env.AUDIT_SCRATCH || '/tmp/surea11y-audit';
const SEV = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const b = await launch();
const files = fs.readdirSync(S).filter((f) => f.endsWith('.html'));
const enChrome = new Set();
for (const f of files.filter((f) => f.includes('.en.'))) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  await p.goto(serve(fs.readFileSync(S + f, 'utf8')));
  (await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,th,button,summary,label,legend,caption')].map((e) => e.textContent.trim()).filter((t) => t.length > 3))).forEach((t) => enChrome.add(t));
  await ctx.close();
}
for (const f of files) {
  const res = JSON.parse(fs.readFileSync(S + f.replace('.html', '.json')));
  const sevOf = Object.fromEntries(res.checksResults.map((c) => [c.ruleId, [c.outcome, c.severity, (c.occurrences || []).length]]));
  for (const w of [320, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); const p = await ctx.newPage();
    await p.goto(serve(fs.readFileSync(S + f, 'utf8')));
    const info = await p.evaluate(() => ({
      sw: document.documentElement.scrollWidth, lang: document.documentElement.lang,
      cards: [...document.querySelectorAll('.card .card-title strong')].map((e) => e.textContent.trim()),
      chrome: [...document.querySelectorAll('h1,h2,h3,th,button,summary,label,legend,caption')].map((e) => e.textContent.trim()),
      wide: [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed').slice(0, 3).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))
    }));
    const probs = [];
    if (info.sw > w) probs.push('sideways scroll ' + info.sw + ' ' + JSON.stringify(info.wide));
    const loc = f.split('.').slice(-2)[0];
    if (info.lang !== loc) probs.push('lang=' + info.lang);
    if (w === 1280) {
      const seen = [...new Set(info.cards)].filter((id) => sevOf[id]);
      for (let i = 1; i < seen.length; i++) {
        const a = sevOf[seen[i - 1]], c = sevOf[seen[i]];
        const ka = [a[0] === 'fail' ? 0 : 1, SEV[a[1]] ?? 9, -a[2]], kc = [c[0] === 'fail' ? 0 : 1, SEV[c[1]] ?? 9, -c[2]];
        if (ka[0] > kc[0] || (ka[0] === kc[0] && (ka[1] > kc[1] || (ka[1] === kc[1] && ka[2] > kc[2])))) probs.push('order ' + seen[i - 1] + JSON.stringify(a) + ' before ' + seen[i] + JSON.stringify(c));
      }
      if (loc !== 'en') { const left = info.chrome.filter((t) => enChrome.has(t) && /[a-z]{3,} [a-z]{3,}/i.test(t)); if (left.length) probs.push('english chrome ' + JSON.stringify(left.slice(0, 4))); }
      if (!seen.length) probs.push('no cards found by data attribute');
    }
    if (probs.length) console.log(f, w, probs.join(' | '));
    await ctx.close();
  }
}
await b.close();
console.log('done', files.length);
