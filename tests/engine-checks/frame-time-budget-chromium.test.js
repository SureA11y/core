'use strict';

// engineOptions.timeBudgetMs is the whole scan's, frames included: each
// frame's scan gets only what is left of it since the scan started, and a
// frame reached with none left starts no rule, lists its selection in
// notRun and is incomplete, as a profile the budget left unstarted
// (round 10, S10-5).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Playwright's Chromium, or CHROMIUM_EXECUTABLE_PATH's; skipped without one.
const { chromium, executablePath, skip } = require('../helpers/chromium');
const CORE = fs.readFileSync(path.join(__dirname, '../../src/core.js'), 'utf8');
const START = CORE.indexOf('// SELF-CONTAINED in-page runner');
const CHUNK = CORE.slice(START, CORE.indexOf('module.exports = {', START));
const CHILD =
  "<!doctype html><html lang=en><head><title>c</title></head><body><main><p>Frame</p><iframe title=n srcdoc='<p>Nested</p>'></iframe></main></body></html>";

test('the time budget is the whole cross-frame scan’s, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function scanAcrossFrames(timeBudgetMs) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Top</h1>${`<iframe title="f" srcdoc="${CHILD}"></iframe>`.repeat(2)}</main></body></html>`
      );
      // Wait for every frame, the nested ones included: a nested frame not
      // loaded yet would get no engine script and drop out of the scan.
      await page.waitForFunction(() => {
        const all = (doc) =>
          doc.readyState === 'complete' &&
          [...doc.querySelectorAll('iframe')].every(
            (f) => f.contentDocument && all(f.contentDocument)
          );
        return all(document);
      });
      await page.addScriptTag({ content: CHUNK });
      for (const frame of page.frames().slice(1)) {
        await frame.addScriptTag({ content: CHUNK });
        await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
      }
      return await page.evaluate((budget) => {
        const slow = {
          id: 'org-slow',
          meta: { title: 'slow', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] },
          runInPage:
            "function (ctx) { var t = Date.now(); while (Date.now() - t < 400); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; }"
        };
        const warn = console.warn;
        console.warn = () => {};
        return window
          .runa11yCoreAcrossFrames(
            null,
            null,
            { timeBudgetMs: budget, customRules: [slow] },
            { includeRuleIds: ['org-slow', 'page-title-present'] }
          )
          .finally(() => {
            console.warn = warn;
          });
      }, timeBudgetMs);
    } finally {
      await page.close();
    }
  }
  const framesOf = (node) =>
    (node.frames || []).flatMap((f) => [f, ...framesOf(f)]).filter((f) => f.topFrame);

  await t.test('a frame reached with none left starts no rule and is incomplete', async () => {
    // The top document's slow rule, started within the budget, spends it.
    const r = await scanAcrossFrames(200);
    assert.ok(r.topFrame.checksResults.some((c) => c.ruleId === 'org-slow'));
    const frames = framesOf(r);
    // Both frames and each one's nested frame.
    assert.equal(frames.length, 4);
    for (const f of frames) {
      assert.deepEqual(f.topFrame.checksResults, []);
      assert.deepEqual(f.topFrame.notRun.map((n) => n.ruleId).sort(), [
        'org-slow',
        'page-title-present'
      ]);
      assert.deepEqual(f.topFrame.engine.incomplete, {
        reason: 'timeBudget',
        timeBudgetMs: 200,
        rulesNotRun: 2
      });
    }
  });

  await t.test('within the budget every frame runs every rule', async () => {
    const r = await scanAcrossFrames(1e9);
    assert.equal(r.topFrame.engine.incomplete, undefined);
    const frames = framesOf(r);
    assert.equal(frames.length, 4);
    for (const f of frames) {
      assert.equal(f.topFrame.engine.incomplete, undefined);
      assert.equal(f.topFrame.checksResults.length, 2);
    }
  });
});
