'use strict';

// Engine code is written into the generated core and the browser bundle as
// source (a function's toString()), so it can't read a name its module
// defines outside it: the copy that runs in the page has no such name, and
// throws "X is not defined" at scan time, while the module, which tests
// under Node load, still works. RULE_AUTHORING's "free-variable footgun" for
// rules; the lint plugin's self-contained rule covers those. This covers
// the engine's own code: the built files read no name they don't define,
// beyond the browser's and Node's globals.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('the generated core and the browser bundle read no undefined name', async () => {
  const { ESLint } = require('eslint');
  const globals = require('globals');
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.js'],
        linterOptions: { noInlineConfig: true },
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'script',
          globals: { ...globals.browser, ...globals.node }
        },
        rules: { 'no-undef': 'error' }
      }
    ]
  });
  const files = ['src/core.js', 'surea11y.browser.js'].map((f) => path.join(ROOT, f));
  const problems = (await eslint.lintFiles(files)).flatMap((r) =>
    r.messages
      .filter((m) => m.ruleId === 'no-undef')
      .map((m) => `${path.relative(ROOT, r.filePath)}:${m.line}: ${m.message}`)
  );
  assert.deepEqual(problems, []);
});
