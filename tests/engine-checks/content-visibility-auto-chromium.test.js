'use strict';

/**
 * content-visibility: auto lets the browser skip laying out the content of
 * an element that isn't near the viewport: the element keeps the size
 * contain-intrinsic-size gives it, and its content, still measurable, spills
 * out of that box over what follows. A reader never sees it, since the
 * browser lays the element out at its real size once it nears the viewport.
 * The scan lays such content out as a reader sees it, then lets the browser
 * skip it again.
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

const RULES = [
  'text-spacing-content-loss',
  'css-hidden-focus',
  'target-size-minimum',
  'contrast-computable'
];

// Cards far longer than their 300px placeholder, each followed by a note
// with a background of its own. Laid out as skipped, a card's summaries
// spill over the next card's (too close to be targets), its text over the
// note's background, and the last card's past the end of the page.
function cardsPage(cardCss, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Findings</title><style>
body { margin: 0; font: 16px/1.5 sans-serif; background: #fff; color: #222; }
.card { ${cardCss} background: #eef; margin: 1em; padding: 1em; }
.note { background: #fde; padding: 1em; margin: 1em; }
summary { font-size: 12px; line-height: 15px; margin: 6px 0; }
</style></head><body><main><h1>Findings and analysis</h1>${extra}</main><script>
const main = document.querySelector('main');
for (let n = 1; n <= 8; n++) {
  const card = document.createElement('section');
  card.className = 'card';
  card.id = 'card' + n;
  if (n === 5) card.setAttribute('style', 'color: #111;  border: 0');
  card.innerHTML = '<h2>Scan ' + n + '</h2>' + Array.from({ length: 40 }, (_, i) =>
    '<details><summary>Occurrences of finding ' + i + ' in scan ' + n + '</summary><p>x</p></details>').join('');
  main.append(card);
  const note = document.createElement('div');
  note.className = 'note';
  note.innerHTML = '<p>Note after scan ' + n + '</p><details><summary>Note details</summary><p>y</p></details>';
  main.append(note);
}
</script></body></html>`;
}

const SKIPPED = 'content-visibility: auto; contain-intrinsic-size: auto 300px;';

test('content content-visibility: auto skips is measured as laid out', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, fn) {
    const p = await browser.newPage({ viewport: { width: 375, height: 900 } });
    try {
      await p.setContent(html);
      // The first frames decide which cards are skipped.
      await p.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      );
      await addBundle(p);
      const result = await p.evaluate((rules) => {
        const r = window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { rules: { include: rules } },
          null
        );
        return {
          environment: r.engine.environment,
          findings: r.checksResults.flatMap((c) =>
            (c.occurrences || [])
              .filter((o) => (o.occurrenceOutcome || c.outcome) !== 'pass')
              .map((o) => ({
                ruleId: c.ruleId,
                outcome: o.occurrenceOutcome || c.outcome,
                reasonCode: (o.data && o.data.details && o.data.details.reasonCode) || null,
                id: (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || null
              }))
          )
        };
      }, RULES);
      return fn ? { ...result, ...(await fn(p)) } : result;
    } finally {
      await p.close();
    }
  }

  await t.test('skipped cards give what the same cards laid out give', async () => {
    const skipped = await scan(cardsPage(SKIPPED));
    const visible = await scan(cardsPage('content-visibility: visible;'));
    assert.deepEqual(visible.findings, []);
    assert.deepEqual(skipped.findings, visible.findings);
    assert.ok(skipped.environment.contentVisibilitySkipped >= 4, 'the cards below the fold');
    assert.equal(visible.environment.contentVisibilitySkipped, undefined);
  });

  await t.test('the page is put back as it was, and skips again', async () => {
    const r = await scan(cardsPage(SKIPPED), (p) =>
      p.evaluate(async () => {
        const attrs = () =>
          [...document.querySelectorAll('.card')].map((c) => c.getAttribute('style'));
        const before = attrs();
        window.a11ycore.runa11yCoreInPage(null, null, {}, null);
        const after = attrs();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const last = document.getElementById('card8').firstElementChild;
        return {
          before,
          after,
          lastSkipped: !last.checkVisibility({ contentVisibilityAuto: true }),
          lastHeight: document.getElementById('card8').getBoundingClientRect().height
        };
      })
    );
    assert.deepEqual(r.after, r.before);
    assert.equal(r.before[4], 'color: #111;  border: 0', 'its own style attribute, as written');
    assert.equal(r.before[0], null);
    assert.equal(r.lastSkipped, true, 'the last card is skipped again');
  });

  // What really is there is still found, in a card on screen and in one
  // skipped: text the spacing makes overlap the next line, targets too small
  // and too close, and a button moved off the page.
  await t.test('real findings in such cards are still reported', async () => {
    const real =
      '<style>.box{height:20px;width:180px;font:16px/20px sans-serif}' +
      '.tiny{width:10px;height:10px;padding:0;border:0}' +
      '.away{position:absolute;left:-9999px}</style>' +
      '<section class="card" id="first"><div class="box" id="box1">Opening hours today</div><div>Closed on Sundays</div></section>';
    const lastCard =
      '<section class="card" id="far"><div class="box" id="box2">Opening hours today</div><div>Closed on Sundays</div>' +
      '<button class="tiny" id="t1"></button><button class="tiny" id="t2"></button>' +
      '<button class="away" id="away">Skip</button></section>';
    const html = cardsPage(SKIPPED, real).replace('</main>', lastCard + '</main>');
    const r = await scan(html);
    const ids = (ruleId) =>
      r.findings.filter((f) => f.ruleId === ruleId).map((f) => [f.id, f.outcome, f.reasonCode]);
    assert.deepEqual(ids('text-spacing-content-loss'), [
      ['box1', 'cantTell', 'TEXT_OVERLAPS'],
      ['box2', 'cantTell', 'TEXT_OVERLAPS']
    ]);
    assert.deepEqual(
      ids('target-size-minimum').map(([sel, outcome]) => [sel, outcome]),
      [
        ['t1', 'fail'],
        ['t2', 'fail']
      ]
    );
    assert.deepEqual(
      ids('css-hidden-focus').map(([sel]) => sel),
      ['away']
    );
  });
});
