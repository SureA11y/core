'use strict';

/**
 * A page's named form controls and images can't redirect what the engine
 * reads (#90).
 *
 * HTML declares HTMLFormElement and Document with [LegacyOverrideBuiltIns]: a
 * form's named controls override the form's own properties, and named
 * images, forms, embeds, objects and iframes override document's. A field
 * named "parentNode" made every walk up the tree loop forever, and an image
 * named "documentElement" moved the scan root. jsdom doesn't implement the
 * override, so these tests run in Chromium.
 *
 * Each case compares the page with the same page whose names carry a "z"
 * prefix, which overrides nothing: the results must be identical, with no
 * rule erroring.
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

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');
const FIXTURES = path.join(__dirname, '../fixtures');

// A scan that hasn't returned by then is taken to hang.
const SCAN_TIMEOUT_MS = 20000;

function page(body) {
  return `<!doctype html><html lang="en"><head><title>Named property override</title></head><body><main><h1>Form</h1>${body}</main></body></html>`;
}

// What a scan reports, in a form two scans can be compared by: each rule's
// outcome, error and occurrences (outcome and selector).
function summarize() {
  const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
  return r.checksResults.map((c) => ({
    ruleId: c.ruleId,
    outcome: c.outcome,
    error: c.error || '',
    occurrences: (c.occurrences || []).map((o) => `${o.outcome || ''} ${o.selector || ''}`).sort()
  }));
}

// Adds, inside the page, a form around the whole body whose hidden fields are
// named after every property of a form's prototype chain, and hidden images
// named after every property of document's; `prefix` is prepended to every
// name. Everything is done through the prototypes, since the names it adds
// override the very methods it would otherwise call.
function overrideEverything(prefix) {
  const names = (proto) => {
    const s = new Set();
    for (let p = proto; p; p = Object.getPrototypeOf(p))
      for (const k of Object.getOwnPropertyNames(p)) s.add(k);
    return [...s];
  };
  const create = Document.prototype.createElement.bind(document);
  const append = Node.prototype.appendChild;
  const firstChild = Object.getOwnPropertyDescriptor(Node.prototype, 'firstChild').get;
  const body = document.body;
  const form = create('form');
  for (const n of names(HTMLFormElement.prototype)) {
    const input = create('input');
    input.type = 'hidden';
    input.setAttribute('name', prefix + n);
    append.call(form, input);
  }
  let child;
  while ((child = firstChild.call(body))) append.call(form, child);
  append.call(body, form);
  for (const n of new Set([...names(Document.prototype), ...names(HTMLDocument.prototype)])) {
    const img = create('img');
    img.setAttribute('name', prefix + n);
    img.setAttribute('alt', '');
    img.hidden = true;
    append.call(body, img);
  }
}

test('named form controls and images in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, setup) {
    const context = await browser.newContext();
    try {
      const p = await context.newPage();
      await p.setContent(html);
      if (setup) await p.evaluate(setup.fn, setup.arg);
      // Not addScriptTag: it calls document.createElement, which the page may
      // have overridden.
      await p.evaluate(BUNDLE);
      let timer;
      const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve('timeout'), SCAN_TIMEOUT_MS);
      });
      const result = await Promise.race([p.evaluate(summarize), timeout]);
      clearTimeout(timer);
      return result;
    } finally {
      await context.close();
    }
  }

  // The page with `name` replaced by `z${name}`, which overrides nothing.
  async function assertSameAsControl(markup, name) {
    const overridden = await scan(page(markup.replaceAll('NAME', name)));
    assert.notEqual(overridden, 'timeout', `the scan hung with "${name}"`);
    const control = await scan(page(markup.replaceAll('NAME', `z${name}`)));
    for (const r of overridden) {
      assert.equal(r.error, '', `${r.ruleId} errored with "${name}": ${r.error}`);
    }
    // A selector can carry the name itself (input[name="parentNode"]), so the
    // control's is read back without its prefix.
    const unprefixed = JSON.parse(JSON.stringify(control).replaceAll(`z${name}`, name));
    assert.deepEqual(overridden, unprefixed);
  }

  await t.test('a field named parentNode or parentElement no longer hangs the scan', async () => {
    const markup =
      '<form><input name="NAME" aria-label="Query"><label>Ok <input></label>' +
      '<label for="ok">Other</label><input id="ok"><a href="/x">Products</a></form>';
    await assertSameAsControl(markup, 'parentNode');
    await assertSameAsControl(markup, 'parentElement');
  });

  await t.test('named images no longer redirect document', async () => {
    for (const name of [
      'documentElement',
      'querySelectorAll',
      'getElementById',
      'getElementsByTagName',
      'createTreeWalker',
      'elementFromPoint',
      'body',
      'createRange'
    ]) {
      await assertSameAsControl(
        '<img name="NAME" alt="x"><button></button><img src="x.png">' +
          '<label for="ok">Ok</label><input id="ok"><input aria-label="a" aria-describedby="nope">',
        name
      );
    }
  });

  await t.test('a form named title no longer breaks page-title-present', async () => {
    await assertSameAsControl('<form name="NAME"><input aria-label="q"></form>', 'title');
  });

  await t.test("a form's named fields no longer redirect the form", async () => {
    for (const name of [
      'getAttribute',
      'hasAttribute',
      'attributes',
      'assignedSlot',
      'tagName',
      'nodeType',
      'closest'
    ]) {
      await assertSameAsControl(
        '<form aria-foo="bar" aria-label="Search"><input name="NAME" aria-label="q"><button></button><img src="x"></form>',
        name
      );
    }
  });

  await t.test('every name at once, on fixtures covering every rule', async () => {
    for (const file of ['all-pass.html', 'form-control-label-quality-all-scenarios.html']) {
      const html = fs.readFileSync(path.join(FIXTURES, file), 'utf8');
      const overridden = await scan(html, { fn: overrideEverything, arg: '' });
      assert.notEqual(overridden, 'timeout', `the scan of ${file} hung`);
      const control = await scan(html, { fn: overrideEverything, arg: 'z' });
      for (const r of overridden)
        assert.equal(r.error, '', `${file}: ${r.ruleId} errored: ${r.error}`);
      assert.deepEqual(overridden, control, file);
    }
  });
});
