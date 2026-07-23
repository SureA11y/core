'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

test('dom helpers cache: getAccessibleNameInfo memoizes label[for] lookup per element', () => {
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
  // `.labels` API first (element references, no query needed) — same
  // evolution already documented below for getLabelMethod — so spy on the
  // `.labels` getter itself as the "DOM work happened" signal, since
  // document.querySelector('label[for]') is no longer reached on this path.
  let labelsGetterCalls = 0;
  const proto = window.HTMLInputElement.prototype;
  const originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'labels')
    || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(proto), 'labels');
  Object.defineProperty(proto, 'labels', {
    configurable: true,
    get() {
      labelsGetterCalls++;
      return originalDescriptor.get.call(this);
    }
  });

  const helpers = createDomHelpers({ window, document, root: document });

  const input = document.getElementById('x');

  const before1 = labelsGetterCalls;
  const r1 = helpers.getAccessibleNameInfo(input);
  const after1 = labelsGetterCalls;

  assert.equal(r1.present, true);
  assert.equal(r1.mechanism, 'label');
  assert.equal(r1.value, 'Full Name');
  assert.ok(after1 > before1, 'first call should perform DOM work (.labels)');

  const before2 = labelsGetterCalls;
  const r2 = helpers.getAccessibleNameInfo(input);
  const after2 = labelsGetterCalls;

  assert.deepEqual(r2, r1, 'memoized result should be identical');
  assert.equal(after2, before2, 'second call should be cached (no extra .labels access)');

  Object.defineProperty(proto, 'labels', originalDescriptor);
});

test('dom helpers cache: getAccessibleDescriptionInfo memoizes aria-describedby resolution per element', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="d">This is a helpful description.</div>
      <button id="b" aria-describedby="d">Go</button>
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

  const btn = document.getElementById('b');

  const before1 = getByIdCalls;
  const r1 = helpers.getAccessibleDescriptionInfo(btn);
  const after1 = getByIdCalls;

  assert.equal(r1.present, true);
  assert.equal(r1.mechanism, 'aria-describedby');
  assert.ok(r1.value.includes('helpful description'));
  assert.ok(after1 > before1, 'first call should resolve IDREF(s)');

  const before2 = getByIdCalls;
  const r2 = helpers.getAccessibleDescriptionInfo(btn);
  const after2 = getByIdCalls;

  assert.deepEqual(r2, r1);
  assert.equal(after2, before2, 'second call should be cached (no extra getElementById)');
});

test('dom helpers cache: getLabelMethod memoizes per element', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <label for="x">Email</label>
      <input id="x" />
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  // hasLabelAssociation resolves via the native `.labels` API (element
  // references, no query needed) before falling back to querySelector —
  // spy on the `.labels` getter itself as the "DOM work happened" signal,
  // since querySelector is no longer called on this path.
  let labelsGetterCalls = 0;
  const proto = window.HTMLInputElement.prototype;
  const originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'labels')
    || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(proto), 'labels');
  Object.defineProperty(proto, 'labels', {
    configurable: true,
    get() {
      labelsGetterCalls++;
      return originalDescriptor.get.call(this);
    }
  });

  const helpers = createDomHelpers({ window, document, root: document });

  const input = document.getElementById('x');

  const before1 = labelsGetterCalls;
  const m1 = helpers.getLabelMethod(input, { helpers });
  const after1 = labelsGetterCalls;

  assert.equal(m1.method, 'label');
  assert.ok(after1 > before1, 'first call should perform DOM work');

  const before2 = labelsGetterCalls;
  const m2 = helpers.getLabelMethod(input, { helpers });
  const after2 = labelsGetterCalls;

  assert.deepEqual(m2, m1);
  assert.equal(after2, before2, 'second call should be cached');

  Object.defineProperty(proto, 'labels', originalDescriptor);
});
