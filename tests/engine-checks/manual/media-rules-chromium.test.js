'use strict';

/**
 * The media rules in a real browser. Chromium's own stylesheet hides
 * `audio:not([controls])` with `display: none`, which jsdom does not, so an
 * <audio autoplay> without controls looks hidden only in a real browser. The
 * rules must still report it there: it plays whatever its computed style
 * says. This test runs the browser bundle in Chromium and checks the
 * outcomes against the same scan in jsdom.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

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

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');
const FIXTURES = path.join(__dirname, '../../fixtures');

// Core's media rules.
const MEDIA_RULES = ['no-autoplay-audio', 'media-alternative-transcript-evidence', 'video-caption'];

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

// Outcome and occurrence count per rule, which is what must agree between
// the two environments.
function summarize(result) {
  const out = {};
  for (const r of result.checksResults) {
    if (!MEDIA_RULES.includes(r.ruleId)) continue;
    out[r.ruleId] = { outcome: r.outcome, occurrences: (r.occurrences || []).length };
  }
  return out;
}

function jsdomSummary(html) {
  return summarize(
    runa11yCoreOnHtml(html, { engineOptions: { rules: { include: MEDIA_RULES.join(',') } } })
  );
}

test('media rules in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function chromiumSummary(html) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (include) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include } }, null),
        MEDIA_RULES.join(',')
      );
      return summarize(result);
    } finally {
      await p.close();
    }
  }

  await t.test('the browser stylesheet does hide <audio> without controls', async () => {
    const p = await browser.newPage();
    await p.setContent(page('<audio id="a" src="m.mp3"></audio>'));
    const display = await p.evaluate(() => getComputedStyle(document.getElementById('a')).display);
    await p.close();
    assert.equal(display, 'none');
  });

  await t.test('<audio autoplay loop> without controls is still reported', async () => {
    const html = page('<audio autoplay loop src="m.mp3"></audio>');
    const got = await chromiumSummary(html);
    assert.deepEqual(got['no-autoplay-audio'], { outcome: 'cantTell', occurrences: 1 });
    assert.deepEqual(got['media-alternative-transcript-evidence'], {
      outcome: 'cantTell',
      occurrences: 1
    });
    assert.deepEqual(got, jsdomSummary(html));
  });

  await t.test('autoplaying audio in an author-hidden container still plays', async () => {
    const html = page('<div style="display:none"><audio autoplay loop src="m.mp3"></audio></div>');
    const got = await chromiumSummary(html);
    assert.deepEqual(got['no-autoplay-audio'], { outcome: 'cantTell', occurrences: 1 });
    // The transcript question follows the author's hiding, as before.
    assert.equal(got['media-alternative-transcript-evidence'].outcome, 'notApplicable');
    assert.deepEqual(got, jsdomSummary(html));
  });

  for (const fixture of [
    'no-autoplay-audio-all-scenarios.html',
    'media-alternative-transcript-evidence-all-scenarios.html',
    'media-alternative-transcript-evidence.html',
    'video-caption-all-scenarios.html',
    'wcag-12x-media-scenarios.html'
  ]) {
    await t.test(`${path.basename(fixture)}: Chromium agrees with jsdom`, async () => {
      const html = fs.readFileSync(path.resolve(FIXTURES, fixture), 'utf8');
      assert.deepEqual(await chromiumSummary(html), jsdomSummary(html));
    });
  }
});
