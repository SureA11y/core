'use strict';

// Text on a page with no background is measured on the canvas of the color
// scheme the page is drawn in, which the page's own color-scheme decides
// (CSS Color Adjustment 1), and, on a page that supports light and dark, in
// the other scheme too where its colors can't change with the scheme. The
// browser here prefers dark, as a binding emulates it to rescan a page in
// its dark scheme.

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('../helpers/chromium');

const { addBundle } = require('../helpers/browserBundle');

test(
  'the canvas follows the page color scheme in a browser that prefers dark',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (head, body, options = {}) => {
      const page = await browser.newPage({ colorScheme: 'dark' });
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`
      );
      await addBundle(page);
      return page.evaluate((options) => {
        const results = window.a11ycore.runa11yCoreInPage(null, null, options, [
          'contrast-computable',
          'contrast-minimum'
        ]).checksResults;
        const by = (id) => results.find((r) => r.ruleId === id);
        const minimum = by('contrast-minimum');
        return {
          computable: by('contrast-computable').outcome,
          minimum: minimum.outcome,
          findings: minimum.occurrences.map((o) => {
            const d = o.data.details;
            return d.reasonCode === 'ALL_ABOVE_THRESHOLD'
              ? ['pass', d.colorSchemesChecked]
              : [
                  o.selector,
                  Math.round(d.metrics.ratio * 100) / 100,
                  d.colors.backgroundHex,
                  d.colorScheme,
                  d.colorSchemesChecked
                ];
          }),
          probes: document.querySelectorAll('div').length
        };
      }, options);
    };
    const text = '<p id="grey" style="color:#333">Closed today</p><p id="plain">Open</p>';

    // No scheme declared: drawn in light, on white, whatever the user
    // prefers, and measured once.
    assert.deepEqual(await scan('', text), {
      computable: 'pass',
      minimum: 'pass',
      findings: [['pass', undefined]],
      probes: 0
    });

    // Light and dark: drawn on the dark canvas for this user, and measured on
    // white too, where #333 passes, so the dark scheme is named.
    for (const head of [
      '<style>:root{color-scheme:light dark}</style>',
      '<meta name="color-scheme" content="dark light">'
    ]) {
      assert.deepEqual(
        await scan(head, text),
        {
          computable: 'pass',
          minimum: 'fail',
          findings: [['#grey', 1.48, '#121212', 'dark', undefined]],
          probes: 0
        },
        head
      );
    }

    // Light text fails on white only: the light scheme is named, the page
    // being drawn in dark.
    assert.deepEqual(
      await scan(
        '<style>:root{color-scheme:light dark}</style>',
        '<p id="faint" style="color:#bbb">Closed</p>'
      ),
      {
        computable: 'pass',
        minimum: 'fail',
        findings: [['#faint', 1.92, '#ffffff', 'light', undefined]],
        probes: 0
      }
    );

    // A prefers-color-scheme rule colours the text: its light colour is not
    // what this scan sees, so only the dark scheme is measured.
    assert.deepEqual(
      await scan(
        '<style>:root{color-scheme:light dark} p{color:#111} @media (prefers-color-scheme: dark){p{color:#eee}}</style>',
        '<p id="themed">Closed</p>'
      ),
      { computable: 'pass', minimum: 'pass', findings: [['pass', ['dark']]], probes: 0 }
    );

    // Dark only: the dark canvas, one measurement, no scheme named.
    assert.deepEqual(await scan('<style>:root{color-scheme:only dark}</style>', text), {
      computable: 'pass',
      minimum: 'fail',
      findings: [['#grey', 1.48, '#121212', undefined, undefined]],
      probes: 0
    });

    // A canvas the scan names stands for the page's in every scheme.
    assert.deepEqual(
      await scan('<style>:root{color-scheme:light dark}</style>', text, {
        contrast: { rootCanvasFallback: '#ffffff' }
      }),
      { computable: 'pass', minimum: 'pass', findings: [['pass', undefined]], probes: 0 }
    );
  }
);
