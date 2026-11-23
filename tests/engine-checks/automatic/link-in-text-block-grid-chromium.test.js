'use strict';

/**
 * link-in-text-block over a grid of the markup that pages really have: each
 * link style (an underline, color alone, bold, a border, an inline-block)
 * beside each kind of surrounding text (plain text, an <abbr>, code chips
 * laid out as inline-blocks, an <em>, a span of another color, an underlined
 * span, a paragraph underlined throughout, another link, no text at all).
 * One page holds every pair, and each link says what it should be judged.
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

const RULE_ID = 'link-in-text-block';
const { addBundle } = require('../../helpers/browserBundle');

const FAIL = 'COLOR_ONLY_DIFFERENTIATION';
const ASK = 'LINK_COLOR_CONTRAST_ONLY';
const PASS = 'pass';

// [name, the link's style, what it is judged in the paragraph underlined
// throughout, what it is judged elsewhere]. A link alone in its block is not
// applicable, so it passes whatever its style.
const LINKS = [
  ['underline (default)', 'color:#1a5fb4', FAIL, PASS],
  // #0000ee against #222222 is about 1.7:1.
  ['no underline, blue', 'text-decoration:none;color:#0000ee', FAIL, FAIL],
  ['no underline, gray', 'text-decoration:none;color:#444444', FAIL, FAIL],
  // #ee0000 against #222222 is about 3.5:1: color alone, which the hover and
  // focus cue (G183) a static scan can't see has to settle.
  ['no underline, 3:1 or more', 'text-decoration:none;color:#ee0000', ASK, ASK],
  ['bold, no underline', 'text-decoration:none;font-weight:700;color:#1a5fb4', PASS, PASS],
  [
    'border-bottom, no underline',
    'text-decoration:none;color:#1a5fb4;border-bottom:1px solid #1a5fb4',
    PASS,
    PASS
  ],
  // A decoration doesn't reach an inline-block, so its underline is its own:
  // in a paragraph underlined throughout, both are underlined.
  ['underline, inline-block', 'display:inline-block;color:#1a5fb4', FAIL, PASS]
];

const A = '{A}';
const CONTEXTS = [
  ['plain text', `Some long surrounding sentence text before ${A} and more text after it.`],
  ['abbr beside', `<abbr title="x">vs.</abbr> some long surrounding sentence ${A} and more text.`],
  [
    'code chips and an abbr',
    `<code>&lt;b&gt;</code> <abbr title="v">vs.</abbr> <code>&lt;strong&gt;</code>: ${A}`
  ],
  ['em beside', `Some long surrounding <em>emphasised</em> sentence ${A} and more text after it.`],
  [
    'span of another color',
    `Some long surrounding <span style="color:#c00">red words</span> sentence ${A} and more text.`
  ],
  [
    'underlined span',
    `<span style="text-decoration:underline">Some long underlined words</span> ${A} more.`
  ],
  [
    'paragraph underlined throughout',
    `<span class="u">Some long surrounding sentence ${A} and more text after it.</span>`,
    true
  ],
  [
    'another link beside',
    `Some long text <a href="#o" style="color:#1a5fb4">other</a> and ${A} and more text here.`
  ],
  ['no text around', A, false, true]
];

test(`${RULE_ID} over a grid of links and surrounding text, in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());

  const cases = [];
  let body = '';
  for (const [contextName, markup, underlinedThroughout, alone] of CONTEXTS) {
    for (const [linkName, style, inUnderlined, elsewhere] of LINKS) {
      const n = cases.length;
      const link = `<a href="#t${n}" data-case="${n}" style="${style}">link text number ${n}</a>`;
      const own = underlinedThroughout ? 'text-decoration:underline;' : '';
      body += `<p style="${own}color:#222222">${markup.replace(A, link)}</p>\n`;
      const expected = alone ? PASS : underlinedThroughout ? inUnderlined : elsewhere;
      cases.push({ name: `${contextName} / ${linkName}`, expected });
    }
  }

  await page.setContent(
    '<!doctype html><html lang="en"><head><title>grid</title><style>' +
      'body{background:#ffffff;color:#222222;font:16px sans-serif}' +
      'code{display:inline-block;padding:2px 4px;background:#efedf1;color:#b62323}' +
      '.u{text-decoration:underline}' +
      `</style></head><body><main>${body}</main></body></html>`
  );
  await addBundle(page);
  const found = await page.evaluate((id) => {
    const r = window.a11ycore.runa11yCoreInPage(
      location.href,
      null,
      { rules: { include: id } },
      null
    );
    const c = r.checksResults.find((x) => x.ruleId === id);
    const byCase = {};
    for (const o of c.occurrences) {
      const m = /data-case="(\d+)"/.exec(o.html || '');
      if (m) byCase[m[1]] = o.data && o.data.details && o.data.details.reasonCode;
    }
    return byCase;
  }, RULE_ID);

  const wrong = [];
  cases.forEach((c, n) => {
    const got = found[n] || PASS;
    if (got !== c.expected) wrong.push(`${c.name}: expected ${c.expected}, got ${got}`);
  });
  assert.deepEqual(wrong, [], `${wrong.length} of ${cases.length} links judged differently`);
  assert.equal(cases.length, CONTEXTS.length * LINKS.length);
});
