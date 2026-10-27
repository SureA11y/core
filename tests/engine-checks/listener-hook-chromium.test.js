'use strict';

/**
 * The listener hook (listenerHookScript) in Chromium. Without it the keyboard
 * rules see only inline handler attributes. Installed before the page's
 * scripts (Playwright's addInitScript), it records the listeners the page
 * adds with addEventListener or an onclick-style property, on elements, the
 * document and the window: a control given a click listener and no key
 * listener anywhere fails click-handler-keyboard-operable, one with its own
 * key listener passes, and one whose only key listener is on the document,
 * or on a shadow root it is in, is asked about. The page's listeners still run, and are removed with the same
 * functions. engine.environment.listenerHook says whether a scan saw the
 * hook.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { listenerHookScript } = require('../../src/index.js');

const { addBundle } = require('../helpers/browserBundle');

function page(body, script) {
  return `<!doctype html><html lang="en"><head><title>Listener hook</title></head><body><main><h1>Listener hook</h1>${body}</main><script>${script}</script></body></html>`;
}

// Serves the page from one origin, so the init script runs as on a real site.
async function open(browser, html, { hook = true } = {}) {
  const p = await browser.newPage();
  if (hook) await p.addInitScript({ content: listenerHookScript() });
  await p.route('https://example.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: html })
  );
  await p.goto('https://example.test/');
  return p;
}

async function scan(p, ruleId) {
  await addBundle(p);
  return p.evaluate((id) => {
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]);
    const c = r.checksResults[0];
    return {
      outcome: c.outcome,
      codes: c.occurrences.map((o) => o.data.details.reasonCode),
      environment: r.engine.environment
    };
  }, ruleId);
}

const BUTTONS = `
  <div id="none" role="button" tabindex="0">No keys</div>
  <div id="own" role="button" tabindex="0">Own keys</div>
  <div id="prop" role="button" tabindex="0">Property</div>`;
const SCRIPT = `
  const f = () => {};
  document.getElementById('none').addEventListener('click', f);
  document.getElementById('own').addEventListener('click', f);
  document.getElementById('own').addEventListener('keydown', f);
  document.getElementById('prop').onclick = f;
  document.getElementById('prop').onkeyup = f;`;

test('the listener hook in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('without it, listeners added from script are not seen', async () => {
    const p = await open(browser, page(BUTTONS, SCRIPT), { hook: false });
    const got = await scan(p, 'click-handler-keyboard-operable');
    assert.equal(got.outcome, 'notApplicable');
    assert.equal(got.environment.listenerHook, undefined);
    await p.close();
  });

  await t.test('early, a control with a click listener and no key listener fails', async () => {
    const p = await open(browser, page(BUTTONS, SCRIPT));
    const got = await scan(p, 'click-handler-keyboard-operable');
    assert.equal(got.environment.listenerHook, 'early');
    assert.deepEqual([got.outcome, got.codes], ['fail', ['CLICK_HANDLER_NO_KEY_LISTENER']]);
    await p.close();
  });

  await t.test('a key listener on the document is asked about', async () => {
    const p = await open(
      browser,
      page(BUTTONS, `${SCRIPT} document.addEventListener('keydown', f);`)
    );
    const got = await scan(p, 'click-handler-keyboard-operable');
    assert.deepEqual([got.outcome, got.codes], ['cantTell', ['CLICK_HANDLER_KEY_LISTENER_ABOVE']]);
    await p.close();
  });

  // A component that listens on its own shadow root, as Lit's renderRoot
  // does: Tab then Enter works, so the rule can't fail it. The listener may
  // serve this button or others, so it is asked about, as one on an
  // ancestor is. Before, the shadow root was never looked at, and both
  // buttons failed CLICK_HANDLER_NO_KEY_LISTENER.
  await t.test('a key listener on a shadow root the control is in is asked about', async () => {
    const p = await open(
      browser,
      page(
        '<x-own></x-own><x-slot><div id="s" role="button" tabindex="0">Slotted</div></x-slot>',
        `window.hits = 0;
         const enter = (e) => { if (e.key === 'Enter') e.target.click(); };
         customElements.define('x-own', class extends HTMLElement {
           constructor() {
             super();
             const r = this.attachShadow({ mode: 'open' });
             r.innerHTML = '<div id="b" role="button" tabindex="0">Own</div>';
             r.getElementById('b').addEventListener('click', () => window.hits++);
             r.addEventListener('keydown', enter);
           }
         });
         customElements.define('x-slot', class extends HTMLElement {
           constructor() {
             super();
             const r = this.attachShadow({ mode: 'open' });
             r.innerHTML = '<div><slot></slot></div>';
             r.addEventListener('keydown', enter);
           }
         });
         document.getElementById('s').addEventListener('click', () => window.hits++);`
      )
    );
    await p.keyboard.press('Tab');
    await p.keyboard.press('Enter');
    await p.keyboard.press('Tab');
    await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(() => window.hits), 2);
    const got = await scan(p, 'click-handler-keyboard-operable');
    assert.deepEqual(
      [got.outcome, got.codes],
      ['cantTell', ['CLICK_HANDLER_KEY_LISTENER_ABOVE', 'CLICK_HANDLER_KEY_LISTENER_ABOVE']]
    );
    await p.close();
  });

  await t.test('the page’s listeners still run, and come off with the same function', async () => {
    const p = await open(
      browser,
      page(
        '<button id="b">x</button>',
        `window.hits = 0; const g = () => { window.hits++; };
         const b = document.getElementById('b');
         b.addEventListener('click', g); b.click();
         b.removeEventListener('click', g); b.click();
         b.onclick = g; b.click();`
      )
    );
    assert.equal(await p.evaluate(() => window.hits), 2);
    const names = await p.evaluate(() => [
      EventTarget.prototype.addEventListener.name,
      EventTarget.prototype.addEventListener.length,
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onclick').set.name
    ]);
    assert.deepEqual(names, ['addEventListener', 2, 'set onclick']);
    await p.close();
  });

  await t.test('a window property handler is recorded where Chromium defines it', async () => {
    const p = await open(
      browser,
      page(
        '<div id="a" role="button" tabindex="0">Go</div>',
        `document.getElementById('a').addEventListener('click', () => {}); window.onkeydown = () => {};`
      )
    );
    const got = await scan(p, 'click-handler-keyboard-operable');
    assert.deepEqual(got.codes, ['CLICK_HANDLER_KEY_LISTENER_ABOVE']);
    await p.close();
  });
});
