'use strict';

/**
 * The internals hook (internalsHookScript) in Chromium. A component that
 * keeps its ElementInternals in a #private field names itself and sets its
 * states through them, which no page script can read, so the name rules ask
 * (name_internals, state_internals) instead of deciding. With the hook
 * installed before the page's scripts (Playwright's addInitScript), the
 * engine reads them from the hook's registry: the rules decide, and an
 * element that never attached internals is no longer a question. Installed
 * late, after load, the hook can only read what is attached after it, and
 * proves nothing about the rest. engine.environment.internalsHook says which
 * it was, and is left out without one. The page gets the same object, the
 * same errors, and a method with the original's name, length and attributes.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { internalsHookScript } = require('../../src/index.js');

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

// A checkbox that names itself and sets aria-checked through #private
// internals, and a button that never attaches any.
const COMPONENTS = `
  customElements.define('x-check', class extends HTMLElement {
    #internals;
    constructor() {
      super();
      this.#internals = this.attachInternals();
      this.#internals.ariaLabel = 'Subscribe';
      this.#internals.ariaChecked = 'false';
    }
  });
  customElements.define('x-plain', class extends HTMLElement {});
`;

function page(body, script) {
  return `<!doctype html><html lang="en"><head><title>Internals hook</title></head><body><main><h1>Internals hook</h1>${body}</main>${
    script ? `<script>${script}</script>` : ''
  }</body></html>`;
}

const MARKUP = '<x-check role="checkbox"></x-check><x-plain role="button"></x-plain>';

// Serves the pages from one origin, so init scripts run as on a real site
// (page.setContent reuses the blank page, which they never ran in).
async function open(browser, pages, { hook = false } = {}) {
  const p = await browser.newPage();
  if (hook) await p.addInitScript({ content: internalsHookScript() });
  await p.route('https://example.test/**', (route) => {
    const url = new URL(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: pages[url.pathname] || '' });
  });
  await p.goto('https://example.test/');
  return p;
}

// Scans a frame with the browser bundle: the outcome of each rule, and the
// scan's environment.
async function scan(frame, ruleIds) {
  await frame.addScriptTag({ content: BUNDLE });
  return frame.evaluate((ids) => {
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, { includeRuleIds: ids });
    const outcomes = {};
    for (const c of r.checksResults) outcomes[c.ruleId] = c.outcome;
    return { outcomes, environment: r.engine.environment };
  }, ruleIds);
}

const RULES = ['binary-control-name-present', 'aria-required-attr', 'button-name-present'];

test(
  'without the hook, #private internals are a question, and the result says nothing of a hook',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await open(browser, { '/': page(MARKUP, COMPONENTS) });
      const { outcomes, environment } = await scan(p, RULES.slice(0, 2));
      assert.deepEqual(outcomes, {
        'binary-control-name-present': 'cantTell',
        'aria-required-attr': 'cantTell'
      });
      assert.equal('internalsHook' in environment, false);
    } finally {
      await browser.close();
    }
  }
);

test(
  'with the hook installed early, the name and state are read, and the rules pass',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await open(browser, { '/': page(MARKUP, COMPONENTS) }, { hook: true });
      const { outcomes, environment } = await scan(p, RULES.slice(0, 2));
      assert.deepEqual(outcomes, {
        'binary-control-name-present': 'pass',
        'aria-required-attr': 'pass'
      });
      assert.equal(environment.internalsHook, 'early');
    } finally {
      await browser.close();
    }
  }
);

test(
  'an element that never attached internals is no question under an early hook',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const pages = { '/': page('<x-plain role="button"></x-plain>', COMPONENTS) };
      const without = await scan(await open(browser, pages), ['button-name-present']);
      assert.equal(without.outcomes['button-name-present'], 'cantTell');
      const withHook = await scan(await open(browser, pages, { hook: true }), [
        'button-name-present'
      ]);
      assert.equal(withHook.outcomes['button-name-present'], 'fail');
    } finally {
      await browser.close();
    }
  }
);

test(
  'a hook injected after load is late: elements from before it stay questions',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await open(browser, { '/': page(MARKUP, COMPONENTS) });
      await p.evaluate(internalsHookScript());
      const before = await scan(p, RULES);
      assert.equal(before.environment.internalsHook, 'late');
      assert.deepEqual(before.outcomes, {
        'binary-control-name-present': 'cantTell',
        'aria-required-attr': 'cantTell',
        'button-name-present': 'cantTell'
      });
      // One created after it is read.
      await p.evaluate(() => {
        for (const el of document.querySelectorAll('x-check')) el.remove();
        document.querySelector('main').append(document.createElement('x-check'));
        document.querySelector('x-check').setAttribute('role', 'checkbox');
      });
      const after = await scan(p, RULES.slice(0, 2));
      assert.deepEqual(after.outcomes, {
        'binary-control-name-present': 'pass',
        'aria-required-attr': 'pass'
      });
    } finally {
      await browser.close();
    }
  }
);

test('a component defined after load is read under an early hook', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    const p = await open(browser, { '/': page('') }, { hook: true });
    await p.evaluate((src) => {
      // A script element, as a lazily loaded module would add it.
      const s = document.createElement('script');
      s.textContent = src;
      document.head.append(s);
      document.querySelector('main').innerHTML =
        '<x-check role="checkbox"></x-check><x-plain role="button"></x-plain>';
    }, COMPONENTS);
    const { outcomes } = await scan(p, RULES);
    assert.deepEqual(outcomes, {
      'binary-control-name-present': 'pass',
      'aria-required-attr': 'pass',
      'button-name-present': 'fail'
    });
  } finally {
    await browser.close();
  }
});

test(
  'the hook runs in a same-origin frame through addInitScript, and its scan records it',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await open(
        browser,
        {
          '/': page('<iframe title="Form" src="/frame"></iframe>'),
          '/frame': page(MARKUP, COMPONENTS)
        },
        { hook: true }
      );
      const frame = p.frames().find((f) => f.url().endsWith('/frame'));
      await frame.waitForLoadState('load');
      const { outcomes, environment } = await scan(frame, RULES);
      assert.deepEqual(outcomes, {
        'binary-control-name-present': 'pass',
        'aria-required-attr': 'pass',
        'button-name-present': 'fail'
      });
      assert.equal(environment.internalsHook, 'early');
    } finally {
      await browser.close();
    }
  }
);

test('a page that replaces attachInternals after the hook makes it late', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    // A polyfill that takes over without calling the method it replaced:
    // internals it hands out never reach the hook.
    const replace = `
      const own = HTMLElement.prototype.attachInternals;
      HTMLElement.prototype.attachInternals = function attachInternals() {
        return own.call(document.createElement('x-other'));
      };
    `;
    const p = await open(
      browser,
      { '/': page('<x-plain role="button"></x-plain>', replace + COMPONENTS) },
      { hook: true }
    );
    const { outcomes, environment } = await scan(p, ['button-name-present']);
    assert.equal(environment.internalsHook, 'late');
    assert.equal(outcomes['button-name-present'], 'cantTell');
  } finally {
    await browser.close();
  }
});

test(
  'the page gets the same object, the same errors, and a method shaped as before',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const shape = () => {
        const fn = HTMLElement.prototype.attachInternals;
        const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'attachInternals');
        return {
          name: fn.name,
          length: fn.length,
          writable: d.writable,
          enumerable: d.enumerable,
          configurable: d.configurable,
          hasPrototype: 'prototype' in fn
        };
      };
      const plain = await (await open(browser, { '/': page('') })).evaluate(shape);
      const p = await open(browser, { '/': page('') }, { hook: true });
      assert.deepEqual(await p.evaluate(shape), plain);
      const seen = await p.evaluate(() => {
        customElements.define('x-twice', class extends HTMLElement {});
        const el = document.createElement('x-twice');
        const internals = el.attachInternals();
        const registry = window[Symbol.for('surea11y.internals')];
        let error = null;
        try {
          el.attachInternals();
        } catch (e) {
          error = { name: e.name, isDomException: e instanceof DOMException };
        }
        let notAnElement = null;
        try {
          HTMLElement.prototype.attachInternals.call({});
        } catch (e) {
          notAnElement = e.name;
        }
        return {
          same: registry.map.get(el) === internals,
          error,
          notAnElement,
          frozen: Object.isFrozen(registry),
          early: registry.early,
          keys: Object.keys(window).includes(String(Symbol.for('surea11y.internals')))
        };
      });
      assert.deepEqual(seen, {
        same: true,
        error: { name: 'NotSupportedError', isDomException: true },
        notAnElement: 'TypeError',
        frozen: true,
        early: true,
        keys: false
      });
      // Installing it again changes nothing.
      await p.evaluate(internalsHookScript());
      assert.equal(
        await p.evaluate(
          () =>
            HTMLElement.prototype.attachInternals ===
            window[Symbol.for('surea11y.internals')].attachInternals
        ),
        true
      );
    } finally {
      await browser.close();
    }
  }
);
