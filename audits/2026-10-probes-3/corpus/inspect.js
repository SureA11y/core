'use strict';
// Runs one rule on one corpus page with a given bundle and prints its occurrences
// plus facts about each flagged element.
// usage: node inspect.js <page.html> <bundle.js> <ruleId> [selectorSubstring] [max]
const fs = require('node:fs');
const { chromium } = require('playwright');
const [file, bundle, ruleId, filt, maxArg] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.route('**/*', (r) => r.abort());
  await page.setContent(fs.readFileSync(file, 'utf8'), { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.addScriptTag({ content: fs.readFileSync(bundle, 'utf8') });
  const out = await page.evaluate(({ ruleId, filt, max }) => {
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, { optInRules: 'all' }, { includeRuleIds: [ruleId] });
    const c = r.checksResults.find((x) => x.ruleId === ruleId);
    const occ = c.occurrences.filter((o) => !filt || (o.selector || '').includes(filt)).slice(0, max);
    return {
      outcome: c.outcome, n: c.occurrences.length, error: c.error || null,
      occ: occ.map((o) => {
        let el = null;
        try {
          let root = document;
          for (const h of o.shadowHostSelectors || []) root = root.querySelector(h).shadowRoot;
          el = o.selector ? root.querySelector(o.selector) : null;
        } catch {}
        const info = el ? (() => {
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName, outer: el.outerHTML.slice(0, 400),
            rect: [rect.x, rect.y, rect.width, rect.height].map(Math.round),
            color: cs.color, bg: cs.backgroundColor, font: cs.fontSize + ' ' + cs.fontWeight,
            display: cs.display, vis: cs.visibility, opacity: cs.opacity
          };
        })() : null;
        return { selector: o.selector, shadow: o.shadowHostSelectors, outcome: o.outcome, summary: o.summary || o.message, details: o.data ? o.data.details : o.details, html: (o.html || '').slice(0, 300), info };
      })
    };
  }, { ruleId, filt: filt || '', max: Number(maxArg) || 5 });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
