'use strict';

/**
 * A document shown in a frame is no page of its own: page-title-present and
 * html-lang-attr-present are notApplicable in it, whether the frame is
 * shown, aria-hidden or empty, while the top page is still checked. Its
 * frame is named by the <iframe>, which iframe-name-present checks in the
 * top page.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../helpers/browserBundle');

const RULES = ['page-title-present', 'html-lang-attr-present'];

const outcomes = (frame) =>
  frame.evaluate(
    (rules) =>
      Object.fromEntries(
        window.a11ycore
          .runa11yCoreInPage(null, null, {}, rules)
          .checksResults.map((c) => [c.ruleId, c.outcome])
      ),
    RULES
  );

test(
  'a framed document has no page title or language of its own to check, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    // The top page has neither, so both rules fail it.
    await page.setContent(
      '<!doctype html><html><head></head><body><main><p>x</p>' +
        '<iframe title="Map" srcdoc="<p>map</p>"></iframe>' +
        '<iframe aria-hidden="true" title="ad" srcdoc="<p>ad</p>"></iframe>' +
        '<iframe title="empty"></iframe></main></body></html>'
    );
    await addBundle(page);
    assert.deepEqual(await outcomes(page), {
      'page-title-present': 'fail',
      'html-lang-attr-present': 'fail'
    });
    const frames = page.frames().filter((f) => f !== page.mainFrame());
    assert.equal(frames.length, 3);
    for (const frame of frames) {
      await addBundle(frame);
      assert.deepEqual(await outcomes(frame), {
        'page-title-present': 'notApplicable',
        'html-lang-attr-present': 'notApplicable'
      });
    }
  }
);
