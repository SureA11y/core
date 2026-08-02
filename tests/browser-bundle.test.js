'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');

const { runa11yCoreInPage, ENGINE_TAG, SCHEMA_VERSION, CHECK_DEFS } = require('../src/core.js');
const tagsById = Object.fromEntries(CHECK_DEFS.map((d) => [d.ruleId, d.tags || []]));

const BUNDLE_PATH = path.join(__dirname, '..', 'surea11y.browser.js');
const bundleSource = fs.readFileSync(BUNDLE_PATH, 'utf8');
const BUNDLE_FILE_URL = pathToFileURL(BUNDLE_PATH).href;

// Loads a page with a REAL `<script src="...">` tag pointing at the actual
// built file on disk -- fetched by jsdom's own resource loader, not just
// injected as inline text -- so this exercises exactly the instruction
// README.md/docs/INTEGRATION.md give consumers
// (`<script src="node_modules/@surea11y/core/surea11y.browser.js">`), not
// an approximation of it. Async because a `src`-loaded script (unlike
// inline `textContent`) only runs once jsdom has actually fetched it.
function loadBundleViaScriptTag(html, pageUrl) {
  const htmlWithScript = html.replace(
    '</body>',
    `<script src="${BUNDLE_FILE_URL}"></script></body>`
  );

  return new Promise((resolve, reject) => {
    const dom = new JSDOM(htmlWithScript, {
      url: pageUrl,
      runScripts: 'dangerously',
      resources: 'usable'
    });

    dom.window.addEventListener('load', () => resolve(dom));
    dom.window.addEventListener('error', (event) =>
      reject(event.error || new Error('window error event'))
    );
  });
}

test('bundle contains no Node-only globals (require/module/exports)', () => {
  // The whole point of this bundle is to be droppable into a plain <script>
  // tag with no bundler and no Node runtime underneath it. Any of these
  // would throw ReferenceError in that environment.
  assert.equal(/\brequire\s*\(/.test(bundleSource), false, 'bundle must not call require()');
  assert.equal(
    /\bmodule\.exports\b/.test(bundleSource),
    false,
    'bundle must not use module.exports'
  );
  assert.equal(/\bexports\./.test(bundleSource), false, 'bundle must not use the exports object');
});

test('a real <script src="..."> pointing at the built file defines window.a11ycore', async () => {
  const dom = await loadBundleViaScriptTag(
    '<!doctype html><html><head><title>T</title></head><body><img src="x"></body></html>',
    'https://example.test/'
  );

  assert.equal(typeof dom.window.a11ycore, 'object');
  assert.equal(typeof dom.window.a11ycore.runa11yCoreInPage, 'function');
  assert.equal(dom.window.a11ycore.ENGINE_TAG, ENGINE_TAG);
  assert.equal(dom.window.a11ycore.SCHEMA_VERSION, SCHEMA_VERSION);

  dom.window.close();
});

test('the bundle loaded via <script src="..."> runs a real scan and catches a real violation', async () => {
  const dom = await loadBundleViaScriptTag(
    '<!doctype html><html><head><title>T</title></head><body><img src="x"></body></html>',
    'https://example.test/'
  );

  const result = dom.window.a11ycore.runa11yCoreInPage(null, null, {}, null);

  assert.ok(result);
  assert.equal(result.url, 'https://example.test/');
  assert.ok(Array.isArray(result.checksResults));
  assert.ok(result.checksResults.length > 0);

  const imgAlt = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.ok(imgAlt, 'expected img-alt-present in the bundled scan results');
  assert.equal(imgAlt.outcome, 'fail');

  dom.window.close();
});

test('the bundle loaded via <script src="..."> honors contextSelector/excludeSelectors/runOnly.tags, matching README\'s advanced example', async () => {
  const html = `<!doctype html><html><head><title>T</title></head><body>
    <div id="cookie-banner"><img src="x"></div>
    <main id="main"><img src="x"></main>
  </body></html>`;

  const dom = await loadBundleViaScriptTag(html, 'https://example.test/');

  const result = dom.window.a11ycore.runa11yCoreInPage(
    'https://example.test/',
    '#main',
    { excludeSelectors: ['#cookie-banner'] },
    { tags: ['wcag2a', 'wcag2aa'] }
  );

  dom.window.close();

  // contextSelector scoped the scan to #main: only one img-alt-present
  // occurrence should surface, not two (the excluded cookie-banner img
  // would be a second one if either contextSelector or excludeSelectors
  // silently failed to apply through the bundle).
  const imgAlt = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.ok(imgAlt);
  assert.equal(imgAlt.outcome, 'fail');
  assert.equal(
    imgAlt.occurrences.length,
    1,
    'contextSelector/excludeSelectors should leave exactly one occurrence'
  );

  // runOnly.tags restricted the run to WCAG 2.0 A/AA rules only -- every
  // returned check must actually carry one of those tags (proves the
  // filter reached the engine through the bundle, not just "didn't crash").
  assert.ok(result.checksResults.length > 0);
  for (const check of result.checksResults) {
    const tags = tagsById[check.ruleId] || [];
    assert.ok(
      tags.includes('wcag2a') || tags.includes('wcag2aa'),
      `${check.ruleId} was returned but doesn't carry wcag2a/wcag2aa (tags: ${tags.join(', ')})`
    );
  }
});

test("the bundle's scan result matches the Node-required runa11yCoreInPage for the same page and options", async () => {
  const html =
    '<!doctype html><html><head><title>T</title></head><body><img src="x"></body></html>';
  const url = 'https://example.test/';
  const engineOptions = {
    excludeSelectors: ['.does-not-exist'],
    contrast: { mode: 'auditorAssist' }
  };
  const runOnly = { tags: ['wcag2a', 'wcag2aa'] };

  const dom = await loadBundleViaScriptTag(html, url);
  const bundledResult = dom.window.a11ycore.runa11yCoreInPage(url, null, engineOptions, runOnly);
  dom.window.close();

  // Run the same scan, same options, through the normal Node require() path
  // against an equivalent jsdom document, to confirm the extraction into
  // the browser bundle didn't silently diverge from the real engine --
  // including how it handles engineOptions/runOnly, not just the defaults.
  const referenceDom = new JSDOM(html, { url, pretendToBeVisual: true });
  global.window = referenceDom.window;
  global.document = referenceDom.window.document;
  const referenceResult = runa11yCoreInPage(url, null, engineOptions, runOnly);
  referenceDom.window.close();
  delete global.window;
  delete global.document;

  const outcomesById = (result) =>
    Object.fromEntries(result.checksResults.map((r) => [r.ruleId, r.outcome]));

  assert.deepEqual(outcomesById(bundledResult), outcomesById(referenceResult));
});
