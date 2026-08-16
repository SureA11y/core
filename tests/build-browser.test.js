'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractInPageRunnerSource,
  readEngineConstants,
  generateBrowserBundle,
  generateLocaleSideFile
} = require('../scripts/build-browser.js');

// A minimal, synthetic stand-in for src/core.js's real shape -- exercises
// the marker-based extraction logic in isolation, without depending on (or
// risking corrupting) the real ~3MB generated file. The two markers the
// real script searches for are the runa11yCoreInPage function SIGNATURE
// itself (start) and the cross-frame BANNER COMMENT text (end) -- not the
// in-page banner comment, which is decorative only.
function fakeCoreSource({ includeInPageSignature = true, includeCrossFrameBanner = true } = {}) {
  const inPageFn = includeInPageSignature
    ? 'function runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly) {\n  return { url: pageUrl, checksResults: [] };\n}'
    : 'function renamedForThisTest(pageUrl, contextSelector, engineOptions, runOnly) {\n  return { url: pageUrl, checksResults: [] };\n}';

  const crossFrameBanner = includeCrossFrameBanner
    ? '// SELF-CONTAINED cross-frame scanning for the "plain script injection"'
    : '// (banner removed for this test)';

  return `'use strict';

const ENGINE_TAG = "a11ycore";
const SCHEMA_VERSION = "1.0.0";

function runDomRulesInPage(pageUrl) {
  return { fake: true };
}

// =======================
// SELF-CONTAINED in-page runner for page.evaluate
// =======================
${inPageFn}

// =======================
${crossFrameBanner}
// consumption mode (see the comment above crossFrameRunnerSource's own
// definition earlier in this file for the full reasoning).
// =======================
const __a11yCoreCrossFrameApi = (function () { return {}; })();

module.exports = {
  ENGINE_TAG,
  SCHEMA_VERSION,
  runDomRulesInPage,
  runa11yCoreInPage
};
`;
}

test('extractInPageRunnerSource pulls out exactly the runa11yCoreInPage function body', () => {
  const source = extractInPageRunnerSource(fakeCoreSource());

  assert.match(
    source,
    /^function runa11yCoreInPage\(pageUrl, contextSelector, engineOptions, runOnly\) \{/
  );
  assert.match(source, /\}\s*$/);
  assert.equal(
    source.includes('runDomRulesInPage'),
    false,
    'must not include the Node-only section before it'
  );
  assert.equal(
    source.includes('__a11yCoreCrossFrameApi'),
    false,
    'must not include the cross-frame section after it'
  );
  assert.equal(source.includes('SELF-CONTAINED'), false, 'must not include either marker banner');
});

test('extractInPageRunnerSource throws a clear error if the runa11yCoreInPage signature is missing', () => {
  assert.throws(
    () => extractInPageRunnerSource(fakeCoreSource({ includeInPageSignature: false })),
    /could not locate runa11yCoreInPage/
  );
});

test('extractInPageRunnerSource throws a clear error if the cross-frame banner is missing', () => {
  assert.throws(
    () => extractInPageRunnerSource(fakeCoreSource({ includeCrossFrameBanner: false })),
    /could not locate runa11yCoreInPage/
  );
});

test('readEngineConstants reads ENGINE_TAG/SCHEMA_VERSION as written by build-core.js', () => {
  const { engineTag, schemaVersion } = readEngineConstants(fakeCoreSource());
  assert.equal(engineTag, '"a11ycore"');
  assert.equal(schemaVersion, '"1.0.0"');
});

test('readEngineConstants throws a clear error if the constants are missing', () => {
  const source = fakeCoreSource().replace('const ENGINE_TAG = "a11ycore";\n', '');
  assert.throws(() => readEngineConstants(source), /could not read ENGINE_TAG\/SCHEMA_VERSION/);
});

test('generateBrowserBundle produces a self-executing IIFE assigning window.a11ycore, no Node globals', () => {
  const bundle = generateBrowserBundle(fakeCoreSource());

  assert.match(bundle, /^\(function \(global\) \{/m);
  assert.match(bundle, /global\.a11ycore = \{/);
  assert.match(bundle, /runa11yCoreInPage: function \(/);
  assert.match(bundle, /registerMessages: function \(/);
  assert.equal(/\brequire\s*\(/.test(bundle), false);
  assert.equal(/\bmodule\.exports\b/.test(bundle), false);
});

test('generateLocaleSideFile registers its dictionary and refuses to run alone', () => {
  const side = generateLocaleSideFile('de', { a: 'Ä' });

  assert.match(side, /^\/\* SPDX-License-Identifier: MPL-2\.0 \*\//);
  assert.match(side, /registerMessages\("de", \{"a":"Ä"\}\)/);
  assert.deepEqual(JSON.parse(side.match(/registerMessages\("de", (\{.*\})\)/)[1]), { a: 'Ä' });
  assert.match(side, /load surea11y\.browser\.js first/);
  assert.equal(/\brequire\s*\(/.test(side), false);
});

test('generateLocaleSideFile escapes a dictionary value that could close the script', () => {
  const side = generateLocaleSideFile('de', { a: '</script><script>x()' });
  const call = side.split('\n').find((l) => l.includes('registerMessages('));

  assert.equal(call.includes('</script>'), false);
  assert.match(call, /\\u003c\/script>/);
});
