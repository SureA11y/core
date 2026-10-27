'use strict';

/**
 * A <dialog> opened with showModal() in a real browser: the rest of the
 * page is inert, and Chromium's accessibility tree holds only the dialog
 * (#58). jsdom has no top layer, so this runs in Chromium.
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

const PAGE =
  '<!doctype html><html lang="en"><head><title>Shop</title></head><body>' +
  '<nav aria-label="Primary"><a href="/">Home</a></nav>' +
  '<main><h1>Shop</h1><img id="behind" src="x.png"></main>' +
  '<dialog id="d" aria-label="Sign in"><nav aria-label="Primary"><a href="/a">A</a></nav>' +
  '<img id="inside" src="y.png"><button>Close</button></dialog></body></html>';

const RULES = [
  'img-alt-present',
  'landmark-unique',
  'page-has-heading-one',
  'landmark-one-main',
  'bypass-blocks-present',
  'region'
];

test('a modal dialog in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(open) {
    const p = await browser.newPage();
    await p.setContent(PAGE);
    await p.evaluate((how) => {
      const d = document.getElementById('d');
      if (how === 'modal') d.showModal();
      if (how === 'non-modal') d.show();
      if (how === 'open-attr-aria-modal') {
        d.setAttribute('aria-modal', 'true');
        d.setAttribute('open', '');
      }
      if (how === 'show-aria-modal') {
        d.setAttribute('aria-modal', 'true');
        d.show();
      }
      if (how === 'aria-modal-div') {
        const div = document.createElement('div');
        div.setAttribute('role', 'dialog');
        div.setAttribute('aria-modal', 'true');
        div.setAttribute('aria-label', 'Sign in');
        div.innerHTML = '<img id="inside" src="y.png"><button>Close</button>';
        document.body.appendChild(div);
      }
      if (how === 'closed') {
        d.showModal();
        d.close();
      }
      // The dialog moved into a component's shadow root, with an image the
      // page slots into it and one it slots beside it.
      if (how.startsWith('shadow')) {
        const host = document.createElement('div');
        host.id = 'host';
        host.innerHTML =
          '<img slot="in" id="slotted-in" src="z.png"><img id="slotted-out" src="w.png">';
        document.body.appendChild(host);
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = '<slot></slot>';
        d.appendChild(document.createElement('slot')).name = 'in';
        root.appendChild(d);
        if (how === 'shadow-modal') d.showModal();
        if (how === 'shadow-non-modal') d.show();
        if (how === 'shadow-aria-modal-div') {
          d.remove();
          const div = document.createElement('div');
          div.setAttribute('role', 'dialog');
          div.setAttribute('aria-modal', 'true');
          div.setAttribute('aria-label', 'Sign in');
          div.innerHTML = '<button>Close</button>';
          root.appendChild(div);
        }
      }
    }, open);
    await addBundle(p);
    const out = await p.evaluate((rules) => {
      const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
      const o = {};
      for (const id of rules) {
        const c = r.checksResults.find((x) => x.ruleId === id);
        o[id] = { outcome: c.outcome, html: c.occurrences.map((x) => x.html || '') };
      }
      return o;
    }, RULES);
    await p.close();
    return out;
  }

  await t.test('content behind the modal is not judged; content inside it is', async () => {
    const r = await scan('modal');
    assert.equal(r['img-alt-present'].outcome, 'fail');
    assert.equal(r['img-alt-present'].html.length, 1);
    assert.ok(r['img-alt-present'].html[0].includes('id="inside"'));
    assert.equal(r['landmark-unique'].outcome, 'notApplicable');
  });

  await t.test("rules about the page's structure are notApplicable while it is open", async () => {
    const r = await scan('modal');
    for (const id of [
      'page-has-heading-one',
      'landmark-one-main',
      'bypass-blocks-present',
      'region'
    ]) {
      assert.equal(r[id].outcome, 'notApplicable', id);
    }
  });

  await t.test('once the dialog is closed, the page is judged as usual', async () => {
    const r = await scan('closed');
    assert.equal(r['img-alt-present'].outcome, 'fail');
    assert.ok(r['img-alt-present'].html.some((h) => h.includes('id="behind"')));
    assert.equal(r['page-has-heading-one'].outcome, 'pass');
    assert.equal(r['landmark-one-main'].outcome, 'pass');
  });

  await t.test('a dialog opened with show() is not modal and changes nothing', async () => {
    const r = await scan('non-modal');
    assert.ok(r['img-alt-present'].html.some((h) => h.includes('id="behind"')));
    assert.equal(r['page-has-heading-one'].outcome, 'pass');
  });

  // aria-modal="true" does not make a dialog modal: opened with the open
  // attribute or show(), the page behind stays reachable by keyboard and in
  // Chromium's accessibility tree, so the engine keeps judging it.
  for (const how of ['open-attr-aria-modal', 'show-aria-modal']) {
    await t.test(
      `a dialog with aria-modal="true" that is not modal (${how}) leaves the page judged`,
      async () => {
        const r = await scan(how);
        assert.ok(r['img-alt-present'].html.some((h) => h.includes('id="behind"')));
        assert.ok(r['img-alt-present'].html.some((h) => h.includes('id="inside"')));
        assert.equal(r['page-has-heading-one'].outcome, 'pass');
        assert.equal(r['landmark-one-main'].outcome, 'pass');
      }
    );
  }

  // A dialog opened with showModal() in a shadow tree is in the top layer
  // too, and the rest of the document is inert behind it.
  await t.test('a modal dialog in a shadow root', async () => {
    const r = await scan('shadow-modal');
    const imgs = r['img-alt-present'].html;
    assert.ok(
      imgs.some((h) => h.includes('id="inside"')),
      'inside'
    );
    assert.ok(
      imgs.some((h) => h.includes('id="slotted-in"')),
      'slotted into the dialog'
    );
    assert.ok(!imgs.some((h) => h.includes('id="behind"')), 'behind');
    assert.ok(!imgs.some((h) => h.includes('id="slotted-out"')), 'slotted beside the dialog');
    for (const id of [
      'page-has-heading-one',
      'landmark-one-main',
      'bypass-blocks-present',
      'region'
    ]) {
      assert.equal(r[id].outcome, 'notApplicable', id);
    }

    const plain = await scan('shadow-non-modal');
    assert.ok(plain['img-alt-present'].html.some((h) => h.includes('id="behind"')));
    assert.equal(plain['page-has-heading-one'].outcome, 'pass');

    const aria = await scan('shadow-aria-modal-div');
    assert.ok(aria['img-alt-present'].html.some((h) => h.includes('id="behind"')));
    assert.equal(aria['page-has-heading-one'].outcome, 'notApplicable');
  });

  // A script-made modal, role="dialog" with aria-modal="true", makes
  // nothing inert: the page behind it is still judged, but the structure
  // rules know the scan saw a dialog.
  await t.test('a shown role="dialog" with aria-modal="true"', async () => {
    const r = await scan('aria-modal-div');
    assert.ok(r['img-alt-present'].html.some((h) => h.includes('id="behind"')));
    assert.ok(r['img-alt-present'].html.some((h) => h.includes('id="inside"')));
    for (const id of [
      'page-has-heading-one',
      'landmark-one-main',
      'bypass-blocks-present',
      'region'
    ]) {
      assert.equal(r[id].outcome, 'notApplicable', id);
    }
  });
});
