'use strict';

/**
 * Link names from CSS generated content (accname 2F.ii) in a real browser:
 * jsdom computes no ::before or ::after styles.
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

const { addBundle } = require('../../helpers/browserBundle');
const RULES = ['link-name-quality', 'identical-links-same-purpose'];

test('link names from generated content in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(css, body) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title><style>${css}</style></head><body><main>${body}</main></body></html>`
      );
      await addBundle(p);
      const result = await p.evaluate(
        (ids) => window.a11ycore.runa11yCoreInPage(null, null, {}, ids),
        RULES
      );
      const out = {};
      for (const r of result.checksResults) out[r.ruleId] = r;
      return out;
    } finally {
      await p.close();
    }
  }

  await t.test('::before text names a link ahead of its title', async () => {
    const r = await scan(
      '.b::before { content: "Annual report 2025" }',
      '<a class="b" href="/x" title="Read more"></a>'
    );
    assert.equal(r['link-name-quality'].outcome, 'notApplicable');
  });

  await t.test('generic ::before text is asked about despite a descriptive title', async () => {
    const r = await scan(
      '.c::before { content: "Read more" }',
      '<a class="c" href="/x" title="Annual report 2025"></a>'
    );
    assert.equal(r['link-name-quality'].outcome, 'cantTell');
    assert.equal(r['link-name-quality'].occurrences[0].data.details.normalizedName, 'read more');
  });

  await t.test('::after text completes a generic link text', async () => {
    const r = await scan(
      '.d::after { content: " about the annual report" }',
      '<a class="d" href="/x">Read more</a>'
    );
    assert.equal(r['link-name-quality'].outcome, 'notApplicable');
  });

  await t.test('the alternative text after "/" is the name', async () => {
    const r = await scan(
      '.e::before { content: "\\2192" / "Read more" }',
      '<a class="e" href="/x" title="Annual report"></a>'
    );
    assert.equal(r['link-name-quality'].outcome, 'cantTell');
    assert.equal(r['link-name-quality'].occurrences[0].data.details.normalizedName, 'read more');
  });

  await t.test('an empty alternative gives no text, so the title names the link', async () => {
    const r = await scan(
      '.f::before { content: url(arrow.png) / "" }',
      '<a class="f" href="/x" title="Read more"></a>'
    );
    assert.equal(r['link-name-quality'].outcome, 'cantTell');
  });

  await t.test('an icon-font glyph is content, so the title does not name the link', async () => {
    const r = await scan(
      '.g::before { content: "\\e900" }',
      '<a class="g" href="/x" title="Read more"></a>'
    );
    assert.equal(r['link-name-quality'].outcome, 'notApplicable');
  });

  await t.test('links named by different ::before text are not grouped', async () => {
    const r = await scan(
      '.h1::before { content: "Annual report" } .h2::before { content: "Budget" }',
      '<a class="h1" href="/a" title="Read more"></a><a class="h2" href="/b" title="Read more"></a>'
    );
    assert.equal(r['identical-links-same-purpose'].outcome, 'notApplicable');
  });
});
