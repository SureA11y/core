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

  const originalQS = document.querySelector.bind(document);
  let querySelectorCalls = 0;
  document.querySelector = (...args) => {
    querySelectorCalls++;
    return originalQS(...args);
  };

  const helpers = createDomHelpers({ window, document, root: document });

  const input = document.getElementById('x');

  const before1 = querySelectorCalls;
  const r1 = helpers.getAccessibleNameInfo(input);
  const after1 = querySelectorCalls;

  assert.equal(r1.present, true);
  assert.equal(r1.mechanism, 'label');
  assert.equal(r1.value, 'Full Name');
  assert.ok(after1 > before1, 'first call should query label[for]');

  const before2 = querySelectorCalls;
  const r2 = helpers.getAccessibleNameInfo(input);
  const after2 = querySelectorCalls;

  assert.deepEqual(r2, r1, 'memoized result should be identical');
  assert.equal(after2, before2, 'second call should be cached (no extra querySelector)');
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

  const originalQS = document.querySelector.bind(document);
  let querySelectorCalls = 0;
  document.querySelector = (...args) => {
    querySelectorCalls++;
    return originalQS(...args);
  };

  const helpers = createDomHelpers({ window, document, root: document });

  const input = document.getElementById('x');

  const before1 = querySelectorCalls;
  const m1 = helpers.getLabelMethod(input, { helpers });
  const after1 = querySelectorCalls;

  assert.equal(m1.method, 'label');
  assert.ok(after1 > before1, 'first call should perform DOM work');

  const before2 = querySelectorCalls;
  const m2 = helpers.getLabelMethod(input, { helpers });
  const after2 = querySelectorCalls;

  assert.deepEqual(m2, m1);
  assert.equal(after2, before2, 'second call should be cached');
});
