'use strict';

/**
 * @surea11y/core/eslint-plugin (src/eslint-plugin.js): its recommended config
 * holds a pack's rule to what core's rules are held to, and an
 * eslint-disable comment under the plugin's name turns a rule off.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { Linter } = require('eslint');

const safeDom = require('@surea11y/core/eslint-plugin');

function lint(code) {
  const linter = new Linter({ configType: 'flat' });
  return linter
    .verify(
      code,
      [
        { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' } },
        { files: ['**/*.js'], ...safeDom.configs.recommended }
      ],
      'rule.js'
    )
    .map((m) => m.ruleId);
}

test('the recommended config flags what core flags in its own rules', () => {
  const code = `
    module.exports = {
      runInPage(ctx) {
        const el = ctx.document.querySelector('[role="button"]');
        const parent = el.parentNode;
        const role = el.getAttribute('role');
        const { dom } = ctx.helpers;
        const target = dom.getElementById(document, 'x');
        return { outcome: parent && role && target ? 'pass' : 'fail' };
      }
    };`;
  assert.deepEqual(lint(code).sort(), [
    'safe-dom/no-raw-role',
    'safe-dom/no-raw-role',
    'safe-dom/tree-scoped-ids',
    'safe-dom/use-safe-dom', // querySelector
    'safe-dom/use-safe-dom', // parentNode
    'safe-dom/use-safe-dom' // getAttribute
  ]);
});

test('a rule written with the safe helpers passes, and a comment can turn a rule off', () => {
  const code = `
    module.exports = {
      runInPage(ctx) {
        const { dom, aria } = ctx.helpers;
        const el = dom.querySelector(ctx.document, '[role~="button" i]');
        const parent = dom.parentNode(el);
        const role = aria.getExplicitRole(el);
        // eslint-disable-next-line safe-dom/no-raw-role -- the text for a message
        const text = dom.getAttribute(el, 'role');
        return { outcome: parent && role && text ? 'pass' : 'fail' };
      }
    };`;
  assert.deepEqual(lint(code), []);
});

test('the plugin names itself and its version', () => {
  assert.equal(safeDom.meta.name, '@surea11y/core/eslint-plugin');
  assert.equal(safeDom.meta.version, require('../../package.json').version);
  assert.deepEqual(Object.keys(safeDom.rules), [
    'no-raw-role',
    'tree-scoped-ids',
    'self-contained',
    'use-safe-dom'
  ]);
});

test("self-contained flags what a rule's page code reads from outside it", () => {
  const outside = (code) =>
    new Linter({ configType: 'flat' })
      .verify(
        code,
        [
          { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' } },
          { files: ['**/*.js'], ...safeDom.configs.recommended }
        ],
        'rule.js'
      )
      .filter((m) => m.ruleId === 'safe-dom/self-contained')
      .map((m) => /reads "([^"]+)"/.exec(m.message)[1]);
  // Read from outside: a module constant, a helper function, a require, in
  // every way runInPage and applicability are written.
  assert.deepEqual(
    outside(`
    const GENERIC = ['click here'];
    function lower(s) { return s.toLowerCase(); }
    const path = require('path');
    function runInPage(ctx) { return { outcome: GENERIC.includes(lower(ctx.x)) ? 'fail' : 'pass' }; }
    module.exports = {
      id: 'p-a', runInPage,
      applicability: (ctx) => !!path,
      variant: { runInPage(ctx) { return GENERIC; } }
    };
    class R { applicability() { return GENERIC.length > 0; } }
    const runInPage2 = 1; void runInPage2; void R;`),
    ['GENERIC', 'lower', 'path', 'GENERIC', 'GENERIC']
  );
  // Inside, the context, page globals and a recursive call are fine.
  assert.deepEqual(
    outside(`
    module.exports = {
      runInPage(ctx) {
        const GENERIC = ['click here'];
        const lower = (s) => s.toLowerCase();
        const walk = (n) => (n ? walk(n.next) : 0);
        return { outcome: GENERIC.includes(lower(document.title)) && walk(ctx) ? 'fail' : 'pass' };
      }
    };`),
    []
  );
});
