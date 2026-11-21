'use strict';

// focus-not-obscured-minimum and -enhanced scroll an element under a box the
// page keeps in place and hit-test it there. On a page whose scrollTo does
// nothing, the page stayed where it was and the hit test measured another
// place, so the box was passed silently. The rule now checks that the page
// moved: where it didn't, the box is asked about, without a lean, and
// `notScrolled` says why (round 9, R9-4).

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

const RULES = ['focus-not-obscured-minimum', 'focus-not-obscured-enhanced'];
const links = Array.from(
  { length: 40 },
  (_, i) => `<p><a href="#l${i}">link ${i}</a> text</p>`
).join('');
const page = (script) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>header { position: fixed; top: 0; left: 0; right: 0; height: 120px; background: #fff } main { padding-top: 130px } p { margin: 0 0 40px }</style></head><body><header><a href="/">Home</a></header><main><h1>Long page</h1>${links}</main><script>${script}</script></body></html>`;

async function scan(browser, script) {
  const p = await browser.newPage({ viewport: { width: 1024, height: 700 } });
  try {
    await p.setContent(page(script));
    await addBundle(p);
    return await p.evaluate((ids) => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ids } }, null);
      const out = {};
      for (const c of r.checksResults) {
        out[c.ruleId] = {
          outcome: c.outcome,
          findings: c.occurrences.map((o) => ({
            code: o.data.details.reasonCode,
            lean: o.lean ? o.lean.toward : null,
            summaryKey: o.i18n.summaryKey,
            notScrolled: o.data.details.notScrolled || false,
            confirmed: !!o.data.details.confirmedBy
          }))
        };
      }
      return out;
    }, RULES);
  } finally {
    await p.close();
  }
}

test('focus-not-obscured asks about a box it could not scroll under', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('a page that scrolls: confirmed by the hit test, leaning fail', async () => {
    const r = await scan(browser, '');
    assert.deepEqual(r['focus-not-obscured-minimum'], {
      outcome: 'cantTell',
      findings: [
        {
          code: 'FOCUS_OBSCURED_ENTIRELY',
          lean: 'fail',
          summaryKey: 'focusNotObscuredMinimum_summary_cantTell_entirely',
          notScrolled: false,
          confirmed: true
        }
      ]
    });
  });

  for (const [description, script] of [
    ['window.scrollTo does nothing', 'window.scrollTo = function () {};'],
    ['scrollTo and scroll do nothing', 'window.scrollTo = window.scroll = function () {};']
  ]) {
    await t.test(`${description}: cantTell, without a lean, not pass`, async () => {
      const r = await scan(browser, script);
      for (const [id, prefix] of [
        ['focus-not-obscured-minimum', 'focusNotObscuredMinimum'],
        ['focus-not-obscured-enhanced', 'focusNotObscuredEnhanced']
      ]) {
        assert.deepEqual(
          r[id],
          {
            outcome: 'cantTell',
            findings: [
              {
                code: 'FOCUS_OBSCURED_ENTIRELY',
                lean: null,
                summaryKey: `${prefix}_summary_cantTell_notScrolled`,
                notScrolled: true,
                confirmed: false
              }
            ]
          },
          id
        );
      }
    });
  }
});
