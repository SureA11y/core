'use strict';

/**
 * waitForPageReady without a browser: what it does with no document, with
 * jsdom (which loads nothing), and with quietMs on a DOM that keeps
 * changing. Images and fonts are tested in Chromium, in
 * engine-checks/page-ready-chromium.test.js.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { waitForPageReady } = require('../src/index.js');

const domOf = () =>
  new JSDOM('<!doctype html><html lang="en"><body><p>Hi</p></body></html>', {
    pretendToBeVisual: true
  });

test('with no document, or in jsdom, it resolves at once and ready', async () => {
  const none = await waitForPageReady({ document: undefined });
  assert.equal(none.ready, true);
  const dom = domOf();
  const r = await waitForPageReady({ document: dom.window.document });
  assert.deepEqual(r.pending, { load: false, fonts: false, images: 0 });
  assert.equal(r.ready, true);
  assert.ok(r.waitedMs < 100, `waited ${r.waitedMs}ms`);
  dom.window.close();
});

test('with quietMs it waits until the DOM stops changing', async () => {
  const dom = domOf();
  const doc = dom.window.document;
  let n = 0;
  const timer = setInterval(() => {
    doc.body.append(doc.createElement('span'));
    if (++n === 6) clearInterval(timer);
  }, 30);
  const r = await waitForPageReady({ document: doc, quietMs: 100, timeoutMs: 2000 });
  assert.equal(r.ready, true);
  assert.equal(r.pending.domChanging, false);
  assert.equal(n, 6, 'it waited for the last change');
  assert.ok(r.waitedMs >= 150, `waited ${r.waitedMs}ms`);
  dom.window.close();
});

test('a DOM that never stops changing runs out the time, and says so', async () => {
  const dom = domOf();
  const doc = dom.window.document;
  const timer = setInterval(() => doc.body.append(doc.createElement('span')), 20);
  const r = await waitForPageReady({ document: doc, quietMs: 100, timeoutMs: 300 });
  clearInterval(timer);
  assert.equal(r.ready, false);
  assert.equal(r.pending.domChanging, true);
  assert.ok(r.waitedMs >= 290 && r.waitedMs < 1000, `waited ${r.waitedMs}ms`);
  dom.window.close();
});

test('it never rejects, even when fonts.ready does', async () => {
  const dom = domOf();
  const doc = dom.window.document;
  Object.defineProperty(doc, 'fonts', {
    value: { ready: Promise.reject(new Error('no fonts')), forEach() {} }
  });
  const r = await waitForPageReady({ document: doc, timeoutMs: 200 });
  assert.equal(r.ready, true);
  dom.window.close();
});

// A document still loading, with a window whose load event the test fires.
function loadingDocument() {
  const listeners = new Set();
  const removed = [];
  const win = {
    addEventListener: (type, fn) => type === 'load' && listeners.add(fn),
    removeEventListener: (type, fn) => {
      removed.push(type);
      listeners.delete(fn);
    }
  };
  const doc = { readyState: 'loading', defaultView: win, querySelectorAll: () => [] };
  return {
    doc,
    removed,
    listeners,
    fireLoad() {
      doc.readyState = 'complete';
      for (const fn of [...listeners]) fn();
    }
  };
}

test('it waits for the load event when the document has not loaded yet', async () => {
  const page = loadingDocument();
  setTimeout(() => page.fireLoad(), 80);
  const r = await waitForPageReady({ document: page.doc, timeoutMs: 2000 });
  assert.equal(r.ready, true);
  assert.equal(r.pending.load, false);
  assert.ok(r.waitedMs >= 70, `waited ${r.waitedMs}ms`);
});

test('a load event that never comes runs out the time, and its listener is removed', async () => {
  const page = loadingDocument();
  const r = await waitForPageReady({ document: page.doc, timeoutMs: 100 });
  assert.equal(r.ready, false);
  assert.equal(r.pending.load, true);
  assert.deepEqual(page.removed, ['load']);
  assert.equal(page.listeners.size, 0);
});

test('a font face still loading when the time runs out is named', async () => {
  const doc = {
    readyState: 'complete',
    querySelectorAll: () => [],
    fonts: {
      ready: new Promise(() => {}),
      forEach: (fn) => [{ status: 'loaded' }, { status: 'loading' }].forEach(fn)
    }
  };
  const r = await waitForPageReady({ document: doc, timeoutMs: 100 });
  assert.equal(r.ready, false);
  assert.deepEqual(r.pending, { load: false, fonts: true, images: 0 });
});

test('timeoutMs 0 checks once and does not wait', async () => {
  const page = loadingDocument();
  const r = await waitForPageReady({ document: page.doc, timeoutMs: 0 });
  assert.equal(r.ready, false);
  assert.ok(r.waitedMs < 50, `waited ${r.waitedMs}ms`);
});

test('a quietMs that is not a positive number turns the quiet check off', async () => {
  const dom = domOf();
  for (const quietMs of [0, -5, Number.NaN, '100', null]) {
    const r = await waitForPageReady({ document: dom.window.document, quietMs });
    assert.equal('domChanging' in r.pending, false, String(quietMs));
  }
  dom.window.close();
});

test('the observer it uses for quietMs is disconnected afterwards', async () => {
  const dom = domOf();
  const proto = dom.window.MutationObserver.prototype;
  const original = proto.disconnect;
  let disconnected = 0;
  proto.disconnect = function () {
    disconnected += 1;
    return original.call(this);
  };
  await waitForPageReady({ document: dom.window.document, quietMs: 50, timeoutMs: 1000 });
  assert.equal(disconnected, 1);
  dom.window.close();
});

test('its source runs on its own in a page, as a binding sends it', async () => {
  // A binding sends the function's source into the page and calls it there:
  // nothing from outside its body may be needed.
  // runScripts makes eval run in the page's own realm, where `document` and
  // `setTimeout` are the page's.
  const dom = new JSDOM('<!doctype html><html lang="en"><body><p>Hi</p></body></html>', {
    pretendToBeVisual: true,
    runScripts: 'outside-only'
  });
  const fn = dom.window.eval(`(${waitForPageReady.toString()})`);
  const r = await fn({ quietMs: 30, timeoutMs: 1000 });
  assert.equal(r.ready, true);
  assert.equal(r.pending.domChanging, false);
  dom.window.close();
});

test('waitForPageReady: a timeoutMs that is not a finite number of 0 or more warns and uses the default', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const dom = new JSDOM('<!doctype html><html><body><p>x</p></body></html>');
  for (const timeoutMs of [-1, Number.NaN, Infinity]) {
    const r = await waitForPageReady({ document: dom.window.document, timeoutMs });
    assert.equal(r.ready, true);
  }
  assert.equal(warn.mock.callCount(), 3);
  assert.match(warn.mock.calls[0].arguments[0], /timeoutMs must be a finite number/);
  await waitForPageReady({ document: dom.window.document, timeoutMs: 0 });
  assert.equal(warn.mock.callCount(), 3, '0 is valid');
});
