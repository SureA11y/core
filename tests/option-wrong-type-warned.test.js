'use strict';

// ENGINE_OPTIONS.md: "Always, a value of the wrong type is warned about and
// read as not given". Without strictOptions, only the on/off options and the
// options whose own reading warns said so; twenty others were dropped
// without a word, nine of them changing what the scan reports (output.detail
// 'finding' gave the full output, contrast.mode 'auditor' strict mode, a
// string excludeSelectors excluded nothing). Each now warns once, from both
// entry points, and is still read as not given.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1></main></body></html>';

const CASES = {
  locale: { locale: 5 },
  mappings: { mappings: 5 },
  messages: { messages: 'x' },
  excludeSelectors: { excludeSelectors: 5 },
  contrast: { contrast: 'auditorAssist' },
  'contrast.mode': { contrast: { mode: 'auditor' } },
  'contrast.rootCanvasFallback': { contrast: { rootCanvasFallback: 5 } },
  'contrast.rootCanvasFallbackSet': { contrast: { rootCanvasFallbackSet: 'maybe' } },
  visibilityMode: { visibilityMode: 'geometry' },
  policyContract: { policyContract: 5 },
  'policyContract.id': { policyContract: { id: 5 } },
  policy: { policy: 'x' },
  'policy.allowedOutcomes': { policy: { allowedOutcomes: 'fail' } },
  output: { output: 'findings' },
  'output.detail': { output: { detail: 'finding' } },
  rules: { rules: 5 },
  'rules.include': { rules: { include: 5 } },
  tags: { tags: 5 },
  tests: { tests: 5 },
  pingWaitTime: { pingWaitTime: -1 },
  frameWaitTime: { frameWaitTime: 'x' },
  // Already said, by the option's own reading: still said once.
  wcagVersion: { wcagVersion: 3 },
  profile: { profile: 5 },
  includeMode: { includeMode: 'xor' },
  perfStats: { perfStats: 'maybe' }
};

function warningsFor(engineOptions) {
  const warnings = [];
  const warn = console.warn;
  const info = console.info;
  console.warn = (...a) => warnings.push(a.join(' '));
  console.info = () => {};
  try {
    // Both entry points run, so a warning lost in the page would show here.
    runa11yCoreOnHtml(PAGE, { engineOptions, runOnly: ['page-title-present'] });
  } finally {
    console.warn = warn;
    console.info = info;
  }
  return warnings.filter((w) => w.startsWith('[surea11y]'));
}

for (const [path, engineOptions] of Object.entries(CASES)) {
  test(`a wrong-typed ${path} is warned about once in each entry point`, () => {
    const warnings = warningsFor(engineOptions);
    const name = path.split('.')[0];
    assert.equal(warnings.length, 2, JSON.stringify(warnings));
    for (const w of warnings) assert.ok(w.includes(name), w);
  });
}

test('a wrong-typed option is still read as not given', () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const result = runa11yCoreOnHtml(PAGE, {
      engineOptions: { output: { detail: 'finding' } },
      runOnly: ['page-title-present'],
      entryPointParity: false
    });
    assert.notEqual(result.engine.outputDetail, 'findings');
  } finally {
    console.warn = warn;
  }
});
