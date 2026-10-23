'use strict';

/**
 * css-hidden-focus in a real browser, which restyles an element when it
 * takes focus: the rule's focus probe leaves focus where it found it, so
 * the rules after it and the next scan see the page as it was, and a
 * GOV.UK-style skip link, hidden by `:not(:focus):not(.\\:focus)`, is
 * recognised as revealed on focus.
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

const RULE_ID = 'css-hidden-focus';
const { addBundle } = require('../../helpers/browserBundle');

const HIDE =
  'position:absolute!important;width:1px!important;height:1px!important;margin:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important';
const page = (selector) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>${selector}{${HIDE}}</style></head><body>` +
  '<a id="skip" class="skip" href="#main">Skip to main content</a><main id="main"><h1>Title</h1></main></body></html>';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function open(html) {
    const p = await browser.newPage();
    await p.setContent(html);
    await addBundle(p);
    return p;
  }
  const scan = (p, engineOptions) =>
    p.evaluate(
      ([id, opts]) => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, opts, null);
        const own = r.checksResults.find((c) => c.ruleId === id);
        return {
          findings: own ? own.occurrences.map((o) => o.selector) : null,
          focused: document.activeElement && document.activeElement.id
        };
      },
      [RULE_ID, engineOptions]
    );

  await t.test('focus is left where it was, so a second scan agrees with the first', async () => {
    // Hidden at rest, not revealed on focus by any rule: asked about.
    const p = await open(page('.skip'));
    try {
      const first = await scan(p, { rules: { include: RULE_ID } });
      assert.deepEqual(first.findings, ['#skip']);
      assert.equal(first.focused, '', 'nothing is left focused');
      assert.deepEqual(await scan(p, { rules: { include: RULE_ID } }), first);
      // A full scan leaves nothing focused either, for the rules after it.
      assert.equal((await scan(p, {})).focused, '');
    } finally {
      await p.close();
    }
  });

  // A link whose own styles show it, in a container that hides it.
  const hintsOf = (p) =>
    p.evaluate((id) => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null);
      const own = r.checksResults.find((c) => c.ruleId === id);
      return Object.fromEntries(
        own.occurrences.map((o) => [o.selector, o.data.details.metrics.visibilityHints.join(',')])
      );
    }, RULE_ID);
  const doc = (css, body) =>
    `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0}${css}</style></head><body>${body}</body></html>`;
  const MENU = '<nav id="nav"><a id="in-menu" href="/a">Account</a></nav><main><p>Text</p></main>';

  for (const [name, css, expected] of [
    [
      'an off-canvas menu slid out of view',
      '#nav{position:fixed;top:0;left:0;width:300px;height:100%;overflow-y:auto;transform:translateX(-100%)}',
      { '#in-menu': 'outOfReach' }
    ],
    [
      'a menu slid off to the right',
      '#nav{position:fixed;top:0;right:0;width:300px;transform:translateX(100%)}',
      { '#in-menu': 'outOfReach' }
    ],
    [
      'a menu positioned left of the page',
      '#nav{position:absolute;left:-400px;width:300px}',
      { '#in-menu': 'outOfReach' }
    ],
    [
      'a menu in a container clipped to nothing',
      '#nav{position:absolute;clip:rect(0 0 0 0);clip-path:inset(50%)}',
      { '#in-menu': 'containerClipped' }
    ],
    ['an open off-canvas menu', '#nav{position:fixed;top:0;left:0;width:300px}', {}],
    [
      'a menu a :focus-within rule brings into view',
      '#nav{position:fixed;left:0;width:300px;transform:translateX(-100%)}#nav:focus-within{transform:none}',
      {}
    ],
    ['a menu scaled to nothing', '#nav{transform:scale(0)}', { '#in-menu': 'containerClipped' }],
    [
      'a menu a :has() rule brings into view',
      '#nav{position:fixed;left:0;width:300px;transform:translateX(-100%)}body:has(#nav a:focus) #nav{transform:none}',
      {}
    ],
    [
      'a menu a nested :focus-within rule brings into view',
      '#nav{position:fixed;left:0;width:300px;transform:translateX(-100%);&:focus-within{transform:none}}',
      {}
    ],
    [
      'a closed menu hidden with visibility',
      '#nav{position:fixed;left:0;width:300px;transform:translateX(-100%);visibility:hidden}',
      {}
    ]
  ]) {
    await t.test(`${name}: ${JSON.stringify(expected)}`, async () => {
      const p = await open(doc(css, MENU));
      try {
        assert.deepEqual(await hintsOf(p), expected);
      } finally {
        await p.close();
      }
    });
  }

  await t.test(
    'a carousel slide past the edge of its overflow:hidden track is not asked about',
    async () => {
      // Focus scrolls the track to the slide, so it comes into view.
      const p = await open(
        doc(
          '#track{width:300px;overflow:hidden;white-space:nowrap}.slide{display:inline-block;width:300px}',
          '<div id="track"><div class="slide"><a href="/1">One</a></div><div class="slide"><a href="/2">Two</a></div><div class="slide"><a href="/3">Three</a></div></div>'
        )
      );
      try {
        assert.deepEqual(await hintsOf(p), {});
      } finally {
        await p.close();
      }
    }
  );

  // Both seen on live pages: a link whose only content is absolutely
  // positioned has a box with no width at x = 0, and a skip link is slid in
  // by its own focus rule.
  await t.test('a box with no width on the page edge is not out of reach', async () => {
    const p = await open(
      doc(
        '#pic{position:absolute;left:300px;top:0;width:200px;height:50px}',
        '<div><a href="/x"><span id="pic"></span></a></div>'
      )
    );
    try {
      assert.deepEqual(await hintsOf(p), {});
    } finally {
      await p.close();
    }
  });

  await t.test('a skip link its own :focus rule slides into view is not asked about', async () => {
    const p = await open(
      doc(
        '.skip{position:absolute;top:0;transform:translateY(-200%)}.skip:focus{transform:none}',
        '<a class="skip" href="#m">Skip to content</a><main id="m">x</main>'
      )
    );
    try {
      assert.deepEqual(await hintsOf(p), {});
    } finally {
      await p.close();
    }
  });

  await t.test('a link further down a long page is not asked about', async () => {
    const p = await open(
      doc('#spacer{height:5000px}', '<div id="spacer"></div><a href="/x">End</a>')
    );
    try {
      assert.deepEqual(await hintsOf(p), {});
    } finally {
      await p.close();
    }
  });

  // A skip link moved out of view, with a focus rule to bring it back.
  const SKIP = '<a id="skip" href="#m">Skip</a><main id="m"><p>Text</p></main>';
  for (const [name, css, expected] of [
    ['revealed by :focus', '#skip{position:absolute;top:-40px}#skip:focus{top:0}', {}],
    ['revealed by a nested &:focus', '#skip{position:absolute;top:-40px;&:focus{top:0}}', {}],
    [
      'kept out of view by an !important rule its :focus rule cannot override',
      '#skip{position:absolute!important;top:-40px!important}#skip:focus{top:0}',
      { '#skip': 'outOfReach' }
    ],
    [
      'revealed by an !important :focus rule',
      '#skip{position:absolute;top:-40px!important}#skip:focus{top:0!important}',
      {}
    ]
  ]) {
    await t.test(`a skip link ${name}: ${JSON.stringify(expected)}`, async () => {
      const p = await open(doc(css, SKIP));
      try {
        assert.deepEqual(await hintsOf(p), expected);
      } finally {
        await p.close();
      }
    });
  }

  await t.test(
    'a link past an overflow: clip box, which focus does not scroll, is asked about',
    async () => {
      const p = await open(
        doc(
          '.track{overflow-x:clip;width:300px;white-space:nowrap}.slide{display:inline-block;width:300px}',
          '<div class="track"><div class="slide"><a id="one" href="/1">One</a></div><div class="slide"><a id="two" href="/2">Two</a></div></div>'
        )
      );
      try {
        assert.deepEqual(await hintsOf(p), { '#two': 'containerClipped' });
      } finally {
        await p.close();
      }
    }
  );

  await t.test('a GOV.UK-style skip link revealed on focus is not asked about', async () => {
    const p = await open(page('.skip:not(:active):not(:focus):not(.\\:focus)'));
    try {
      assert.deepEqual(await scan(p, { rules: { include: RULE_ID } }), {
        findings: [],
        focused: ''
      });
    } finally {
      await p.close();
    }
  });
});
