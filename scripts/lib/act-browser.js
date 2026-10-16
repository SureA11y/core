/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Runs ACT test cases in Chromium, the way the browser bindings run the
 * engine: the page is loaded from its own URL, so its scripts run, its linked
 * style sheets and frames load and it is laid out, and the engine is injected
 * as the browser bundle and run with runa11yCoreInPage.
 *
 * Every request the page makes is answered from the disk cache the jsdom run
 * already keeps (.act-cache), fetched once on a miss. The page keeps its real
 * origin, so relative URLs and same-origin frames behave as on w3.org, while
 * what it loads is pinned between runs.
 *
 * Only the top frame is scanned. The rules that look into a frame reach a
 * same-origin frame's document from the frame element, as they do in jsdom,
 * and a page-level rule (a title, a lang attribute) applies to the top-level
 * document alone: scanning a frame's own document with it would test a
 * subject ACT does not.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { CACHE_DIR, fetchOnce, withRetries } = require('./act-corpus.js');

const BUNDLE_PATH = path.join(__dirname, '..', '..', 'surea11y.browser.js');

// A page's own load event, then this long at most for what its scripts start
// after it (a fetch, a timer that fills in content).
const SETTLE_MS = 2000;
const NAVIGATION_TIMEOUT_MS = 30000;

function chromiumLauncher() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('The chromium runner needs playwright (a dev dependency): run npm ci.');
  }
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || undefined;
  return () => chromium.launch(executablePath ? { executablePath } : {});
}

function binaryCachePaths(url, dir) {
  const key = crypto.createHash('sha1').update(`asset:${url}`).digest('hex');
  return { body: path.join(dir, `${key}.bin`), meta: path.join(dir, `${key}.json`) };
}

/**
 * A response for `url`, from the cache or fetched and cached. A status the
 * server gave (a 404 for a deliberately broken link) is cached as given: a
 * test case may depend on a resource failing to load.
 */
async function cachedResponse(url, { cache = true, cacheDir = CACHE_DIR } = {}) {
  const paths = binaryCachePaths(url, cacheDir);
  if (cache && fs.existsSync(paths.meta) && fs.existsSync(paths.body)) {
    return {
      ...JSON.parse(fs.readFileSync(paths.meta, 'utf8')),
      body: fs.readFileSync(paths.body)
    };
  }
  // The corpus's own retry policy, so a cold run asks w3.org for test-case
  // assets as patiently as for the test cases.
  const { status, contentType, body } = await withRetries(async () => {
    const res = await fetchOnce(url, { ok: false });
    return {
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      body: Buffer.from(await res.arrayBuffer())
    };
  });
  const meta = { status, contentType };
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(paths.body, body);
  fs.writeFileSync(paths.meta, JSON.stringify(meta));
  return { ...meta, body };
}

/**
 * Starts Chromium and returns `{ scan(caseUrl, scanOptions), version, close() }`.
 * `scan` resolves to the top frame's scan result, or to null when Chromium
 * shows the document through its XML viewer: an XML document with no style
 * of its own (ACT's MathML test cases) is replaced by a page the browser
 * draws, so there is nothing of the test case's left to scan.
 */
async function openBrowserRunner(options = {}) {
  const browser = await chromiumLauncher()();
  const bundle = fs.readFileSync(BUNDLE_PATH, 'utf8');

  async function scan(caseUrl, { runOnly, engineOptions }) {
    const context = await browser.newContext();
    // A request the cache could not answer; the page is not scanned without it.
    let unreachable = null;
    try {
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (!/^https?:/.test(url)) return route.continue();
        try {
          const res = await cachedResponse(url, options);
          const headers = res.contentType ? { 'content-type': res.contentType } : {};
          await route.fulfill({ status: res.status, headers, body: res.body });
        } catch (err) {
          unreachable = unreachable || `${url}: ${err.message}`;
          await route.abort('failed');
        }
      });
      // An init script rather than a script tag: an SVG or MathML test case
      // has no head to add one to.
      await context.addInitScript({ content: bundle });
      const page = await context.newPage();
      await page.goto(caseUrl, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
      await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => {});
      if (unreachable) throw new Error(`could not load ${unreachable}`);
      if (await page.evaluate(() => !!document.getElementById('xml-viewer-style'))) return null;
      return await page.evaluate(
        ({ url, runOnly: only, engineOptions: options }) =>
          window.a11ycore.runa11yCoreInPage(url, null, options, only),
        { url: caseUrl, runOnly, engineOptions }
      );
    } finally {
      await context.close();
    }
  }

  return { scan, version: browser.version(), close: () => browser.close() };
}

module.exports = { openBrowserRunner, cachedResponse };
