'use strict';

/**
 * link-in-text-block in a real browser, where a page that sets no
 * background leaves the colors uncomputable in strict mode: an underline,
 * a non-color cue, must still settle the link without them.
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

const RULE_ID = 'link-in-text-block';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, bodyStyle = '') {
    const p = await browser.newPage();
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body style="${bodyStyle}">${body}</body></html>`
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
        return [
          c.outcome,
          c.occurrences.map((o) => o.data && o.data.details && o.data.details.reasonCode)
        ];
      }, RULE_ID);
    } finally {
      await p.close();
    }
  }

  await t.test('an underlined link passes on a page that sets no background', async () => {
    const [outcome] = await scan(
      '<p>Read <a href="/pricing" style="text-decoration:underline">our pricing</a> first.</p>'
    );
    assert.equal(outcome, 'pass');
  });

  await t.test(
    'a link set apart by color only stays undecided there, and fails on a set background',
    async () => {
      const body =
        '<p style="color:#222222">Read <a href="/pricing" style="text-decoration:none;color:#2a2a2a">our pricing</a> first.</p>';
      assert.deepEqual(await scan(body), ['cantTell', ['COLOR_NOT_COMPUTABLE']]);
      assert.deepEqual(await scan(body, 'background:#ffffff'), [
        'fail',
        ['COLOR_ONLY_DIFFERENTIATION']
      ]);
    }
  );

  // Links told apart by color alone that reach 3:1 are asked about (the hover
  // and focus cue); the closest to 3:1 is the margin, on a fail result too.
  await t.test('the color-only link closest to 3:1 is the margin', async () => {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><style>body{color:#000;background:#fff} a{text-decoration:none}</style></head><body>' +
          '<p>Read <a id="far" href="#a" style="color:#888">the guide</a> first.</p>' +
          '<p>Then <a id="near" href="#b" style="color:#666">the notes</a> below.</p>' +
          '<p>And <a id="low" href="#c" style="color:#444">the archive</a> too.</p></body></html>'
      );
      await p.addScriptTag({ content: BUNDLE });
      const r = await p.evaluate((id) => {
        const res = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null);
        return res.checksResults.find((x) => x.ruleId === id);
      }, RULE_ID);
      assert.equal(r.outcome, 'fail', '#444 against black is under 3:1');
      const m = r.margin;
      assert.equal(m.measure, 'contrast-ratio');
      assert.equal(m.selector, '#near');
      assert.equal(m.threshold, 3);
      assert.ok(m.value > 3 && m.value < 4, String(m.value));
      assert.equal(m.headroom, m.value - 3);
      assert.equal(m.measuredCount, 3);
    } finally {
      await p.close();
    }
  });
});

test(
  `${RULE_ID} in Chromium: cues on the link's content, wrappers and transparent lines`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const A = 'href="/" style="text-decoration:none;color:#222"';
    async function outcome(paragraph) {
      const p = await browser.newPage();
      try {
        await p.setContent(
          '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
            `<body><main><p style="color:#000">Read the ${paragraph} today.</p></main></body></html>`
        );
        await p.addScriptTag({ content: BUNDLE });
        return await p.evaluate(
          (id) => window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0].outcome,
          RULE_ID
        );
      } finally {
        await p.close();
      }
    }
    // The cue sits on an element inside the link.
    assert.equal(await outcome(`<a ${A}><strong>guide</strong></a>`), 'pass');
    assert.equal(await outcome(`<a ${A}><em>guide</em></a>`), 'pass');
    assert.equal(
      await outcome(`<a ${A}><span style="text-decoration:underline">guide</span></a>`),
      'pass'
    );
    // A wrapper holding only the link takes its parent's text, unless the
    // wrapper sets the link apart itself, as a footnote's <sup> does.
    assert.equal(await outcome(`<span><a ${A}>guide</a></span>`), 'fail');
    assert.equal(await outcome(`<sup><a ${A}>[1]</a></sup>`), 'notApplicable');
    // A line in a transparent color shows nothing.
    assert.equal(
      await outcome(
        '<a href="/" style="color:#222;text-decoration:underline;text-decoration-color:transparent">guide</a>'
      ),
      'fail'
    );
    assert.equal(
      await outcome(
        '<a href="/" style="color:#222;text-decoration:none;border-bottom:1px solid transparent">guide</a>'
      ),
      'fail'
    );
  }
);

// What a ::before/::after draws counts as a cue, read from its computed
// style: an empty-content box that paints a line is an underline (#107). On
// the link's content, a chip's background and a raised <sup> are cues too.
// The link is #2b5797, 2.9:1 against the black text, without underline.
test(
  `${RULE_ID} in Chromium: what pseudo-elements and the link's content draw (#107)`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    const BAR = 'content:"";position:absolute;left:0;right:0;bottom:0';
    // [description, CSS, the link's content, outcome]
    const CASES = [
      ['color alone', '', 'guide', 'fail'],
      [
        'an empty ::after drawing a 1px bar',
        `a::after{${BAR};height:1px;background:#2b5797}`,
        'guide',
        'pass'
      ],
      [
        'an empty ::after drawing a bottom border',
        `a::after{${BAR};border-bottom:1px solid #2b5797}`,
        'guide',
        'pass'
      ],
      [
        'an empty ::before drawing a bar',
        `a::before{${BAR};height:2px;background:#000}`,
        'guide',
        'pass'
      ],
      ['an empty ::after that draws nothing', `a::after{${BAR}}`, 'guide', 'fail'],
      [
        'an empty ::after with a transparent bar',
        `a::after{${BAR};height:1px;background:transparent}`,
        'guide',
        'fail'
      ],
      [
        'an empty ::after in the background color',
        `a::after{${BAR};height:1px;background:#fff}`,
        'guide',
        'fail'
      ],
      [
        'a shadow of an empty, flat ::after',
        `a::after{${BAR};height:0;box-shadow:0 1px 0 #2b5797}`,
        'guide',
        'fail'
      ],
      [
        'an empty ::after hidden',
        `a::after{${BAR};height:1px;background:#2b5797;visibility:hidden}`,
        'guide',
        'fail'
      ],
      ['a code chip inside the link', '', '<code style="background:#ddd">fetch()</code>', 'pass'],
      ['a <mark> inside the link', '', '<mark>guide</mark>', 'pass'],
      ['a footnote <sup> inside the link', '', '<sup>1</sup>', 'pass'],
      [
        'a background inside the link like the page',
        '',
        '<span style="background:#fff">guide</span>',
        'fail'
      ]
    ];

    for (const [description, css, inner, outcome] of CASES) {
      await t.test(description, async () => {
        const p = await browser.newPage();
        try {
          await p.setContent(
            `<!doctype html><html lang="en"><head><title>t</title><style>body{background:#fff} p{color:#000;font:16px/1.5 sans-serif} a{color:#2b5797;text-decoration:none;position:relative} ${css}</style></head><body><p>Read the <a href="/x">${inner}</a> before you start.</p></body></html>`
          );
          await p.addScriptTag({ content: BUNDLE });
          const r = await p.evaluate(
            (id) =>
              window.a11ycore
                .runa11yCoreInPage(null, null, { rules: { include: id } }, null)
                .checksResults.find((x) => x.ruleId === id).outcome,
            RULE_ID
          );
          assert.equal(r, outcome);
        } finally {
          await p.close();
        }
      });
    }
  }
);
