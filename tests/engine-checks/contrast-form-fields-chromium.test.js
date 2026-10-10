'use strict';

/**
 * The text a form field shows is measured (#103): an <input>'s value, a
 * <textarea>'s current value, and, while the value is empty, the
 * placeholder, in the ::placeholder color, font, opacity and background.
 * WCAG 1.4.3 applies to text in the page, "including placeholder text"
 * (Understanding 1.4.3). The browser draws this text inside the field, not
 * from text nodes, and only a browser computes the ::placeholder style, so
 * these tests run in Chromium.
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

const ph = (css) => `<style>#f::placeholder{${css}}</style>`;

// [description, markup, text to type into #f or null, contrast-minimum
// outcome, contrast-enhanced ratio, or the contrast-computable reason]
const CASES = [
  [
    'a value at #ccc',
    '<input id="f" aria-label="f" value="Typed value" style="color:#ccc">',
    null,
    'fail',
    1.61
  ],
  [
    'a value at #333',
    '<input id="f" aria-label="f" value="Typed value" style="color:#333">',
    null,
    'pass',
    null
  ],
  [
    'text typed by the user at #ccc',
    '<input id="f" aria-label="f" style="color:#ccc">',
    'Typed value',
    'fail',
    1.61
  ],
  [
    'an email, at #ccc',
    '<input id="f" type="email" aria-label="f" value="a@b.co" style="color:#ccc">',
    null,
    'fail',
    1.61
  ],
  [
    'a password, at #ccc',
    '<input id="f" type="password" aria-label="f" value="secret" style="color:#ccc">',
    null,
    'fail',
    1.61
  ],
  [
    'a date, at #ccc',
    '<input id="f" type="date" aria-label="f" value="2026-10-06" style="color:#ccc">',
    null,
    'fail',
    1.61
  ],
  [
    'a textarea typed into, at #ccc',
    '<textarea id="f" aria-label="f" style="color:#ccc"></textarea>',
    'Typed value',
    'fail',
    1.61
  ],
  // What a textarea shows is its current value, not its starting text.
  [
    'a textarea whose text was replaced',
    '<textarea id="f" aria-label="f" style="color:#ccc">Start</textarea>',
    '',
    'notApplicable',
    null
  ],
  [
    'the default placeholder color (#757575)',
    '<input id="f" aria-label="f" placeholder="Search">',
    null,
    'pass',
    null
  ],
  [
    'a placeholder at #ccc',
    `${ph('color:#ccc')}<input id="f" aria-label="f" placeholder="Search">`,
    null,
    'fail',
    1.61
  ],
  [
    'a placeholder at #ccc in a textarea',
    `${ph('color:#ccc')}<textarea id="f" aria-label="f" placeholder="Notes"></textarea>`,
    null,
    'fail',
    1.61
  ],
  [
    'a placeholder at #ccc hidden by a dark value',
    `${ph('color:#ccc')}<input id="f" aria-label="f" placeholder="Search" value="ok" style="color:#000">`,
    null,
    'pass',
    null
  ],
  [
    'a black placeholder at opacity 0.3',
    `${ph('color:#000;opacity:.3')}<input id="f" aria-label="f" placeholder="Search">`,
    null,
    'fail',
    2.1
  ],
  [
    'a white placeholder on a black placeholder background',
    `${ph('color:#fff;background:#000')}<input id="f" aria-label="f" placeholder="Search">`,
    null,
    'pass',
    null
  ],
  // #949494 is 3.03:1: enough for large text, which 24px bold is.
  [
    'a large bold placeholder at #949494',
    `${ph('color:#949494;font-size:24px;font-weight:700')}<input id="f" aria-label="f" placeholder="Search">`,
    null,
    'pass',
    3.03
  ],
  [
    'a placeholder with a shadow',
    `${ph('color:#ccc;text-shadow:0 0 2px #000')}<input id="f" aria-label="f" placeholder="Search">`,
    null,
    'notApplicable',
    'TEXT_SHADOW'
  ],
  [
    'a placeholder on a gradient',
    `${ph('background:linear-gradient(#000,#fff)')}<input id="f" aria-label="f" placeholder="Search">`,
    null,
    'notApplicable',
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  // A date field shows no placeholder.
  [
    'an empty date field with a placeholder',
    `${ph('color:#ccc')}<input id="f" type="date" aria-label="f" placeholder="Date">`,
    null,
    'notApplicable',
    null
  ],
  [
    'a disabled field at #ccc',
    '<input id="f" disabled aria-label="f" value="Typed value" style="color:#ccc">',
    null,
    'notApplicable',
    null
  ],
  [
    'a checkbox at #ccc',
    '<input id="f" type="checkbox" aria-label="f" value="Typed value" style="color:#ccc">',
    null,
    'notApplicable',
    null
  ]
];

test('the text a form field shows, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, typed, outcome, expected] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Form</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
        );
        if (typed !== null) await page.fill('#f', typed);
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'contrast-minimum',
            'contrast-enhanced',
            'contrast-computable'
          ]);
          const byId = (id) => res.checksResults.find((c) => c.ruleId === id);
          const onField = (c) => (c.occurrences || []).find((o) => o.selector === '#f');
          const enh = onField(byId('contrast-enhanced'));
          const comp = onField(byId('contrast-computable'));
          return {
            outcome: byId('contrast-minimum').outcome,
            ratio: enh ? enh.data.details.metrics.ratio : null,
            reason: comp ? comp.data.details.reasonCode : null
          };
        });
        assert.equal(r.outcome, outcome);
        if (typeof expected === 'number') {
          assert.equal(Number(r.ratio.toFixed(2)), expected);
        } else if (typeof expected === 'string') {
          assert.equal(r.reason, expected);
        } else {
          // At 7:1 or more, or with no text, nothing is reported on the field.
          assert.equal(r.ratio, null);
          assert.equal(r.reason, null);
        }
      } finally {
        await page.close();
      }
    });
  }
});

// A placeholder in the browser's own colour, on the field's own background
// as the browser draws it, is not failed whatever its ratio: the page set
// neither colour, which WCAG counts as meeting the criterion (technique
// G148). Chromium's #757575 is 4.61:1 on white, below AAA's 7:1. A colour of
// the pair the page set makes it the page's, judged as any other text
// (failure F24): the placeholder's colour, or the field's own background;
// what lies behind a field the browser draws never shows through it.
// [description, markup, contrast-minimum, contrast-enhanced, enhanced's code on #f]
const PLACEHOLDER_CASES = [
  [
    'the browser default, AAA',
    '<input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'pass',
    null
  ],
  [
    'the browser default with other text failing AAA',
    '<p style="color:#767676">Grey text</p><input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'fail',
    null
  ],
  [
    'the browser default on a page background the page set',
    '<div style="background:#333;padding:8px"><input id="f" aria-label="f" placeholder="Search"></div>',
    'pass',
    'pass',
    null
  ],
  [
    'the same colour, set by the page',
    `${ph('color:#757575')}<input id="f" aria-label="f" placeholder="Search">`,
    'pass',
    'fail',
    'BELOW_THRESHOLD'
  ],
  [
    'a page that styles the placeholder but not its colour',
    `${ph('font-style:italic')}<input id="f" aria-label="f" placeholder="Search">`,
    'pass',
    'pass',
    null
  ],
  // A rule counts when it applies to this field and sets its placeholder's
  // colour: a reset that sets only opacity (as many sites have), or a colour
  // for another field, leaves it the browser's.
  [
    'a reset setting only the placeholder opacity',
    '<style>input::placeholder, textarea::placeholder { opacity: 1 }</style><input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'pass',
    null
  ],
  [
    'a placeholder colour set for another field',
    '<style>#other::placeholder { color: #000 }</style><input id="other" aria-label="o" placeholder="Other"><input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'pass',
    null
  ],
  [
    "a colour for the placeholders inside the field's class, not its own",
    '<style>.box ::placeholder { color: #757575 }</style><input id="f" class="box" aria-label="f" placeholder="Search">',
    'pass',
    'pass',
    null
  ],
  [
    'the browser grey set for this field in a selector list',
    '<style>textarea::placeholder, input::placeholder { color: #757575 }</style><input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'fail',
    'BELOW_THRESHOLD'
  ],
  // A style sheet from another origin can't be read, as on most real sites;
  // the colours the field shows are what is compared.
  [
    'the browser default, with a style sheet from another origin',
    '<link rel="stylesheet" href="https://cdn.other.test/site.css"><input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'pass',
    null
  ],
  [
    'a colour set in a style sheet from another origin',
    '<link rel="stylesheet" href="https://cdn.other.test/grey.css"><input id="f" aria-label="f" placeholder="Search">',
    'pass',
    'fail',
    'BELOW_THRESHOLD'
  ],
  [
    'the browser default on a field background the page set',
    '<input id="f" aria-label="f" placeholder="Search" style="background:#ccc">',
    'fail',
    'fail',
    'BELOW_THRESHOLD'
  ],
  [
    'the browser default on a transparent field over a background the page set',
    '<div style="background:#ccc;padding:8px"><input id="f" aria-label="f" placeholder="Search" style="background:transparent"></div>',
    'fail',
    'fail',
    'BELOW_THRESHOLD'
  ]
];

test("a placeholder in the browser's own colours, in Chromium", { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [description, markup, minimum, enhanced, code] of PLACEHOLDER_CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        // The page is on one origin and its style sheets on another, which a
        // script can't read.
        await page.route('https://cdn.other.test/**', (route) =>
          route.fulfill({
            contentType: 'text/css',
            body: route.request().url().endsWith('grey.css')
              ? '#f::placeholder{color:#767676}'
              : 'p{margin:0}'
          })
        );
        await page.route('https://site.test/', (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html lang="en"><head><title>Form</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
          })
        );
        await page.goto('https://site.test/');
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'contrast-minimum',
            'contrast-enhanced'
          ]);
          const byId = (id) => res.checksResults.find((c) => c.ruleId === id);
          const occ = (byId('contrast-enhanced').occurrences || []).find(
            (o) => o.selector === '#f'
          );
          return {
            minimum: byId('contrast-minimum').outcome,
            enhanced: byId('contrast-enhanced').outcome,
            code: occ ? occ.data.details.reasonCode : null,
            tier: occ ? occ.occurrenceOutcome || null : null
          };
        });
        assert.equal(r.minimum, minimum);
        assert.equal(r.enhanced, enhanced);
        assert.equal(r.code, code);
        // Nothing about a placeholder is asked any more: it passes or fails.
        assert.notEqual(r.tier, 'cantTell');
      } finally {
        await page.close();
      }
    });
  }
});
