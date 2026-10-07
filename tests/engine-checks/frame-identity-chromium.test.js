'use strict';

/**
 * Which <iframe> a cross-frame entry is, in a real browser (#132). Each
 * entry names its frame element with a selector and its title, so frames
 * loading the same document can be told apart, and a frame that has not
 * navigated (here, one whose server never answers) is reported with the
 * URL it was given rather than about:blank.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

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

const TOP = `<!doctype html><html lang="en"><head><title>top</title></head><body><main>
  <div id="ads"><iframe title="Advertisement" src="/child"></iframe></div>
  <iframe id="player" title="Video player" src="/child"></iframe>
  <iframe src="/child"></iframe>
  <iframe title="Pending" src="/never"></iframe>
</main></body></html>`;
const CHILD =
  '<!doctype html><html lang="en"><head><title>child</title></head><body><main><p>Child</p></main></body></html>';

test('cross-frame entries name their frame element, in Chromium', { skip }, async (t) => {
  const server = http.createServer((req, res) => {
    if (req.url === '/never') return; // never answers
    res.setHeader('content-type', 'text/html');
    res.end(req.url === '/child' ? CHILD : TOP);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath });
  t.after(async () => {
    await browser.close();
    server.closeAllConnections();
    server.close();
  });

  const page = await browser.newPage();
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    [...document.querySelectorAll('iframe[src="/child"]')].every(
      (f) =>
        f.contentDocument &&
        f.contentDocument.readyState === 'complete' &&
        f.contentWindow.location.pathname === '/child'
    )
  );
  for (const frame of page.frames().slice(1)) {
    if (!frame.url().endsWith('/child')) continue;
    await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
  }
  await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

  const entries = await page.evaluate(() =>
    window
      .runa11yCoreAcrossFrames(null, null, { pingWaitTime: 300 }, ['img-alt-present'])
      .then((r) =>
        r.frames.map((f) => ({
          url: f.url,
          selector: f.selector,
          title: f.title,
          scanned: !!f.topFrame,
          matches: document.querySelectorAll(f.selector).length
        }))
      )
  );

  assert.deepEqual(entries, [
    {
      url: origin + '/child',
      selector: '#ads > iframe',
      title: 'Advertisement',
      scanned: true,
      matches: 1
    },
    {
      url: origin + '/child',
      selector: '#player',
      title: 'Video player',
      scanned: true,
      matches: 1
    },
    {
      url: origin + '/child',
      selector: 'html > body > main > iframe:nth-of-type(2)',
      title: null,
      scanned: true,
      matches: 1
    },
    {
      url: origin + '/never',
      selector: 'html > body > main > iframe:nth-of-type(3)',
      title: 'Pending',
      scanned: false,
      matches: 1
    }
  ]);
});
