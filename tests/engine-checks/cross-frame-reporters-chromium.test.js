'use strict';

/**
 * The reporters read a real cross-frame result (#145). Every frame that
 * answered is reported with its own findings, located in its own document
 * and named by its path; a frame that did not answer is reported as not
 * scanned rather than left out.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { flattenCrossFrameResult } = require('../../src/index.js');
const { renderSarifReport } = require('../../src/sarif.js');
const { renderJunitReport } = require('../../src/junit.js');
const { renderHtmlReport } = require('../../src/report.js');
const { buildBaselineEntries, matchBaseline } = require('../../src/baseline.js');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

// The cross-frame pair is not in the browser bundle; the in-page chunk of
// core.js carries it (see tests/core/frame-scan.test.js).
const CORE = fs.readFileSync(path.join(__dirname, '../../src/core.js'), 'utf8');
const START = CORE.indexOf('// SELF-CONTAINED in-page runner');
const CROSS_FRAME_CHUNK = CORE.slice(START, CORE.indexOf('module.exports = {', START));

// The same broken image everywhere: one finding per document.
const IMG = "<img src='data:,'>";
const doc = (title, extra = '') =>
  `<!doctype html><html lang='en'><head><title>${title}</title></head><body><main>${IMG}${extra}</main></body></html>`;
const nested = doc('widget', `<iframe id='inner' title='inner' srcdoc="${doc('inner')}"></iframe>`)
  .replace(/'/g, '&apos;')
  .replace(/"/g, '&quot;');

test('the reporters read a cross-frame result, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>top</title></head><body><main>' +
      IMG +
      `<iframe id="pay" title="pay" srcdoc="${doc('pay')}"></iframe>` +
      `<iframe id="widget" title="widget" srcdoc="${nested}"></iframe>` +
      `<iframe id="ads" title="ads" srcdoc="${doc('ads')}"></iframe>` +
      '</main></body></html>'
  );
  await page.addScriptTag({ content: CROSS_FRAME_CHUNK });
  for (const frame of page.frames().slice(1)) {
    await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    // The ad frame never opts in, as most third-party embeds don't.
    if ((await frame.title()) !== 'ads')
      await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
  }
  const result = await page.evaluate(() =>
    window.runa11yCoreAcrossFrames(null, null, { pingWaitTime: 200 }, ['img-alt-present'])
  );
  await page.close();

  await t.test('every frame is listed, the page first', () => {
    const frames = flattenCrossFrameResult(result);
    assert.deepEqual(
      frames.map((f) => [f.frame.path.join(' > '), f.result ? f.result.title : 'error']),
      [
        ['', 'top'],
        ['#pay', 'pay'],
        ['#widget', 'widget'],
        ['#widget > #inner', 'inner'],
        ['#ads', 'error']
      ]
    );
  });

  await t.test('SARIF has every frame’s finding, and a notice for the frame it missed', () => {
    const run = JSON.parse(renderSarifReport(result)).runs[0];
    const failures = run.results.filter((r) => r.ruleId === 'img-alt-present');
    assert.deepEqual(
      failures.map((r) => (r.properties.frame || []).join(' > ')),
      ['', '#pay', '#widget', '#widget > #inner']
    );
    const hashes = new Set(failures.map((r) => r.partialFingerprints.primaryLocationLineHash));
    assert.equal(hashes.size, 4, 'the same defect in four documents is four alerts');
    const missed = run.invocations[0].toolExecutionNotifications.filter((n) =>
      /^The frame #ads .*was not scanned/.test(n.message.text)
    );
    assert.equal(missed.length, 1);
    assert.equal(missed[0].level, 'warning');
  });

  await t.test('JUnit gives each frame its suites, and skips the frame it missed', () => {
    const xml = renderJunitReport(result);
    assert.match(xml, /<testsuites name="surea11y" tests="5" failures="4"/);
    assert.match(xml, /testsuite name="Frame #widget → #inner: WCAG 1\.1\.1/);
    assert.match(xml, /testsuite name="Frame #ads"[^>]*skipped="1"/);
  });

  await t.test('the HTML report has a section per frame', () => {
    const html = renderHtmlReport(result);
    for (const heading of ['Frame #pay', 'Frame #widget', 'Frame #widget → #inner', 'Frame #ads'])
      assert.ok(html.includes(`<h3 class="frame-heading">${heading}</h3>`), heading);
    assert.match(html, /Not scanned: /);
  });

  await t.test('a baseline tells the frames apart', () => {
    const entries = buildBaselineEntries(result);
    assert.deepEqual(
      entries.map((e) => (e.frame || []).join(' > ')),
      ['', '#pay', '#widget', '#widget > #inner']
    );
    assert.equal(matchBaseline(result, entries).newCount, 0);
    // Known in the page only: the frames' copies are new.
    const pageOnly = matchBaseline(result, entries.slice(0, 1));
    assert.deepEqual(
      pageOnly.newOccurrences.map((o) => o.frame.join(' > ')),
      ['#pay', '#widget', '#widget > #inner']
    );
  });
});
