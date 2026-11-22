'use strict';

/**
 * resize-text-content-loss in a real browser, at a viewport 640 CSS pixels
 * wide (a 1280 pixel window at 200% zoom): text a box cuts off is asked
 * about, leaning fail where it is certainly cut; text shortened with an
 * ellipsis or a line clamp is asked about, leaning fail; text that fits
 * passes; a box that scrolls, visually hidden text and text waiting outside
 * its box are left out; at a wider viewport, in a frame, or with nothing
 * that clips, the rule is notApplicable; and the page is left as it was.
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

const RULE_ID = 'resize-text-content-loss';
const { addBundle } = require('../../helpers/browserBundle');
const { howToCheckFor } = require('../../../src/how-to-check');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);
const ZOOMED = { viewport: { width: 640, height: 512 } };

function page(css, body) {
  return `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:8px;font:16px/20px Arial,sans-serif} ${css}</style></head><body>${body}</body></html>`;
}
const LONG =
  'Opening hours today, and the rest of the week from nine in the morning to five in the afternoon, except on public holidays.';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, { pageOptions = ZOOMED, engineOptions = {}, before = null } = {}) {
    const p = await browser.newPage(pageOptions);
    try {
      await p.setContent(html);
      await addBundle(p);
      if (before) await p.evaluate(before[0], before[1]);
      const opts = { rules: { include: RULE_ID }, ...engineOptions };
      const result = await p.evaluate(
        (o) => window.a11ycore.runa11yCoreInPage(null, null, o, null),
        opts
      );
      return result.checksResults.find((r) => r.ruleId === RULE_ID);
    } finally {
      await p.close();
    }
  }
  const findings = (check) =>
    (check.occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || null,
      o.occurrenceOutcome,
      o.data.details.reasonCode,
      o.lean ? o.lean.toward : null
    ]);

  await t.test('the fixture, at 640 pixels wide: each case as its title says', async () => {
    const check = await scan(FIXTURE);
    assert.equal(check.outcome, 'cantTell');
    assert.deepEqual(findings(check), [
      ['rtcl_case_03', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail'],
      ['rtcl_case_04', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail'],
      ['rtcl_case_05', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail'],
      ['rtcl_case_06', 'cantTell', 'TEXT_CLIPPED_AT_640', null],
      ['rtcl_case_13', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail'],
      ['rtcl_case_07', 'cantTell', 'TEXT_TRUNCATED_AT_640', 'fail'],
      ['rtcl_case_08', 'cantTell', 'TEXT_TRUNCATED_AT_640', 'fail']
    ]);
    const [height, nowrap, inset, , , ellipsis, clamp] = check.occurrences;
    assert.equal(height.data.details.edge, 'bottom');
    assert.equal(height.data.details.clipCss, 'height: 40px; overflow: hidden');
    assert.equal(height.i18n.summaryKey, 'resizeTextContentLoss_summary_clipped');
    assert.equal(height.lean.i18n.whyKey, 'resizeTextContentLoss_lean_why_clipped');
    assert.equal(height.data.details.viewport.width <= 640, true);
    assert.match(height.data.details.text, /^Opening hours today/);
    assert.equal(nowrap.data.details.edge, 'right');
    assert.equal(nowrap.data.details.clipCss, 'white-space: nowrap; overflow: hidden');
    assert.match(inset.data.details.clipCss, /clip-path: inset/);
    assert.equal(
      ellipsis.data.details.clipCss,
      'white-space: nowrap; overflow: hidden; text-overflow: ellipsis'
    );
    assert.equal(ellipsis.i18n.summaryKey, 'resizeTextContentLoss_summary_truncated');
    assert.equal(ellipsis.lean.i18n.whyKey, 'resizeTextContentLoss_lean_why_truncated');
    assert.equal(clamp.data.details.clipCss, '-webkit-line-clamp: 2; overflow: hidden');
    // Each code has steps, in every locale.
    for (const code of ['TEXT_CLIPPED_AT_640', 'TEXT_TRUNCATED_AT_640']) {
      for (const locale of ['en', 'es', 'de', 'fr', 'ja']) {
        const how = howToCheckFor(RULE_ID, code, locale);
        assert.ok(
          how && how.steps.length === 3 && how.passWhen && how.failWhen,
          `${code} ${locale}`
        );
      }
    }
  });

  await t.test('text that fits passes; with nothing that clips, notApplicable', async () => {
    const fits = await scan(
      page('.box{width:300px;height:80px;overflow:hidden}', '<div class="box">Opening hours</div>')
    );
    assert.equal(fits.outcome, 'pass');
    const none = await scan(page('', `<p>${LONG}</p>`));
    assert.equal(none.outcome, 'notApplicable');
  });

  await t.test(
    'at a wider viewport, notApplicable: the host lays the page out at 640',
    async () => {
      const html = page(
        '.box{width:200px;height:20px;overflow:hidden}',
        `<div class="box">${LONG}</div>`
      );
      const wide = await scan(html, { pageOptions: { viewport: { width: 1280, height: 1024 } } });
      assert.equal(wide.outcome, 'notApplicable');
      assert.deepEqual(wide.data, { reason: 'viewportWider' });
      const narrow = await scan(html, { pageOptions: { viewport: { width: 600, height: 800 } } });
      assert.equal(narrow.outcome, 'cantTell');
    }
  );

  // Preserved spaces at the end of a line hang past the box and show
  // nothing (round 10, S10-3).
  await t.test('white space alone past the edge cuts nothing; a word past it does', async () => {
    const hanging = await scan(
      page(
        '.box{width:200px;overflow:hidden;white-space:pre-wrap}',
        `<div class="box">Hello world${' '.repeat(50)}</div><div class="box" style="max-width:300px;width:auto">Thanks!   \nSee you tomorrow.${' '.repeat(56)}</div>`
      )
    );
    assert.equal(hanging.outcome, 'pass');
    const word = await scan(
      page(
        '.box{width:200px;overflow:hidden;white-space:pre}',
        `<div class="box" id="w">Hello world, and a longer line past the edge${' '.repeat(20)}</div>`
      )
    );
    assert.deepEqual(findings(word), [['w', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail']]);
  });

  // In a vertical writing mode the inline axis is y (round 10, S10-6).
  await t.test(
    'in vertical text, the ellipsis and nowrap are read on y, the clamp on x',
    async () => {
      const TATE = '縦書きの長い見出しテキストがここにあります';
      const check = await scan(
        page(
          '.v{writing-mode:vertical-rl;overflow:hidden;margin:4px}',
          `<div class="v" id="ell" style="height:100px;text-overflow:ellipsis;white-space:nowrap">${TATE}</div>` +
            `<div class="v" id="clamp" style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;height:120px">${TATE.repeat(4)}</div>` +
            `<div class="v" id="cut" style="height:100px;white-space:nowrap">${TATE}</div>`
        )
      );
      assert.deepEqual(findings(check), [
        ['ell', 'cantTell', 'TEXT_TRUNCATED_AT_640', 'fail'],
        ['clamp', 'cantTell', 'TEXT_TRUNCATED_AT_640', 'fail'],
        ['cut', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail']
      ]);
      const [ell, clamp, cut] = check.occurrences;
      assert.equal(
        ell.data.details.clipCss,
        'white-space: nowrap; overflow: hidden; text-overflow: ellipsis'
      );
      assert.equal(ell.data.details.metrics.axis, 'y');
      assert.equal(ell.data.details.metrics.thresholdPx, 8);
      assert.equal(clamp.data.details.clipCss, '-webkit-line-clamp: 2; overflow: hidden');
      assert.equal(cut.data.details.clipCss, 'white-space: nowrap; overflow: hidden');
    }
  );

  await t.test('a box that scrolls keeps its text reachable, on its axis only', async () => {
    const scrolls = await scan(
      page(
        '.out{width:200px;height:40px;overflow:hidden} .in{height:40px;overflow:auto}',
        `<div class="out"><div class="in">${LONG}</div></div>`
      )
    );
    // Past the box that scrolls on both axes, nothing clips the text.
    assert.equal(scrolls.outcome, 'notApplicable');
    // The inner box scrolls sideways only (its overflow-y hidden fits its
    // line); the outer one still clips downwards.
    const sideways = await scan(
      page(
        '.out{height:6px;overflow:hidden} .in{overflow-x:auto;overflow-y:hidden;white-space:nowrap}',
        `<div class="out" id="out"><div class="in">${LONG}</div></div>`
      )
    );
    assert.deepEqual(findings(sideways), [['out', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail']]);
  });

  await t.test(
    'line-clamp and ellipsis: truncated, leaning fail; a clamp that fits passes',
    async () => {
      const check = await scan(
        page(
          '.c{width:200px;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden} .e{width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          `<div class="c" id="clamp" style="-webkit-line-clamp:2">${LONG}</div>
         <div class="c" id="roomy" style="-webkit-line-clamp:12">${LONG}</div>
         <div class="e" id="ell">${LONG}</div>
         <div class="e" id="short">Hours</div>`
        )
      );
      assert.deepEqual(findings(check), [
        ['clamp', 'cantTell', 'TEXT_TRUNCATED_AT_640', 'fail'],
        ['ell', 'cantTell', 'TEXT_TRUNCATED_AT_640', 'fail']
      ]);
    }
  );

  await t.test('text in a shadow root is measured against the box around its host', async () => {
    const check = await scan(
      page(
        '.box{width:200px;height:20px;overflow:hidden}',
        '<div class="box" id="box"><x-t></x-t></div>'
      ),
      {
        before: [
          (text) => {
            const host = document.querySelector('x-t');
            host.attachShadow({ mode: 'open' }).innerHTML = `<p style="margin:0">${text}</p>`;
          },
          LONG
        ]
      }
    );
    assert.deepEqual(findings(check), [['box', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail']]);
  });

  await t.test(
    'the scan leaves the page as it was: viewport, scroll, styles and focus',
    async () => {
      const p = await browser.newPage(ZOOMED);
      try {
        await p.setContent(
          page(
            '.box{width:200px;height:40px;overflow:hidden} .spacer{height:2000px}',
            `<div class="spacer"></div><div class="box">${LONG}</div><input id="f">`
          )
        );
        await addBundle(p);
        const snapshot = () =>
          p.evaluate(() => ({
            width: innerWidth,
            height: innerHeight,
            rootWidth: document.documentElement.clientWidth,
            scroll: [scrollX, scrollY],
            html: document.documentElement.outerHTML,
            sheets: document.styleSheets.length,
            adopted: document.adoptedStyleSheets.length,
            zoom: getComputedStyle(document.documentElement).zoom,
            focus: document.activeElement && document.activeElement.id
          }));
        await p.evaluate(() => {
          window.scrollTo(0, 1500);
          document.getElementById('f').focus();
        });
        const before = await snapshot();
        let mutations = 0;
        await p.evaluate(() => {
          new MutationObserver((list) => {
            window.__mutations = (window.__mutations || 0) + list.length;
          }).observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true
          });
        });
        const result = await p.evaluate(() =>
          window.a11ycore.runa11yCoreInPage(
            null,
            null,
            { rules: { include: 'resize-text-content-loss' } },
            null
          )
        );
        const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
        assert.equal(check.outcome, 'cantTell');
        const after = await snapshot();
        assert.deepEqual(after, before);
        mutations = await p.evaluate(() => window.__mutations || 0);
        assert.equal(mutations, 0, 'the rule changes nothing in the DOM');
      } finally {
        await p.close();
      }
    }
  );

  // The message names the zoom that lays a 1280 pixel window out at the
  // width the page was scanned at: 400% at 320, not 200% (round 12, U12-2).
  await t.test('the message states the zoom the scanned width stands for', async () => {
    const html = page(
      '.box{width:200px;height:20px;overflow:hidden}',
      `<div class="box">${LONG}</div>`
    );
    const at640 = await scan(html);
    assert.match(at640.occurrences[0].summary, /^At 6\d\d pixels wide, as a 1280 pixel window/);
    const at320 = await scan(html, { pageOptions: { viewport: { width: 320, height: 800 } } });
    const [o] = at320.occurrences;
    const width = o.data.details.viewport.width;
    const zoom = String(Math.round(128000 / width));
    assert.equal(o.i18n.params.zoomPercent, zoom);
    assert.ok(Number(zoom) >= 400, zoom);
    assert.ok(o.summary.includes(`shows the page at ${zoom}% zoom`), o.summary);
    assert.doesNotMatch(o.summary, /200% zoom/);
  });

  // The CSS quoted is the CSS the author wrote: content-visibility, which
  // Chromium computes into contain (round 12, U12-3).
  await t.test('a box clipped by content-visibility: auto quotes it', async () => {
    const cv = await scan(
      page(
        '.box{content-visibility:auto;width:200px;height:30px}',
        `<div class="box">${LONG}</div>`
      )
    );
    assert.equal(cv.outcome, 'cantTell');
    assert.equal(cv.occurrences[0].data.details.clipCss, 'height: 30px; content-visibility: auto');
    const paint = await scan(
      page('.box{contain:paint;width:200px;height:30px}', `<div class="box">${LONG}</div>`)
    );
    assert.equal(paint.occurrences[0].data.details.clipCss, 'height: 30px; contain: paint');
  });

  // Text a box hides entirely is cut off where the box shows its other text
  // and the text flowed out of it; it is left out where the box shows none
  // of its text, or where it was placed outside (round 12, U12-1).
  await t.test('text a box hides wholly while showing other text is asked about', async () => {
    const one = async (body) => {
      const check = await scan(page('', body));
      return [check.outcome, findings(check)];
    };
    for (const body of [
      '<div id="a" style="overflow:hidden;height:24px;width:300px">First line<br>Second line that is wholly hidden</div>',
      '<div id="a" style="height:20px;overflow:hidden;width:300px"><p style="margin:0">Card title</p><p style="margin:0">Excerpt of the article</p></div>',
      '<div id="a" style="width:150px;white-space:nowrap;overflow:hidden"><span style="display:inline-block;width:150px">One</span><span style="display:inline-block">Two</span></div>'
    ]) {
      assert.deepEqual(
        await one(body),
        ['cantTell', [['a', 'cantTell', 'TEXT_CLIPPED_AT_640', 'fail']]],
        body
      );
    }
    for (const body of [
      // A collapsed panel shows none of its text.
      '<div id="a" style="height:0;overflow:hidden"><p>Closed panel</p></div>',
      // An off-canvas menu and a carousel's next slide were placed outside.
      '<div id="a" style="position:relative;overflow:hidden;height:40px;width:200px">Shown<p style="position:absolute;left:100%;top:0;margin:0">Off canvas</p></div>',
      '<div id="a" style="overflow:hidden;width:200px"><div style="display:flex;transform:translateX(0)"><div style="flex:0 0 200px">Slide one</div><div style="flex:0 0 200px">Slide two</div></div></div>'
    ]) {
      assert.deepEqual((await one(body))[1], [], body);
    }
  });

  await t.test('in a frame not named as the page, notApplicable', async () => {
    const p = await browser.newPage(ZOOMED);
    try {
      await p.setContent(
        `<iframe style="width:600px;height:300px" srcdoc="${page(
          '.box{width:200px;height:20px;overflow:hidden}',
          `<div class='box'>${LONG}</div>`
        ).replace(/"/g, '&quot;')}"></iframe>`
      );
      const frame = p.frames()[1];
      await frame.waitForLoadState();
      await addBundle(frame);
      const result = await frame.evaluate(() =>
        window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { rules: { include: 'resize-text-content-loss' } },
          null
        )
      );
      const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
      assert.equal(check.outcome, 'notApplicable');
    } finally {
      await p.close();
    }
  });
});
