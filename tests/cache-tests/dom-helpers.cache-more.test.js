'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

/**
 * Additional cache + correctness "tripwire" checks.
 * These are intentionally black-box and use DOM API call counting to detect
 * whether memoization and cache scoping behave as intended.
 */

test('dom helpers cache: getAccessibleNameInfo does not reuse memoized result across different opts keys', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <label for="x">Full Name</label>
      <input id="x" />
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  // getAccessibleNameInfo resolves label association via the native
  // `.labels` API first (element references, no query needed), so spy on
  // the `.labels` getter itself as the "a fresh lookup happened" signal,
  // document.querySelector('label[for]') is no longer reached on this path.
  let labelsGetterCalls = 0;
  const proto = window.HTMLInputElement.prototype;
  const originalDescriptor =
    Object.getOwnPropertyDescriptor(proto, 'labels') ||
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(proto), 'labels');
  Object.defineProperty(proto, 'labels', {
    configurable: true,
    get() {
      labelsGetterCalls++;
      return originalDescriptor.get.call(this);
    }
  });

  const helpers = createDomHelpers({ window, document, root: document });
  const input = document.getElementById('x');

  // First call (key A)
  const before1 = labelsGetterCalls;
  const r1 = helpers.getAccessibleNameInfo(input, { helpers }, { disallowContents: true });
  const after1 = labelsGetterCalls;

  assert.equal(r1.present, true);
  assert.equal(r1.mechanism, 'label');
  assert.equal(r1.value, 'Full Name');
  assert.ok(after1 > before1, 'first call should perform DOM work (.labels)');

  // Second call with same opts (should be cached for key A)
  const before2 = labelsGetterCalls;
  const r2 = helpers.getAccessibleNameInfo(input, { helpers }, { disallowContents: true });
  const after2 = labelsGetterCalls;

  assert.deepEqual(r2, r1);
  assert.equal(after2, before2, 'second call should be cached for same opts key');

  // Call with different opts (key B) should not reuse key A result
  const before3 = labelsGetterCalls;
  const r3 = helpers.getAccessibleNameInfo(input, { helpers }, { disallowContents: false });
  const after3 = labelsGetterCalls;

  assert.deepEqual(r3, r1, 'output may be identical, but cache key must differ');
  assert.ok(
    after3 > before3,
    'different opts key should cause a fresh lookup (no cross-key reuse)'
  );

  Object.defineProperty(proto, 'labels', originalDescriptor);
});

test('dom helpers cache: eligibility caches are scoped by root/document and do not bleed across roots', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="r1"><button id="b1">One</button></div>
      <div id="r2"><button id="b2">Two</button></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const originalGetCS = window.getComputedStyle.bind(window);
  let getComputedStyleCalls = 0;
  window.getComputedStyle = (...args) => {
    getComputedStyleCalls++;
    return originalGetCS(...args);
  };

  const root1 = document.getElementById('r1');
  const root2 = document.getElementById('r2');
  const b1 = document.getElementById('b1');

  const helpers1 = createDomHelpers({ window, document, root: root1 });
  const helpers2 = createDomHelpers({ window, document, root: root2 });

  // helper1 first call (miss)
  const before1 = getComputedStyleCalls;
  const e1 = helpers1.isAccTreeEligible(b1);
  const after1 = getComputedStyleCalls;
  assert.equal(e1.eligible, true);
  assert.ok(after1 > before1, 'first eligibility call should compute styles');

  // helper1 second call (hit)
  const before2 = getComputedStyleCalls;
  const e2 = helpers1.isAccTreeEligible(b1);
  const after2 = getComputedStyleCalls;
  assert.deepEqual(e2, e1);
  assert.equal(after2, before2, 'second eligibility call should be cached for same root scope');

  // helper2 should NOT reuse helper1 root-scoped cache
  const before3 = getComputedStyleCalls;
  const e3 = helpers2.isAccTreeEligible(b1);
  const after3 = getComputedStyleCalls;
  assert.equal(e3.eligible, true);
  assert.ok(after3 > before3, 'different root scope should not reuse eligibility cache');
});

test('dom helpers cache + semantics: resolveIdRefs dedupes, reports missing, truncates deterministically, and memoizes base lookup', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <span id="x">X</span>
      <span id="y">Y</span>
      <div id="host" aria-labelledby="x x y missing"></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const originalGetById = document.getElementById.bind(document);
  let getByIdCalls = 0;
  document.getElementById = (id) => {
    getByIdCalls++;
    return originalGetById(id);
  };

  const helpers = createDomHelpers({ window, document, root: document });
  const host = document.getElementById('host');

  // First call: should do actual ID lookups
  const before1 = getByIdCalls;
  const r1 = helpers.getAriaLabelledByInfo(host, { helpers }, { maxRefs: 99 });
  const after1 = getByIdCalls;

  assert.equal(r1.mechanism, 'aria-labelledby');
  assert.equal(r1.present, true);
  assert.equal(r1.refsCount, 2, 'x should be deduped, y included');
  assert.deepEqual(r1.missing, ['missing']);
  assert.ok(r1.flags.includes('deduped'), 'should flag deduped idrefs');
  assert.ok(r1.flags.includes('idref-missing'), 'should flag missing idrefs');
  assert.ok(after1 > before1, 'first call should resolve IDREF(s)');

  // Second call: same normKey should be memoized, no extra getElementById
  const before2 = getByIdCalls;
  const r2 = helpers.getAriaLabelledByInfo(host, { helpers }, { maxRefs: 99 });
  const after2 = getByIdCalls;

  assert.deepEqual(r2, r1);
  assert.equal(after2, before2, 'second call should be cached (no extra getElementById)');

  // Truncation should be per-call deterministic and should not corrupt the cached base result
  const rTrunc = helpers.getAriaLabelledByInfo(host, { helpers }, { maxRefs: 1 });
  assert.equal(rTrunc.present, true);
  assert.equal(rTrunc.refsCount, 1, 'should truncate refs to maxRefs=1');
  assert.ok(rTrunc.flags.includes('truncated'), 'should flag truncation');
  // Base should still be 2 on a subsequent non-truncated call
  const rAgain = helpers.getAriaLabelledByInfo(host, { helpers }, { maxRefs: 99 });
  assert.equal(rAgain.refsCount, 2, 'cached base result should remain untruncated');
});

test('dom helpers semantics: aria-hidden eligibility override for explicit tabindex >= 0, natively-tabbable elements, and programmatic-focus exclusion', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div aria-hidden="true">
        <button id="t0" tabindex="0">Tabbable</button>
        <button id="tm1" tabindex="-1">Programmatic</button>
        <button id="nativeButton">Native button, no tabindex</button>
        <summary id="nativeSummary">Native summary, no tabindex</summary>
        <a id="nativeLinkHref" href="#x">Native link with href, no tabindex</a>
        <a id="nativeLinkNoHref">Native link without href</a>
        <span id="notFocusable">Not natively focusable</span>
      </div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const helpers = createDomHelpers({ window, document, root: document });

  const t0 = document.getElementById('t0');
  const tm1 = document.getElementById('tm1');
  const nativeButton = document.getElementById('nativeButton');
  const nativeSummary = document.getElementById('nativeSummary');
  const nativeLinkHref = document.getElementById('nativeLinkHref');
  const nativeLinkNoHref = document.getElementById('nativeLinkNoHref');
  const notFocusable = document.getElementById('notFocusable');

  const e0 = helpers.isAccTreeEligible(t0);
  assert.equal(e0.eligible, true);
  assert.ok(e0.reasons.includes('ariaHiddenOverriddenTabbable'));

  const em1 = helpers.isAccTreeEligible(tm1);
  assert.equal(em1.eligible, false);
  assert.ok(em1.reasons.includes('ariaHiddenProgrammaticFocusExcluded'));

  // <button>/<summary>/<a href> are tabbable by default (no explicit tabindex
  // required), and real browsers keep them in the tab order regardless of
  // aria-hidden, so the eligibility model must evaluate them too.
  const eButton = helpers.isAccTreeEligible(nativeButton);
  assert.equal(eButton.eligible, true);
  assert.ok(eButton.reasons.includes('ariaHiddenOverriddenTabbable'));

  const eSummary = helpers.isAccTreeEligible(nativeSummary);
  assert.equal(eSummary.eligible, true);
  assert.ok(eSummary.reasons.includes('ariaHiddenOverriddenTabbable'));

  const eLinkHref = helpers.isAccTreeEligible(nativeLinkHref);
  assert.equal(eLinkHref.eligible, true);
  assert.ok(eLinkHref.reasons.includes('ariaHiddenOverriddenTabbable'));

  // <a> without href is not natively focusable, so no override applies.
  const eLinkNoHref = helpers.isAccTreeEligible(nativeLinkNoHref);
  assert.equal(eLinkNoHref.eligible, false);
  assert.ok(eLinkNoHref.reasons.includes('ariaHidden'));

  const en = helpers.isAccTreeEligible(notFocusable);
  assert.equal(en.eligible, false);
  assert.ok(en.reasons.includes('ariaHidden'));
});

test('dom helpers shadow DOM: queryAllSmart includes shadow roots only when includeShadowDom=true', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="host"></div>
      <button id="light">Light</button>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="shadowBtn">Shadow</button>';

  const helpersNoShadow = createDomHelpers({
    window,
    document,
    root: document,
    includeShadowDom: false
  });
  const helpersWithShadow = createDomHelpers({
    window,
    document,
    root: document,
    includeShadowDom: true
  });

  const noShadowBtns = helpersNoShadow.queryAllSmart('button');
  assert.equal(
    noShadowBtns.some((el) => el && el.id === 'shadowBtn'),
    false,
    'shadow button should not be found when includeShadowDom=false'
  );
  assert.equal(
    noShadowBtns.some((el) => el && el.id === 'light'),
    true,
    'light DOM button should be found'
  );

  const withShadowBtns = helpersWithShadow.queryAllSmart('button');
  assert.equal(
    withShadowBtns.some((el) => el && el.id === 'shadowBtn'),
    true,
    'shadow button should be found when includeShadowDom=true'
  );
  assert.equal(
    withShadowBtns.some((el) => el && el.id === 'light'),
    true,
    'light DOM button should still be found'
  );
});

test('dom helpers hidden policy: queryAllSmart excludes hard-hidden nodes even when acc eligibility short-circuits as inert', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="hiddenRoot" style="display:none">
        <div inert>
          <div id="hiddenItem" role="listitem" aria-expanded="false"></div>
        </div>
      </div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const hiddenItem = document.getElementById('hiddenItem');
  assert.ok(hiddenItem);

  const helpers = createDomHelpers({ window, document, root: document });
  const acc = helpers.isAccTreeEligible(hiddenItem);
  assert.equal(acc.eligible, false);
  assert.ok(
    acc.reasons.includes('inert'),
    'fixture should reproduce inert-first eligibility classification'
  );

  const filtered = helpers.queryAllSmart('[role="listitem"][aria-expanded]');
  assert.equal(filtered.length, 0, 'default hidden policy should exclude the hard-hidden node');

  const helpersIncludeHidden = createDomHelpers({
    window,
    document,
    root: document,
    includeHiddenElements: true
  });
  const included = helpersIncludeHidden.queryAllSmart('[role="listitem"][aria-expanded]');
  assert.equal(included.length, 1, 'includeHiddenElements:true should include hidden nodes');
});
