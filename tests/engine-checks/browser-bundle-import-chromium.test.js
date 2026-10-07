'use strict';

/**
 * The browser bundle imported through a bundler, in a real browser
 * (#139). It only set window.a11ycore, so esbuild handed an import of
 * @surea11y/core/browser an empty object. Its API is now also the
 * module's export: default, named and namespace imports and require()
 * each get it, and a scan through it runs, while the global stays.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
const esbuild = require('esbuild');

const SPEC = '@surea11y/core/browser';
const ENTRIES = {
  'a default import': `import a11ycore from '${SPEC}'; window.__scan = a11ycore.runa11yCoreInPage;`,
  'a named import': `import { runa11yCoreInPage } from '${SPEC}'; window.__scan = runa11yCoreInPage;`,
  'a namespace import': `import * as ns from '${SPEC}'; window.__scan = ns.runa11yCoreInPage;`,
  'require()': `window.__scan = require('${SPEC}').runa11yCoreInPage;`
};

test('the browser bundle imported through esbuild, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [name, contents] of Object.entries(ENTRIES)) {
    for (const format of ['iife', 'esm']) {
      await t.test(`${name}, ${format} output`, async () => {
        const app = esbuild.buildSync({
          stdin: { contents, resolveDir: path.join(__dirname, '../..'), loader: 'js' },
          bundle: true,
          format,
          write: false,
          logLevel: 'silent'
        }).outputFiles[0].text;
        const page = await browser.newPage();
        try {
          await page.setContent(
            '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
          );
          await page.addScriptTag({ content: app, type: format === 'esm' ? 'module' : undefined });
          await page.waitForFunction(() => 'a11ycore' in window);
          const r = await page.evaluate(() => ({
            scan:
              typeof window.__scan === 'function'
                ? window.__scan(null, null, {}, ['img-alt-present']).checksResults[0].outcome
                : null,
            global: typeof window.a11ycore.runa11yCoreInPage
          }));
          assert.deepEqual(r, { scan: 'fail', global: 'function' });
        } finally {
          await page.close();
        }
      });
    }
  }
});
