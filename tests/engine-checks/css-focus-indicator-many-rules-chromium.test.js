'use strict';

/**
 * css-focus-indicator-suppressed with many focus rules: in a browser, where
 * many elements match the joined list of rules, each rule is run once over
 * the tree instead of once per element (round 11, P11-5). Each element must
 * still be told exactly the rules that match it, and a rule with :scope is
 * still read as matches() reads it. A document rule does not reach into a
 * shadow tree; the tree's own sheet does.
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

const RULE_ID = 'css-focus-indicator-suppressed';

test(`${RULE_ID}: many rules and many matching links, in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const p = await browser.newPage({ viewport: { width: 800, height: 800 } });
  const n = 300;
  const rules = Array.from({ length: n }, (_, i) => `.c${i} a:focus{outline:none}`).join('\n');
  const links = Array.from(
    { length: n },
    (_, i) =>
      `<div class="c${i}${i % 3 === 0 ? ` c${(i + 1) % n}` : ''}"><a href="#${i}">Link ${i}</a></div>`
  ).join('');
  await p.setContent(
    `<!doctype html><html lang="en"><head><title>t</title><style>${rules}\n` +
      'a.both:focus{outline:none}\n:scope a.scoped:focus{outline:none}\n.in a:focus{outline:none}' +
      '</style></head>' +
      `<body><main><h1>T</h1>${links}<p><a class="both" href="#b">Both</a>` +
      '<a class="scoped" href="#s">Scoped</a><a href="#free">Free</a></p>' +
      '<div id="host"></div></main></body></html>'
  );
  await p.evaluate(() => {
    const root = document.getElementById('host').attachShadow({ mode: 'open' });
    root.innerHTML =
      Array.from(
        { length: 10 },
        (_, i) => `<div class="in"><a href="#in${i}">In ${i}</a></div>`
      ).join('') + '<a href="#out">Out</a><style>div.in a:focus{outline:none}</style>';
  });
  await addBundle(p);
  const occ = await p.evaluate((id) => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]);
    return r.checksResults[0].occurrences.map((o) => ({
      text: o.__text || o.html || o.selector,
      selectors: o.data.details.suppressingSelectors
    }));
  }, RULE_ID);
  const bySelector = (sel) => occ.filter((o) => o.selectors.includes(sel));
  for (let i = 0; i < n; i++) {
    const own = bySelector(`.c${i} a:focus`);
    // .c{i} holds link i, and link i - 1 too when i - 1 is a multiple of 3.
    assert.equal(own.length, ((i - 1 + n) % n) % 3 === 0 ? 2 : 1, `.c${i}`);
  }
  const twice = occ.filter((o) => o.selectors.length === 2);
  assert.equal(twice.length, n / 3);
  assert.equal(bySelector('a.both:focus').length, 1);
  // :scope is the element itself in matches(), so this rule matches no link.
  assert.equal(bySelector(':scope a.scoped:focus').length, 0);
  // CSS Scoping: a document rule's selector does not match into a shadow
  // tree (round 12, R12F-12); the tree's own sheet styles its links.
  assert.equal(bySelector('.in a:focus').length, 0);
  assert.equal(bySelector('div.in a:focus').length, 10);
  assert.equal(occ.length, n + 1 + 10);
});

// The same verdict and quote as in jsdom: Chromium drops a list with an
// invalid selector, and serializes `*:focus` as `:focus` (round 12, U12-16).
test(
  `${RULE_ID}: an invalid selector list and a universal selector, in Chromium`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    async function run(css) {
      const p = await browser.newPage();
      try {
        await p.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main><button>Go</button></main></body></html>`
        );
        await addBundle(p);
        return await p.evaluate((id) => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0];
          return [r.outcome, r.occurrences.map((o) => o.data.details.suppressingSelectors)];
        }, RULE_ID);
      } finally {
        await p.close();
      }
    }
    assert.deepEqual(await run('button:-moz-focusring, button:focus{outline:none}'), [
      'notApplicable',
      []
    ]);
    assert.deepEqual(await run('*:focus{outline:none}'), ['cantTell', [[':focus']]]);
  }
);

// :focus-within and :has(:focus) as focus rules, and an open shadow root's
// own and adopted style sheets read against its elements (round 12,
// U12-16).
test(
  `${RULE_ID}: ancestor focus states and shadow root sheets, in Chromium`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    async function run(css, body, shadow) {
      const p = await browser.newPage();
      try {
        await p.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main>${body}</main></body></html>`
        );
        if (shadow) {
          await p.evaluate(([html, adopt]) => {
            const root = document.getElementById('h').attachShadow({ mode: 'open' });
            root.innerHTML = html;
            if (adopt) {
              const sheet = new CSSStyleSheet();
              sheet.replaceSync(adopt);
              root.adoptedStyleSheets = [sheet];
            }
          }, shadow);
        }
        await addBundle(p);
        return await p.evaluate((id) => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0];
          return [r.outcome, r.occurrences.map((o) => o.data.details.suppressingSelectors)];
        }, RULE_ID);
      } finally {
        await p.close();
      }
    }
    const link = '<a href="#x">x</a>';
    assert.deepEqual(await run('main:focus-within a{outline:none}', link), [
      'cantTell',
      [['main:focus-within a']]
    ]);
    assert.deepEqual(await run('main:has(a:focus) a{outline:none}', link), [
      'cantTell',
      [['main:has(a:focus) a']]
    ]);
    assert.deepEqual(await run('main:has(button:focus) a{outline:none}', link), [
      'notApplicable',
      []
    ]);
    const host = '<a href="#d">doc</a><div id="h"></div>';
    for (const shadow of [
      ['<style>button:focus, a:focus{outline:none}</style><button>b</button>', ''],
      ['<button>b</button>', 'button:focus, a:focus{outline:none}']
    ]) {
      // The shadow root's rule removes its button's outline, not the
      // document's link's.
      assert.deepEqual(await run('', host, shadow), ['cantTell', [['button:focus']]]);
    }
  }
);
