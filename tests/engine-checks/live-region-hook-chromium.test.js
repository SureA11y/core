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
      environment: r.engine.environment,
      announcements: said && said.map((a) => [a.text, a.politeness, a.element.id])
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
