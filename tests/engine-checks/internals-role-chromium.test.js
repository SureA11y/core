'use strict';

/**
 * A role a custom element gives itself through ElementInternals, in
 * Chromium. `this.#internals.role = 'switch'`, with no role attribute, makes
 * the element a switch in the browser's accessibility tree, and a role
 * attribute overrides it: HTML makes it the element's default role. Kept in a
 * #private field, no page script can read it, so without the internals hook
 * the scan sees no role and checks nothing; with the hook installed before
 * the page's scripts, the engine reads it, and an unnamed switch fails
 * binary-control-name-present as an unnamed role="switch" does.
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

// A switch by its #private internals, named through them when it carries
// data-label.
const COMPONENTS = `
  customElements.define('x-toggle', class extends HTMLElement {
    #internals;
    constructor() {
      super();
      this.#internals = this.attachInternals();
      this.#internals.role = 'switch';
      const label = this.getAttribute('data-label');
      if (label) this.#internals.ariaLabel = label;
    }
  });
`;

function page(body) {
  return `<!doctype html><html lang="en"><head><title>Internals role</title></head><body><main><h1>Internals role</h1>${body}</main><script>${COMPONENTS}</script></body></html>`;
}

// Serves the page from one origin, so init scripts run as on a real site.
async function open(browser, html, { hook = false } = {}) {
  const p = await browser.newPage();
  if (hook) await p.addInitScript({ content: internalsHookScript() });
  await p.route('https://example.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: html })
  );
  await p.goto('https://example.test/');
  return p;
}

async function outcome(p, ruleId) {
  await p.addScriptTag({ content: BUNDLE });
  return p.evaluate((id) => {
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, { includeRuleIds: [id] });
    return r.checksResults.find((c) => c.ruleId === id).outcome;
  }, ruleId);
}

// The role Chromium's accessibility tree gives the element matching selector.
async function browserRole(p, selector) {
  const cdp = await p.context().newCDPSession(p);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
    nodeId,
    fetchRelatives: false
  });
  return nodes[0] && nodes[0].role ? nodes[0].role.value : null;
}

test(
  'the browser exposes the internals role, and a role attribute overrides it',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await open(
        browser,
        page('<x-toggle id="a"></x-toggle><x-toggle id="b" role="button"></x-toggle>')
      );
      assert.equal(await browserRole(p, '#a'), 'switch');
      assert.equal(await browserRole(p, '#b'), 'button');
    } finally {
      await browser.close();
    }
  }
);

test('without the hook, a #private internals role is not seen', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    const p = await open(browser, page('<x-toggle></x-toggle>'));
    assert.equal(await outcome(p, 'binary-control-name-present'), 'notApplicable');
  } finally {
    await browser.close();
  }
});

test('with the hook, a switch by its internals needs a name', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    const unnamed = await open(browser, page('<x-toggle></x-toggle>'), { hook: true });
    assert.equal(await outcome(unnamed, 'binary-control-name-present'), 'fail');
    const named = await open(browser, page('<x-toggle data-label="Dark mode"></x-toggle>'), {
      hook: true
    });
    assert.equal(await outcome(named, 'binary-control-name-present'), 'pass');
  } finally {
    await browser.close();
  }
});
