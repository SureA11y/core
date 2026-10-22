'use strict';

/**
 * aria-expanded-state-mismatch in Chromium, where a panel can be collapsed
 * by its box (height: 0 with its overflow clipped, as accordions animate
 * it) and by a style sheet, neither of which jsdom lays out.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('../helpers/chromium.js');

const { addBundle } = require('../helpers/browserBundle');
const RULE_ID = 'aria-expanded-state-mismatch';

const STYLE =
  '<style>.panel { overflow: hidden; padding: 0 16px; } .closed { height: 0; } .gone { display: none; }</style>';

// [markup, the outcome, its reason code]
const CASES = [
  [
    '<button aria-expanded="false" aria-controls="p">A</button><div class="panel closed" id="p"><p>Text</p></div>',
    'pass',
    null
  ],
  [
    '<button aria-expanded="true" aria-controls="p">A</button><div class="panel closed" id="p"><p>Text</p></div>',
    'cantTell',
    'EXPANDED_TRUE_CONTROLLED_HIDDEN'
  ],
  [
    '<button aria-expanded="false" aria-controls="p">A</button><div class="panel" id="p"><p>Text</p></div>',
    'cantTell',
    'EXPANDED_FALSE_CONTROLLED_SHOWN'
  ],
  [
    '<button aria-expanded="true" aria-controls="p">A</button><div class="gone" id="p"><p>Text</p></div>',
    'cantTell',
    'EXPANDED_TRUE_CONTROLLED_HIDDEN'
  ],
  [
    '<button aria-expanded="false" aria-controls="p">A</button><div style="overflow:hidden;height:0"><div id="p"><p>Text</p></div></div>',
    'cantTell',
    'EXPANDED_FALSE_CONTROLLED_SHOWN'
  ]
];

test(`${RULE_ID} reads boxes and style sheets in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [markup, outcome, code] of CASES) {
    await t.test(markup, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title>${STYLE}</head><body><main>${markup}</main></body></html>`
        );
        await addBundle(page);
        const got = await page.evaluate((id) => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0];
          const occ = (r.occurrences || [])[0];
          return {
            outcome: r.outcome,
            code: (occ && occ.data && occ.data.details && occ.data.details.reasonCode) || null
          };
        }, RULE_ID);
        assert.deepEqual(got, { outcome, code });
      } finally {
        await page.close();
      }
    });
  }
});
