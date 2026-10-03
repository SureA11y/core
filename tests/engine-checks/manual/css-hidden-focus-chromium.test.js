'use strict';

/**
 * css-hidden-focus in a real browser, which restyles an element when it
 * takes focus: the rule's focus probe leaves focus where it found it, so
 * the rules after it and the next scan see the page as it was, and a
 * GOV.UK-style skip link, hidden by `:not(:focus):not(.\\:focus)`, is
 * recognised as revealed on focus.
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

const RULE_ID = 'css-hidden-focus';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

const HIDE =
  'position:absolute!important;width:1px!important;height:1px!important;margin:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important';
const page = (selector) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>${selector}{${HIDE}}</style></head><body>` +
  '<a id="skip" class="skip" href="#main">Skip to main content</a><main id="main"><h1>Title</h1></main></body></html>';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function open(html) {
    const p = await browser.newPage();
    await p.setContent(html);
    await p.addScriptTag({ content: BUNDLE });
    return p;
  }
  const scan = (p, engineOptions) =>
    p.evaluate(
      ([id, opts]) => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, opts, null);
        const own = r.checksResults.find((c) => c.ruleId === id);
        return {
          findings: own ? own.occurrences.map((o) => o.selector) : null,
          focused: document.activeElement && document.activeElement.id
        };
      },
      [RULE_ID, engineOptions]
    );

  await t.test('focus is left where it was, so a second scan agrees with the first', async () => {
    // Hidden at rest, not revealed on focus by any rule: asked about.
    const p = await open(page('.skip'));
    try {
      const first = await scan(p, { rules: { include: RULE_ID } });
      assert.deepEqual(first.findings, ['#skip']);
      assert.equal(first.focused, '', 'nothing is left focused');
      assert.deepEqual(await scan(p, { rules: { include: RULE_ID } }), first);
      // A full scan leaves nothing focused either, for the rules after it.
      assert.equal((await scan(p, {})).focused, '');
    } finally {
      await p.close();
    }
  });

  await t.test('a GOV.UK-style skip link revealed on focus is not asked about', async () => {
    const p = await open(page('.skip:not(:active):not(:focus):not(.\\:focus)'));
    try {
      assert.deepEqual(await scan(p, { rules: { include: RULE_ID } }), {
        findings: [],
        focused: ''
      });
    } finally {
      await p.close();
    }
  });
});
