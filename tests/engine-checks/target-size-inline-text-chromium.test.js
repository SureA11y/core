'use strict';

/**
 * target-size-minimum applies SC 2.5.8's inline exception only to a link
 * "in a sentence" (#106): the stretch of its block container between line
 * breaks holds text outside any target with a letter or a digit in it.
 * Pagination, link-only lists and lone links are judged like other
 * targets; links between separators alone, crowded only by each other,
 * are cantTell. Which box is a block container, and where lines break,
 * follows the computed display, so these tests run in Chromium.
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

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

const TEXT = 'font:12px/14px sans-serif;';

// [description, markup, what the rule reports on #t: 'fail', 'cantTell',
// or null for nothing]
const CASES = [
  [
    'pagination, one link per item of a flex list',
    `<ul style="display:flex;gap:2px;list-style:none;padding:0;${TEXT}"><li><a href="/1">1</a></li><li><a id="t" href="/2">2</a></li><li><a href="/3">3</a></li></ul>`,
    'fail'
  ],
  [
    'pagination, inline list items with spaces between',
    `<ul style="list-style:none;padding:0;${TEXT}"><li style="display:inline"><a href="/1">1</a></li> <li style="display:inline"><a id="t" href="/2">2</a></li> <li style="display:inline"><a href="/3">3</a></li></ul>`,
    'fail'
  ],
  [
    'pagination, links with spaces only in a paragraph',
    `<p style="${TEXT}"><a href="/1">1</a> <a id="t" href="/2">2</a> <a href="/3">3</a></p>`,
    'fail'
  ],
  [
    'a list of links, one per item',
    `<ul style="list-style:none;padding:0;${TEXT}"><li><a id="t" href="/p">Privacy</a></li><li><a href="/t">Terms</a></li></ul>`,
    'fail'
  ],
  [
    'a link alone in its paragraph',
    `<div style="${TEXT}"><p style="margin:0"><a id="t" href="/a">Next</a></p><p style="margin:0"><a href="/b">Previous</a></p></div>`,
    'fail'
  ],
  [
    'a link alone on its line after a line break',
    `<p style="${TEXT}">Some text here.<br><a id="t" href="/a">Next</a><br><a href="/b">Previous</a></p>`,
    'fail'
  ],
  [
    'adjacent links in a sentence in a paragraph',
    `<p style="${TEXT}">Read the <a id="t" href="/t">terms</a>,<a href="/p">policy</a> and notes.</p>`,
    null
  ],
  [
    'adjacent links in a sentence in a div',
    `<div style="${TEXT}">Read the <a id="t" href="/t">terms</a>,<a href="/p">policy</a> and notes.</div>`,
    null
  ],
  [
    'adjacent links in a sentence in a table cell',
    `<table style="${TEXT}"><tr><td>See <a id="t" href="/a">this</a>,<a href="/b">that</a> too.</td></tr></table>`,
    null
  ],
  [
    'a link in a sentence inside an emphasis',
    `<p style="${TEXT}">Please <em>read <a id="t" href="/t">this</a></em><a href="/u">now</a>.</p>`,
    null
  ],
  [
    'links between separators alone, crowding each other',
    `<p style="${TEXT}"><a href="/1">1</a>|<a id="t" href="/2">2</a>|<a href="/3">3</a></p>`,
    'cantTell'
  ]
];

test('target-size-minimum exempts links in a sentence only, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, outcome] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Links</title></head><body><main>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'target-size-minimum'
          ]);
          const c = res.checksResults.find((x) => x.ruleId === 'target-size-minimum');
          const o = (c.occurrences || []).find((x) => x.selector === '#t');
          return o ? o.occurrenceOutcome : null;
        });
        assert.equal(r, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
