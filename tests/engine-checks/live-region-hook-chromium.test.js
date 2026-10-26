'use strict';

/**
 * The live-region hook (liveRegionHookScript) in Chromium. Installed before
 * the page's scripts (Playwright's addInitScript), it records each text a
 * shown live region is given after the page loads, which the browser
 * bundle's getAnnouncements() returns, and the two ways of filling a region
 * that live-region-announcements asks about: a region added with its text
 * already in it, and a hidden region shown and filled in the same task.
 * Visibility is read with Chromium's checkVisibility(). The page's own
 * changes are untouched. engine.environment.liveRegionHook says whether a
 * scan saw the hook.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { liveRegionHookScript } = require('../../src/index.js');

const { addBundle } = require('../helpers/browserBundle');

const RULE_ID = 'live-region-announcements';

function page(body) {
  return `<!doctype html><html lang="en"><head><title>Live regions</title></head><body><main><h1>Live regions</h1>${body}</main></body></html>`;
}

// Serves the page from one origin, so the init script runs as on a real site,
// and waits for it to load.
async function open(browser, html, { hook = true } = {}) {
  const p = await browser.newPage();
  if (hook) await p.addInitScript({ content: liveRegionHookScript() });
  await p.route('https://example.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: html })
  );
  await p.goto('https://example.test/', { waitUntil: 'load' });
  return p;
}

// Runs each script as a task of its own.
async function act(p, scripts) {
  for (const script of scripts) {
    await p.evaluate(script);
  }
}

async function scan(p) {
  await addBundle(p);
  return p.evaluate((id) => {
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]);
    const c = r.checksResults[0];
    const said = window.a11ycore.getAnnouncements();
    return {
      outcome: c.outcome,
      details: c.occurrences.map((o) => o.data.details),
      leans: c.occurrences.map((o) => (o.lean ? o.lean.toward : null)),
      environment: r.engine.environment,
      announcements: said && said.map((a) => [a.text, a.politeness, a.element.id]),
      behindModal: (window.a11ycore.getAnnouncements({ includeBehindModal: true }) || [])
        .filter((a) => a.behindModal)
        .map((a) => a.element.id)
    };
  }, RULE_ID);
}

test('the live-region hook in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('without it, there is nothing to read', async () => {
    const p = await open(browser, page('<div id="s" role="status"></div>'), { hook: false });
    await act(p, ["document.getElementById('s').textContent = 'Saved'"]);
    const got = await scan(p);
    assert.equal(got.announcements, null);
    assert.equal(got.environment.liveRegionHook, undefined);
    assert.equal(got.outcome, 'pass');
    await p.close();
  });

  await t.test(
    'the texts shown regions are given are what the page made available to announce',
    async () => {
      const p = await open(
        browser,
        page(
          '<div id="s" role="status"></div><div id="a" aria-live="assertive"></div><div id="h" role="status" style="display:none"></div><div aria-hidden="true"><div id="x" role="status"></div></div>'
        )
      );
      await act(p, [
        "document.getElementById('s').textContent = 'Saved'",
        "document.getElementById('a').textContent = 'Two errors'",
        "document.getElementById('h').textContent = 'Hidden'",
        "document.getElementById('x').textContent = 'Out of reach'"
      ]);
      const got = await scan(p);
      assert.equal(got.environment.liveRegionHook, 'early');
      assert.deepEqual(got.announcements, [
        ['Saved', 'polite', 's'],
        ['Two errors', 'assertive', 'a']
      ]);
      // The aria-hidden region is asked about as it is now; the rest pass.
      assert.deepEqual(
        got.details.map((d) => d.reasonCode),
        ['LIVE_REGION_HIDDEN']
      );
      await p.close();
    }
  );

  await t.test(
    'a region added with its text, and one shown and filled at once, are asked about',
    async () => {
      const p = await open(
        browser,
        page(
          '<div id="w"></div><div id="h" role="status" hidden></div><div id="v" role="status" style="visibility:hidden"></div>'
        )
      );
      await act(p, [
        'document.getElementById(\'w\').innerHTML = \'<div id="t" role="status">Copied</div>\'',
        "document.getElementById('w').insertAdjacentHTML('beforeend', '<div id=\"e\" role=\"alert\">Failed</div>')",
        "const h = document.getElementById('h'); h.hidden = false; h.textContent = 'Together'",
        "document.getElementById('v').style.visibility = 'visible'",
        "document.getElementById('v').textContent = 'Apart'"
      ]);
      const got = await scan(p);
      assert.equal(got.outcome, 'cantTell');
      assert.deepEqual(
        got.details.map((d) => [d.reasonCode, d.text]),
        [
          ['LIVE_REGION_INSERTED_WITH_CONTENT', 'Copied'],
          ['LIVE_REGION_SHOWN_AND_FILLED', 'Together']
        ]
      );
      assert.deepEqual(got.announcements, [
        ['Failed', 'assertive', 'e'],
        ['Apart', 'polite', 'v']
      ]);
      await p.close();
    }
  );

  // A modal <dialog> makes the page behind it inert. The hook records when
  // the dialog was opened; text given to a region behind it after that was
  // given while the region was inert.
  await t.test('a region behind a modal dialog leans fail on what the hook saw', async () => {
    const html = page(
      '<div id="b" role="status"></div><dialog id="d" aria-label="Sign in"><div id="i" role="status"></div><button>OK</button></dialog>'
    );
    const run = async (steps, body = html) => {
      const p = await open(browser, body);
      for (const step of steps) {
        await p.evaluate(step);
        await p.waitForTimeout(5);
      }
      const got = await scan(p);
      await p.close();
      return got;
    };
    const showModal = "document.getElementById('d').showModal()";
    const close = "document.getElementById('d').close()";
    const inside = "document.getElementById('i').textContent = 'Wrong password'";
    const behind = "document.getElementById('b').textContent = 'Saved'";
    const hidden = (lean) => [
      [{ reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'modal' }, lean]
    ];

    // The region inside the dialog was shown by the dialog opening, then
    // given its text: an announcement, not shown and filled at once.
    const after = await run([showModal, inside, behind]);
    assert.equal(after.outcome, 'cantTell');
    assert.deepEqual(
      after.details.map((d, i) => [d, after.leans[i]]),
      hidden('fail')
    );
    // 'Saved' was given while the region was inert: left out, and listed,
    // marked, only on request.
    assert.deepEqual(after.announcements, [['Wrong password', 'polite', 'i']]);
    assert.deepEqual(after.behindModal, ['b']);

    // Given its text before the dialog opened: no lean.
    const before = await run([behind, showModal, inside]);
    assert.deepEqual(
      before.details.map((d, i) => [d, before.leans[i]]),
      hidden(null)
    );

    // In one task, the order the page did it in decides.
    assert.deepEqual(
      (await run([`${showModal}; ${behind}`])).leans,
      ['fail'],
      'opened, then given text'
    );
    assert.deepEqual(
      (await run([`${behind}; ${showModal}`])).leans,
      [null],
      'given text, then opened'
    );
    assert.deepEqual((await run([`${behind}; ${showModal}`])).behindModal, []);

    // Closed and opened again after the text: only the last opening counts.
    assert.deepEqual((await run([showModal, behind, close, showModal])).leans, [null]);

    // A dialog the hook never saw open has been open since it started
    // watching (here, opened before the page loaded).
    const opened = html.replace(
      '</main>',
      "</main><script>document.getElementById('d').showModal()</script>"
    );
    assert.deepEqual((await run([behind], opened)).leans, ['fail']);
  });

  await t.test(
    'a region shown because its dialog, details or popover opened counts from its next text',
    async () => {
      const p = await open(
        browser,
        page(
          '<dialog id="d"><div id="i" role="status"></div></dialog>' +
            '<dialog id="e"><div id="j" role="status"></div></dialog>' +
            '<details id="t"><summary>More</summary><div id="k" role="status"></div></details>' +
            '<div id="p" popover><div id="m" role="status"></div></div>' +
            '<div id="q" popover><div id="n" role="status"></div></div>' +
            '<dialog id="f"><div id="h" role="status" hidden></div></dialog>'
        )
      );
      await act(p, [
        "document.getElementById('d').show()",
        "document.getElementById('i').textContent = 'In the dialog'",
        "document.getElementById('j').textContent = 'Before'; document.getElementById('e').setAttribute('open', '')",
        "document.getElementById('t').open = true",
        "document.getElementById('k').textContent = 'In the details'",
        "document.getElementById('p').showPopover()",
        "document.getElementById('m').textContent = 'In the popover'",
        "document.getElementById('n').textContent = 'Early'; document.getElementById('q').showPopover(); document.getElementById('n').textContent = 'Late'",
        // Shown by the dialog, then shown and filled by the page at once.
        "document.getElementById('f').show()",
        "const h = document.getElementById('h'); h.hidden = false; h.textContent = 'Together'"
      ]);
      const got = await scan(p);
      assert.deepEqual(got.announcements, [
        ['In the dialog', 'polite', 'i'],
        ['In the details', 'polite', 'k'],
        ['In the popover', 'polite', 'm'],
        ['Late', 'polite', 'n']
      ]);
      assert.deepEqual(
        got.details.map((d) => [d.reasonCode, d.text]),
        [['LIVE_REGION_SHOWN_AND_FILLED', 'Together']]
      );
      await p.close();
    }
  );

  await t.test('the page’s own changes are as they would be', async () => {
    const p = await open(browser, page('<div id="s" role="status">a</div>'));
    const seen = await p.evaluate(() => {
      const s = document.getElementById('s');
      const records = [];
      const o = new MutationObserver((r) => records.push(...r));
      o.observe(s, { childList: true, characterData: true, subtree: true });
      s.textContent = 'b';
      return [s.textContent, o.takeRecords().length + records.length];
    });
    assert.deepEqual(seen, ['b', 1]);
    await p.close();
  });
});
