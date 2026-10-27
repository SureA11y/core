'use strict';
// A pack rule that never returns, and one that reports 100,000 occurrences:
// is there a time limit, and what do the scan and the reporters cost?
const path = require('path');
const L = require('./lib');
const { packScript } = L.packApi;
const { renderHtmlReport } = require(path.join(L.ROOT, 'src/report.js'));
const { renderSarifReport } = require(path.join(L.ROOT, 'src/sarif.js'));
const { renderJunitReport } = require(path.join(L.ROOT, 'src/junit.js'));
const { renderEarlReport } = require(path.join(L.ROOT, 'src/earl.js'));
const { buildBaselineEntries } = require(path.join(L.ROOT, 'src/baseline.js'));

const N = Number(process.env.N || 100000);
const hang = L.pack({ name: 'hang', namespace: 'hang', rules: [L.rule('hang-loop', () => { for (;;) {} })] });
const many = L.pack({
  name: 'many', namespace: 'many',
  rules: [L.rule('many-occ', new Function('N', 'return (ctx) => { const b = ctx.document.body; const occ = []; for (let i = 0; i < ' + N + '; i++) occ.push({ __node: b, summary: "occurrence " + i, data: { details: { reasonCode: "R" + (i % 7) } } }); return { outcome: "fail", occurrences: occ }; }')(N))]
});
const big = L.pack({
  name: 'big', namespace: 'big',
  rules: [L.rule('big-elems', (ctx) => { const els = Array.from(ctx.document.querySelectorAll('span')); return { outcome: 'fail', occurrences: els.map((e) => ({ __node: e, summary: 's' })) }; })]
});
const SPANS = `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${'<span>x</span>'.repeat(N / 10)}</main></body></html>`;

const time = async (fn) => { const t = Date.now(); try { const v = await fn(); return { ms: Date.now() - t, v }; } catch (e) { return { ms: Date.now() - t, error: e.message.split('\n')[0].slice(0, 200) }; } };

(async () => {
  await L.withBrowser(async (b) => {
    {
      const { page, context } = await L.openPage(b);
      await page.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: packScript([hang]) });
      page.setDefaultTimeout(8000);
      const r = await time(() => Promise.race([L.scanInPage(page, ['hang@1.0.0']), new Promise((_, rej) => setTimeout(() => rej(new Error('still running after 8s')), 8000))]));
      const alive = await time(() => Promise.race([page.evaluate(() => 1), new Promise((_, rej) => setTimeout(() => rej(new Error('page unresponsive 3s later')), 3000))]));
      L.log('a) infinite loop in a pack rule (Chromium)', { scan: r, pageAfter: alive });
      await context.close().catch(() => {});
    }
    {
      const { page, context } = await L.openPage(b);
      await page.addScriptTag({ content: L.BUNDLE });
      const s = await time(async () => packScript([many]).length);
      await page.addScriptTag({ content: packScript([many]) });
      const r = await time(() => L.scanInPage(page, ['many@1.0.0'], {}, ['many-occ']));
      const res = r.v;
      const info = { packScriptMs: s.ms, scanMs: r.ms, error: r.error };
      if (res) {
        const c = res.checksResults.find((x) => x.ruleId === 'many-occ'); info.outcome = c.outcome; info.ruleError = c.error; info.occurrences = c.occurrences.length;
        info.jsonMB = +(JSON.stringify(res).length / 1e6).toFixed(1);
        for (const [name, fn] of [['html', renderHtmlReport], ['sarif', renderSarifReport], ['junit', renderJunitReport], ['earl', renderEarlReport], ['baseline', buildBaselineEntries]]) {
          const t = await time(() => fn(res));
          const out = t.v;
          info[name] = { ms: t.ms, error: t.error, MB: out == null ? null : +((typeof out === 'string' ? out.length : JSON.stringify(out).length) / 1e6).toFixed(1) };
        }
      }
      L.log(`b) ${N} occurrences on one element (Chromium) + reporters`, info);
      await context.close();
    }
    {
      const { page, context } = await L.openPage(b, { html: SPANS });
      await page.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: packScript([big]) });
      const r = await time(() => L.scanInPage(page, ['big@1.0.0'], {}, ['big-elems']));
      L.log(`c) ${N / 10} distinct elements reported (Chromium)`, { ms: r.ms, error: r.error, n: r.v && r.v.checksResults[0].occurrences.length });
      await context.close();
    }
  });
})();
