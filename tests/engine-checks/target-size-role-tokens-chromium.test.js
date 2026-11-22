'use strict';

/**
 * target-size-minimum reads an element's role as HTML splits the role
 * attribute: on ASCII whitespace only. role="x&nbsp;button" is one token
 * that names no role, so the element is no target (round 11, R11P-2).
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../helpers/browserBundle');

const RULE_ID = 'target-size-minimum';

test(
  `${RULE_ID}: a role split by a non-ASCII space names no role, in Chromium`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const p = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const box = (role, id) =>
      `<div id="${id}" role="${role}" tabindex="0" style="display:inline-block;width:10px;height:10px;margin:0">x</div>`;
    await p.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>T</h1><p>' +
        box('x\u00A0button', 'nbsp') +
        box('\u000Bbutton', 'vt') +
        box('\uFEFFbutton', 'bom') +
        '</p><p style="margin-top:60px">' +
        box('button ', 'b1') +
        box('BUTTON', 'b2') +
        '</p></main></body></html>'
    );
    await addBundle(p);
    const ids = await p.evaluate((id) => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]);
      return r.checksResults[0].occurrences.map((o) => /id="([^"]+)"/.exec(o.html || '')[1]);
    }, RULE_ID);
    assert.deepEqual(ids.sort(), ['b1', 'b2']);
  }
);
