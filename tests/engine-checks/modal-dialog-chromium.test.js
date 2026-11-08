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

const { addBundle } = require('../helpers/browserBundle');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

// The helpers alone, to ask them about one element in the page.
function helpersBundle() {
  const esbuild = require('esbuild');
  return esbuild.buildSync({
    stdin: {
      contents:
        "const { createDomHelpers } = require('./src/core/dom-helpers.js');\n" +
        'globalThis.__modalTest = { createDomHelpers };\n',
      resolveDir: path.join(__dirname, '../..'),
      sourcefile: 'modal-dialog-chromium-helpers.js'
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'error'
  }).outputFiles[0].text;
}

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

// The same markup gets the same verdicts in jsdom and in Chromium: only a
// dialog opened with showModal() is modal, and markup alone can't open one.
// A <dialog open aria-modal="true"> and a role="dialog" with
// aria-modal="true" leave the page behind judged in both.
const MARKUP = {
  'dialog-open-aria-modal': PAGE.replace('<dialog id="d"', '<dialog id="d" open aria-modal="true"'),
  'div-role-dialog-aria-modal': PAGE.replace(
    /<dialog id="d"([^>]*)>([\s\S]*)<\/dialog>/,
    '<div role="dialog" aria-modal="true"$1>$2</div>'
  )
};

// What a scan says of each rule: its outcome and the ids of what it reported.
function verdicts(result, rules) {
  const o = {};
  for (const id of rules) {
    const c = result.checksResults.find((x) => x.ruleId === id);
    o[id] = {
      outcome: c.outcome,
      ids: c.occurrences.map((x) => (/id="([^"]+)"/.exec(x.html || '') || [])[1] || null).sort()
    };
  }
  return o;
}

test(
  'a modal dialog: the same markup, the same verdicts in jsdom and Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [name, html] of Object.entries(MARKUP)) {
      await t.test(name, async () => {
        const jsdom = verdicts(runa11yCoreOnHtml(html, { runOnly: RULES }), RULES);
        const p = await browser.newPage();
        await p.setContent(html);
        await addBundle(p);
        const inChromium = await p.evaluate(
          ({ rules, src }) => {
            const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
            return (0, eval)(src)(r, rules);
          },
          { rules: RULES, src: '(' + verdicts.toString() + ')' }
        );
        await p.close();
        assert.deepEqual(inChromium, jsdom);
        assert.ok(jsdom['img-alt-present'].ids.includes('behind'), 'the page behind is judged');
        // A shown role="dialog" with aria-modal="true" makes the rules about
        // the page's structure notApplicable, in both; a <dialog> opened
        // without showModal() does not.
        assert.equal(
          jsdom['landmark-one-main'].outcome,
          name === 'dialog-open-aria-modal' ? 'pass' : 'notApplicable'
        );
      });
    }

    // engineOptions.assumeModal stands in for showModal() where the DOM can't
    // open a modal dialog. A browser can, so it ignores it.
    await t.test('assumeModal is for jsdom: Chromium ignores it', async () => {
      const html = MARKUP['dialog-open-aria-modal'];
      const opts = { runOnly: RULES, engineOptions: { assumeModal: true } };
      const jsdom = verdicts(runa11yCoreOnHtml(html, opts), RULES);
      assert.ok(!jsdom['img-alt-present'].ids.includes('behind'), 'jsdom: behind left out');
      assert.equal(jsdom['landmark-one-main'].outcome, 'notApplicable');

      const p = await browser.newPage();
      await p.setContent(html);
      await addBundle(p);
      const inChromium = await p.evaluate(
        ({ rules, src }) => {
          const r = window.a11ycore.runa11yCoreInPage(
            location.href,
            null,
            { assumeModal: true },
            null
          );
          return (0, eval)(src)(r, rules);
        },
        { rules: RULES, src: '(' + verdicts.toString() + ')' }
      );
      await p.close();
      assert.ok(inChromium['img-alt-present'].ids.includes('behind'), 'Chromium: behind judged');
      assert.equal(inChromium['landmark-one-main'].outcome, 'pass');
    });
  }
);

// Behind a dialog opened with showModal(), nothing takes focus: Chromium
// moves focus to none of it, and the helpers say so (isModalInert,
// getFocusableInfo), as they leave it out of the accessibility tree.
test('showModal(): the page behind is inert and takes no focus', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const bundle = helpersBundle();

  const p = await browser.newPage();
  await p.setContent(
    '<!doctype html><html lang="en"><body><a id="link" href="/">Home</a>' +
      '<div id="tab" tabindex="0">Tab stop</div>' +
      '<div id="wrap"><dialog id="d"><button id="ok">OK</button></dialog></div></body></html>'
  );
  await p.addScriptTag({ content: bundle });
  const read = () =>
    p.evaluate(() => {
      // A scan clears the helpers' shared cache when it starts; so does each read.
      window.__a11ycoreSharedCache = {};
      const helpers = window.__modalTest.createDomHelpers({ window, document, root: document });
      const out = {};
      for (const id of ['link', 'tab', 'ok', 'wrap']) {
        const el = document.getElementById(id);
        el.focus();
        out[id] = {
          browser: document.activeElement === el,
          modalInert: helpers.isModalInert(el),
          focusable: helpers.getFocusableInfo(el).focusable,
          flags: helpers.getFocusableInfo(el).flags,
          eligible: helpers.isAccTreeEligible(el).eligible
        };
        el.blur();
      }
      return out;
    });

  const before = await read();
  for (const id of ['link', 'tab']) {
    assert.equal(before[id].browser, true, id);
    assert.equal(before[id].modalInert, false, id);
    assert.equal(before[id].focusable, true, id);
  }

  await p.evaluate(() => document.getElementById('d').showModal());
  const open = await read();
  for (const id of ['link', 'tab']) {
    assert.equal(open[id].browser, false, `${id}: Chromium gives it no focus`);
    assert.equal(open[id].modalInert, true, id);
    assert.equal(open[id].focusable, false, id);
    assert.deepEqual(open[id].flags, ['modalInert'], id);
    assert.equal(open[id].eligible, false, id);
  }
  assert.equal(open.ok.browser, true);
  assert.equal(open.ok.modalInert, false);
  assert.equal(open.ok.focusable, true);
  assert.equal(open.wrap.modalInert, false, 'a wrapper of the dialog is not behind it');
  await p.close();
});

// With two dialogs opened with showModal(), only the one opened last, the
// topmost in the top layer, is live: Chromium makes the one under it inert,
// as the page. The rules judge the topmost one's content alone, and the
// helpers agree with the browser on what takes focus, whichever dialog
// comes first in the document.
test('two modal dialogs: only the topmost one is judged', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const bundle = helpersBundle();
  const html =
    '<!doctype html><html lang="en"><head><title>M</title></head><body>' +
    '<main><img id="bg" src="a.png"></main>' +
    '<dialog id="d1" aria-label="One"><img id="in1" src="b.png"><button id="b1"></button></dialog>' +
    '<dialog id="d2" aria-label="Two"><img id="in2" src="c.png"><button id="b2"></button></dialog>' +
    '</body></html>';

  for (const [first, last] of [
    ['d1', 'd2'],
    ['d2', 'd1']
  ]) {
    await t.test(`${first} opened, then ${last}`, async () => {
      const n = last.slice(1);
      const other = first.slice(1);
      const p = await browser.newPage();
      await p.setContent(html);
      await p.evaluate(
        ([a, b]) => {
          document.getElementById(a).showModal();
          document.getElementById(b).showModal();
        },
        [first, last]
      );
      await p.addScriptTag({ content: bundle });
      const helpers = await p.evaluate(
        (ids) => {
          window.__a11ycoreSharedCache = {};
          const h = window.__modalTest.createDomHelpers({ window, document, root: document });
          const out = {};
          for (const id of ids) {
            const el = document.getElementById(id);
            el.focus();
            out[id] = {
              browser: document.activeElement === el,
              modalInert: h.isModalInert(el),
              focusable: h.getFocusableInfo(el).focusable,
              eligible: h.isAccTreeEligible(el).eligible
            };
            el.blur();
          }
          return out;
        },
        ['b1', 'b2', 'in1', 'in2']
      );
      await addBundle(p);
      const found = await p.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
          'img-alt-present',
          'button-name-present'
        ]);
        const out = {};
        for (const c of r.checksResults)
          out[c.ruleId] = c.occurrences.map((o) => document.querySelector(o.selector).id);
        return out;
      });
      await p.close();

      assert.deepEqual(found['img-alt-present'], [`in${n}`]);
      assert.deepEqual(found['button-name-present'], [`b${n}`]);
      assert.equal(helpers[`b${n}`].browser, true);
      assert.equal(helpers[`b${other}`].browser, false, 'Chromium gives the lower dialog no focus');
      for (const id of [`b${n}`, `in${n}`]) {
        assert.equal(helpers[id].modalInert, false, id);
        assert.equal(helpers[id].eligible, true, id);
      }
      for (const id of [`b${other}`, `in${other}`]) {
        assert.equal(helpers[id].modalInert, true, id);
        assert.equal(helpers[id].eligible, false, id);
      }
      assert.equal(helpers[`b${n}`].focusable, true);
      assert.equal(helpers[`b${other}`].focusable, false);
    });
  }
});
