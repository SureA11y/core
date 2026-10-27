'use strict';

/**
 * Every scenario fixture gives the same result in two separate browser
 * launches, and at any time after it loaded. tests/determinism.test.js
 * repeats one small page in one process under jsdom; what a browser draws can
 * move on its own, and a rule that measures it then answers differently from
 * one scan to the next. A <marquee> did that to text-spacing-content-loss:
 * browsers move it outside the Web Animations API, so the engine could not
 * hold it still, and the deprecated-elements fixture gave no finding, a
 * cantTell or a fail depending on how far its text had scrolled.
 *
 * The first launch scans each fixture as it loads. The second holds the
 * page's clock (Chromium's virtual time) once it has loaded and scans it, then moves
 * the clock on in steps for a few seconds, as a page left open would, and
 * scans again whenever the text on the page has moved or the document has
 * changed since the last scan; once more at the end in any case. Moving the
 * clock rather than waiting makes the times exact: real waits drift past a
 * window in which a result differs, and cost the seconds they wait. Each
 * rule's outcome and number of occurrences must match the first launch's.
 * The two launches run at the same time, in browsers that share nothing.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, executablePath, skip } = require('../helpers/chromium');

const { addBundle, bundleUrl } = require('../helpers/browserBundle');
const DIR = path.join(__dirname, '../fixtures');
const FIXTURES = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('-all-scenarios.html') || f === 'all-pass.html')
  .sort();

// How far the second launch moves a page's clock, in steps. Short of the
// meta-refresh fixtures' 5 s redirect; a marquee scrolls about 200 px in it.
const STEP_MS = 250;
const UNTIL_MS = 3000;

// Every rule's outcome and occurrence count for one scan.
function summary() {
  const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
  return Object.fromEntries(
    r.checksResults.map((c) => [c.ruleId, `${c.outcome} ×${(c.occurrences || []).length}`])
  );
}

// Where the page's text is drawn, and the document's size: what changes when
// something on the page moves or the page changes itself.
function snapshot() {
  const out = [document.documentElement.outerHTML.length];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!/\S/.test(n.nodeValue)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) out.push(Math.round(r.left), Math.round(r.top));
  }
  return out.join(',');
}

async function launch() {
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Fixtures are self-contained; a request one still makes is refused, so
  // nothing outside the machine can change a result. The engine's bundle
  // comes from this process.
  const bundle = await bundleUrl();
  await context.route('**/*', (route) =>
    /^(data|about):/.test(route.request().url()) || route.request().url() === bundle
      ? route.continue()
      : route.abort()
  );
  return { browser, context };
}

function html(file) {
  return fs.readFileSync(path.join(DIR, file), 'utf8');
}

// Moves the page's held clock on by `ms`.
function advance(cdp, ms) {
  return new Promise((resolve, reject) => {
    cdp.once('Emulation.virtualTimeBudgetExpired', resolve);
    cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms }).catch(reject);
  });
}

// The first launch: each fixture's summary as it loads.
async function scanAsLoaded() {
  const first = {};
  const { browser, context } = await launch();
  try {
    for (const file of FIXTURES) {
      const page = await context.newPage();
      await page.setContent(html(file), { waitUntil: 'load' });
      await addBundle(page);
      first[file] = await page.evaluate(summary);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return first;
}

// The second launch: each fixture's summaries under a held clock, as
// [file, ms, summary], at 0 ms and whenever the page has moved since.
async function scanOverTime() {
  const scans = [];
  const { browser, context } = await launch();
  try {
    for (const file of FIXTURES) {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      // Held once the page has loaded: a fixture's load can wait on time
      // passing, which a held clock never lets it do.
      await page.setContent(html(file), { waitUntil: 'load' });
      await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
      await addBundle(page);
      scans.push([file, 0, await page.evaluate(summary)]);
      let scanned = await page.evaluate(snapshot);
      for (let at = STEP_MS; at <= UNTIL_MS; at += STEP_MS) {
        await advance(cdp, STEP_MS);
        const now = await page.evaluate(snapshot);
        if (now !== scanned || at === UNTIL_MS) {
          scans.push([file, at, await page.evaluate(summary)]);
          scanned = now;
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return scans;
}

test(
  'every fixture gives the same result in two launches and over time, in Chromium',
  { skip },
  async () => {
    // Two browsers that share nothing, so the launches run side by side.
    const [first, scans] = await Promise.all([scanAsLoaded(), scanOverTime()]);

    const differences = [];
    for (const [file, at, result] of scans) {
      for (const id of new Set([...Object.keys(first[file]), ...Object.keys(result)])) {
        if (first[file][id] !== result[id]) {
          differences.push(
            `${file}: ${id} ${first[file][id]} in the first launch, ${result[id]} at ${at} ms`
          );
        }
      }
    }
    assert.deepEqual(differences, [], differences.join('\n'));
  }
);
