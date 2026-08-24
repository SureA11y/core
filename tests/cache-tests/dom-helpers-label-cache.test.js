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

  const helpers = createDomHelpers({ window, document, root: document });

  const input = document.getElementById('x');

  // Label association is resolved via a document-scoped `for`-attribute
  // index plus `el.closest('label')` -- not the native `.labels`/`.control`
  // pair, which jsdom implements as an expensive whole-document walk (see
  // getAssociatedLabelElements's header comment in dom-helpers.js) -- so
  // spy on `.closest` as the "fresh label resolution happened" signal.
  let closestCalls = 0;
  const originalClosest = input.closest.bind(input);
  input.closest = (sel) => {
    closestCalls++;
    return originalClosest(sel);
  };

  const before1 = closestCalls;
  const r1 = helpers.getAccessibleNameInfo(input);
  const after1 = closestCalls;

  assert.equal(r1.present, true);
  assert.equal(r1.mechanism, 'label');
  assert.equal(r1.value, 'Full Name');
  assert.ok(after1 > before1, 'first call should perform DOM work (label resolution)');

  const before2 = closestCalls;
  const r2 = helpers.getAccessibleNameInfo(input);
  const after2 = closestCalls;

  assert.deepEqual(r2, r1, 'memoized result should be identical');
  assert.equal(after2, before2, 'second call should be cached (no extra label resolution)');
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

  const helpers = createDomHelpers({ window, document, root: document });

  const input = document.getElementById('x');

  // hasLabelAssociation resolves via a document-scoped `for`-attribute
  // index plus `el.closest('label')` -- not the native `.labels`/`.control`
  // pair, which jsdom implements as an expensive whole-document walk (see
  // getAssociatedLabelElements's header comment in dom-helpers.js) -- so
  // spy on `.closest` as the "fresh label resolution happened" signal.
  let closestCalls = 0;
  const originalClosest = input.closest.bind(input);
  input.closest = (sel) => {
    closestCalls++;
    return originalClosest(sel);
  };

  const before1 = closestCalls;
  const m1 = helpers.getLabelMethod(input, { helpers });
  const after1 = closestCalls;

  assert.equal(m1.method, 'label');
  assert.ok(after1 > before1, 'first call should perform DOM work');

  const before2 = closestCalls;
  const m2 = helpers.getLabelMethod(input, { helpers });
  const after2 = closestCalls;

  assert.deepEqual(m2, m1);
  assert.equal(after2, before2, 'second call should be cached');
});
