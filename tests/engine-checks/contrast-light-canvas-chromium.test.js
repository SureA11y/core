'use strict';

// A page with no background on html or body (#219): the browser paints its
// canvas behind it, white unless the page asks for dark, and the contrast
// rules measure text on the canvas colour they read, in either contrast
// mode, rather than asking about every text (BACKGROUND_NOT_OPAQUE_AT_ROOT).

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('../helpers/chromium');

const { addBundle } = require('../helpers/browserBundle');

test('text on the canvas is measured against it, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const scan = async (head, body, mode) => {
    // A page of its own each time: a page that asked for dark goes on
    // painting its canvas dark after setContent replaces its document.
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`
    );
    await addBundle(page);
    return page.evaluate((mode) => {
      const results = window.a11ycore.runa11yCoreInPage(
        null,
        null,
        mode ? { contrast: { mode } } : {},
        ['contrast-computable', 'contrast-minimum']
      ).checksResults;
      const by = (id) => results.find((r) => r.ruleId === id);
      return {
        computable: by('contrast-computable').outcome,
        failed: by('contrast-minimum')
          .occurrences.filter((o) => o.selector)
          .map((o) => [
            o.selector,
            Math.round(o.data.details.metrics.ratio * 100) / 100,
            o.data.details.colors.backgroundHex,
            o.data.details.assumptionsApplied
          ]),
        probes: document.querySelectorAll('div').length
      };
    }, mode);
  };
  const text = '<p id="plain">Opening hours</p><p id="black" style="color:#000">Today</p>';
  for (const mode of [null, 'strictConformance', 'auditorAssist']) {
    // Black on the white canvas passes, #bbb on it fails.
    assert.deepEqual(
      await scan('', `${text}<p id="grey" style="color:#bbb">Closed</p>`, mode),
      { computable: 'pass', failed: [['#grey', 1.92, '#ffffff', null]], probes: 0 },
      String(mode)
    );
    // The dark canvas, read the same way.
    assert.deepEqual(
      await scan(
        '<meta name="color-scheme" content="dark">',
        '<p id="dark" style="color:#333">Closed</p>',
        mode
      ),
      { computable: 'pass', failed: [['#dark', 1.48, '#121212', null]], probes: 0 },
      String(mode)
    );
    // A semi-transparent wrapper over the canvas: black at half opacity on
    // white is drawn #808080.
    assert.deepEqual(
      await scan(
        '',
        '<div style="opacity:.5"><p id="faded" style="color:#000">Closed</p></div>',
        mode
      ),
      { computable: 'pass', failed: [['#faded', 3.95, '#ffffff', null]], probes: 1 },
      String(mode)
    );
  }
});

// In a frame the canvas may be the page around it showing through, which
// the frame can't see: its text stays asked about, as before.
test('text in a frame with no background stays asked about, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><iframe title="f" srcdoc='<!doctype html><html lang="en"><head><title>f</title></head><body><p style="color:#bbb">Closed</p></body></html>'></iframe></main></body></html>`
  );
  const frame = page.frames()[1];
  await frame.waitForLoadState();
  await addBundle(frame);
  const outcome = await frame.evaluate(() => {
    const results = window.a11ycore.runa11yCoreInPage(null, null, {}, [
      'contrast-computable',
      'contrast-minimum'
    ]).checksResults;
    const by = (id) => results.find((r) => r.ruleId === id);
    return {
      computable: by('contrast-computable').occurrences.map((o) => [
        o.data.details.reasonCode,
        o.i18n.hintKey
      ]),
      minimum: by('contrast-minimum').outcome
    };
  });
  assert.deepEqual(outcome, {
    computable: [
      ['BACKGROUND_NOT_OPAQUE_AT_ROOT', 'contrastComputable_hint_cantTell_rootNotOpaque']
    ],
    minimum: 'notApplicable'
  });
});
