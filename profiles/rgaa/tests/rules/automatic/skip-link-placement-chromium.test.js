'use strict';

/**
 * skip-link-placement in a real browser: visibility at rest and on focus,
 * place and focus order against other pages through the crawl.skipLinks
 * probe, and the WCAG and RGAA rollups side by side under the RGAA profile.
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

const RULE_ID = 'skip-link-placement';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../../../surea11y.browser.js'), 'utf8');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);
const WIDTH = 1280;

function page(css, before = '') {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>body{margin:0} ${css}</style></head><body>${before}<a class="skip" id="skip" href="#main">Aller au contenu</a><nav><a href="/a">A</a> <a href="/b">B</a></nav><main id="main"><h1>Titre</h1><p>Texte</p></main><input id="field" aria-label="Champ"></body></html>`;
}
const HIDDEN_UNTIL_FOCUS = '.skip{position:absolute;left:-9999px} .skip:focus{left:8px;top:8px}';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, engineOptions = {}) {
    const p = await browser.newPage({ viewport: { width: WIDTH, height: 800 } });
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      await p.evaluate(() => {
        const f = document.getElementById('field');
        if (f) f.focus();
      });
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        { rules: { include: RULE_ID }, ...engineOptions }
      );
      const after = await p.evaluate(() => ({
        active: document.activeElement && document.activeElement.id,
        style:
          document.getElementById('skip') && document.getElementById('skip').getAttribute('style')
      }));
      return { result, after, rule: result.checksResults.find((r) => r.ruleId === RULE_ID) };
    } finally {
      await p.close();
    }
  }
  const reasons = (rule) =>
    (rule.occurrences || []).map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
  // Another page's record, flat as the rule reports it.
  const other = (box, extra = {}) => ({
    probes: {
      'crawl.skipLinks': {
        pages: [
          {
            url: 'https://example.test/other',
            viewportWidth: WIDTH,
            skipLink: { text: 'Aller au contenu', href: '#main', focusOrder: 0, ...box },
            ...extra
          }
        ]
      }
    }
  });
  const boxOf = (rule) => {
    const { x, y, width, height } = rule.data.page.skipLink;
    return { x, y, width, height };
  };

  await t.test('the fixture: shown on focus, so only its place is asked about', async () => {
    const { rule } = await scan(FIXTURE);
    assert.deepEqual(reasons(rule), [['cantTell', 'SKIP_LINK_SINGLE_PAGE']]);
    const box = boxOf(rule);
    assert.equal(box.x, 8);
    assert.equal(box.y, 8);
    assert.ok(box.width > 0 && box.height > 0);
  });

  await t.test(
    'visible at rest or on focus, at the same place as on another page: pass',
    async () => {
      for (const css of ['', HIDDEN_UNTIL_FOCUS]) {
        const first = await scan(page(css));
        const box = boxOf(first.rule);
        assert.ok(box.width > 0, css);
        const { rule, after } = await scan(page(css), other({ ...box, x: box.x + 20 }));
        assert.equal(rule.outcome, 'pass', css);
        assert.equal(after.active, 'field', 'focus goes back where it was');
        assert.equal(after.style, null, 'the style attribute is put back');
      }
    }
  );

  await t.test('never visible, even on focus: fail', async () => {
    for (const css of [
      '.skip{position:absolute;left:-9999px}',
      '.skip{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
      '.skip{opacity:0}'
    ]) {
      const { rule } = await scan(page(css));
      assert.deepEqual(
        reasons(rule),
        [
          ['fail', 'SKIP_LINK_NOT_VISIBLE'],
          ['cantTell', 'SKIP_LINK_SINGLE_PAGE']
        ],
        css
      );
      assert.equal(rule.outcome, 'fail', css);
    }
  });

  await t.test('covered by another element: asked about', async () => {
    const { rule } = await scan(
      page(
        '.skip{position:absolute;top:0;left:0} .cover{position:absolute;top:0;left:0;width:300px;height:60px;background:#fff;z-index:5}',
        '<div class="cover"></div>'
      )
    );
    assert.deepEqual(reasons(rule)[0], ['cantTell', 'SKIP_LINK_VISIBILITY_UNKNOWN']);
    assert.equal(rule.occurrences[0].data.details.cause, 'covered');
  });

  await t.test(
    'another page shows it elsewhere, in another order, or at another width',
    async () => {
      const { rule: first } = await scan(page(''));
      const box = boxOf(first);

      const moved = await scan(page(''), other({ ...box, y: box.y + 200 }));
      assert.deepEqual(reasons(moved.rule), [['fail', 'SKIP_LINK_POSITION_DIFFERS']]);
      assert.equal(moved.rule.occurrences[0].i18n.params.pages, 'https://example.test/other');

      const reordered = await scan(page(''), {
        probes: {
          'crawl.skipLinks': {
            pages: [
              {
                url: 'https://example.test/other',
                viewportWidth: WIDTH,
                skipLink: { focusOrder: 4, ...box }
              }
            ]
          }
        }
      });
      assert.deepEqual(reasons(reordered.rule), [['cantTell', 'SKIP_LINK_ORDER_DIFFERS']]);

      const narrow = await scan(page(''), other(box, { viewportWidth: 375 }));
      assert.deepEqual(reasons(narrow.rule), [['cantTell', 'SKIP_LINK_VIEWPORT_DIFFERS']]);
    }
  );

  await t.test('under the RGAA profile: WCAG 2.4.1 does not fail, RGAA 12.7 does', async () => {
    const { result } = await scan(page('.skip{position:absolute;left:-9999px}'), {
      rules: undefined,
      profile: 'rgaa-4.1.2'
    });
    const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id);
    assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'fail');
    assert.notEqual(rollup('wcag-2.4.1-bypass-blocks').outcome, 'fail');
    assert.equal(rollup('rgaa-4.1.2-12.7').outcome, 'fail');
  });
});
