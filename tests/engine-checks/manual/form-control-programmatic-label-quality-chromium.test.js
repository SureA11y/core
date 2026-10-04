'use strict';

/**
 * form-control-programmatic-label-quality in a real browser, where clip and
 * opacity come from the computed style, including a stylesheet's: a control
 * that isn't drawn on screen has no visible label to judge under 3.3.2.
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

const RULE_ID = 'form-control-programmatic-label-quality';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(head, body) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body>${body}</body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(
          location.href,
          null,
          { rules: { include: id } },
          null
        );
        const c = r.checksResults.find((x) => x.ruleId === id);
        return [c.outcome, c.occurrences.length];
      }, RULE_ID);
    } finally {
      await p.close();
    }
  }

  await t.test('a control clipped or made transparent by a stylesheet is not judged', async () => {
    const css =
      '<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.inv{opacity:0}.cp{clip-path:inset(50%)}</style>';
    for (const body of [
      '<input class="sr" type="checkbox" aria-label="Menu">',
      '<input class="inv" type="checkbox" aria-label="Menu">',
      '<span class="cp"><input type="text" placeholder="Search"></span>'
    ]) {
      assert.deepEqual(await scan(css, body), ['notApplicable', 0], body);
    }
  });

  await t.test('a control drawn on screen named only by aria-label is still flagged', async () => {
    assert.deepEqual(await scan('', '<input type="text" aria-label="Search">'), ['cantTell', 1]);
  });
});
