'use strict';

/**
 * Tests for runa11yCoreAcrossFrames' per-frame orchestration
 * (src/core/frame-scan.js).
 *
 * tests/core/frame-scan.test.js drives the real generated chunk in a real
 * browser across a real origin boundary, which is the right place to prove
 * the protocol works at all -- but a live page can only really stage the
 * happy path and a flat "nobody answered". The contract that matters most
 * here is the one that keeps a scan usable on a page full of third-party
 * embeds: a frame that cannot be reached must come back as
 * `{ url, error }` and never abort the scan, whichever way it failed.
 *
 * The module documents that it is compiled into an IIFE that supplies
 * runa11yCoreInPage/resolveContextRoots/pingFrame/... as free variables. In a
 * CommonJS module free variables resolve against the global object, so this
 * file satisfies that same contract by installing them as globals -- the real
 * frame-messaging.js implementations for the RPC half, a recording stub for
 * runa11yCoreInPage (a whole engine run is what the generated IIFE exists to
 * provide, and is not what these tests are about). Node's test runner gives
 * each test file its own process, so the globals stay contained.
 */

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const {
  FRAME_RPC_CHANNEL,
  installFrameRpcListener,
  pingFrame,
  sendFrameRunCommand,
  enableFrameRpcResponder
} = require('../../src/core/frame-messaging.js');
const { resolveContextRoots } = require('../../src/core/dom-helpers.js');

const localScanCalls = [];

// The free variables src/core/frame-scan.js is compiled against. See the file
// comment above.
Object.assign(globalThis, {
  runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly) {
    localScanCalls.push({ pageUrl, contextSelector, engineOptions, runOnly });
    return { pageUrl, checksResults: [] };
  },
  resolveContextRoots,
  pingFrame,
  sendFrameRunCommand,
  enableFrameRpcResponder
});

const {
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder
} = require('../../src/core/frame-scan.js');

// Fast enough to keep unreachable-frame tests quick; every reachable frame in
// this file answers on the same tick.
const FAST = { pingWaitTime: 30, frameWaitTime: 60 };

function setupPage(html) {
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom;
}

/**
 * Gives a frame element a contentWindow that talks the RPC protocol back to
 * the page's window, standing in for a real child frame.
 */
function attachChildWindow(el, { respondWith } = {}) {
  const childWin = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://child.test/'
  }).window;

  const parentHandle = {
    postMessage(data) {
      dispatch(globalThis.window, data, childHandle);
    }
  };
  const childHandle = {
    postMessage(data) {
      dispatch(childWin, data, parentHandle);
    }
  };

  // A responder answers only the frame that embeds it, so the stand-in child
  // needs the page's handle as its parent.
  Object.defineProperty(childWin, 'parent', { value: parentHandle, configurable: true });

  if (typeof respondWith === 'function') enableFrameRpcResponder(childWin, respondWith);
  else installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);

  Object.defineProperty(el, 'contentWindow', { value: childHandle, configurable: true });
  return childWin;
}

function dispatch(win, data, source) {
  const event = new win.MessageEvent('message', { data });
  Object.defineProperty(event, 'source', { value: source, configurable: true });
  win.dispatchEvent(event);
}

test('a page with no frames returns just its own result', async () => {
  setupPage('<!doctype html><html><body><img src="x.png"></body></html>');
  localScanCalls.length = 0;

  const runOnly = { tags: ['wcag2a'] };
  const result = await runa11yCoreAcrossFrames('https://example.test/', '#main', {}, runOnly);

  assert.deepStrictEqual(result.frames, []);
  assert.deepStrictEqual(result.topFrame, {
    pageUrl: 'https://example.test/',
    checksResults: []
  });

  // The page's own scan runs through the same runOnly resolution a
  // single-frame scan would use, not the caller's raw runOnly.
  assert.deepStrictEqual(localScanCalls, [
    {
      pageUrl: 'https://example.test/',
      contextSelector: '#main',
      engineOptions: {},
      runOnly
    }
  ]);
});

test('a cooperating frame contributes its own result tree', async () => {
  const dom = setupPage(
    '<!doctype html><html><body><iframe id="a" src="https://child.test/embed.html"></iframe></body></html>'
  );

  const grandchild = { url: 'https://grandchild.test/', topFrame: { deep: true }, frames: [] };
  attachChildWindow(dom.window.document.getElementById('a'), {
    respondWith: () => ({ topFrame: { fromChild: true }, frames: [grandchild] })
  });

  const result = await runa11yCoreAcrossFrames('https://example.test/', null, FAST, null);

  assert.deepStrictEqual(result.frames, [
    {
      url: 'https://child.test/embed.html',
      topFrame: { fromChild: true },
      frames: [grandchild]
    }
  ]);
});

test('the run command carries the frame url and the caller options down', async () => {
  const dom = setupPage(
    '<!doctype html><html><body><iframe id="a" src="https://child.test/embed.html"></iframe></body></html>'
  );

  const seen = [];
  attachChildWindow(dom.window.document.getElementById('a'), {
    respondWith: (payload) => {
      seen.push(payload);
      return { topFrame: {}, frames: [] };
    }
  });

  const engineOptions = { ...FAST, locale: 'fr' };
  const runOnly = { includeRuleIds: ['img-alt'] };
  await runa11yCoreAcrossFrames('https://example.test/', null, engineOptions, runOnly);

  assert.deepStrictEqual(seen, [
    {
      pageUrl: 'https://child.test/embed.html',
      contextSelector: null,
      engineOptions,
      runOnly
    }
  ]);
});

test('a frame that never answers is reported, not fatal', async () => {
  const dom = setupPage(`<!doctype html><html><body>
    <iframe id="silent" src="https://third-party.test/ad.html"></iframe>
    <iframe id="willing" src="https://child.test/embed.html"></iframe>
  </body></html>`);

  // No surea11y in there at all: the ping lands and nothing ever answers,
  // which is what almost every third-party embed on the web looks like.
  Object.defineProperty(dom.window.document.getElementById('silent'), 'contentWindow', {
    value: { postMessage() {} },
    configurable: true
  });
  attachChildWindow(dom.window.document.getElementById('willing'), {
    respondWith: () => ({ topFrame: { fromChild: true }, frames: [] })
  });

  const result = await runa11yCoreAcrossFrames('https://example.test/', null, FAST, null);

  assert.strictEqual(result.frames.length, 2);
  assert.strictEqual(result.frames[0].url, 'https://third-party.test/ad.html');
  assert.match(result.frames[0].error, /no surea11y frame responder detected/);
  assert.strictEqual(result.frames[0].topFrame, undefined);
  assert.deepStrictEqual(result.frames[1].topFrame, { fromChild: true });
  assert.ok(result.topFrame, 'the page’s own result must still come back');
});

test('a frame with no reachable contentWindow is reported, not fatal', async () => {
  const dom = setupPage(`<!doctype html><html><body>
    <iframe id="null-window" src="https://never-loaded.test/"></iframe>
    <iframe id="throwing-window" src="https://cross.test/"></iframe>
  </body></html>`);

  Object.defineProperty(dom.window.document.getElementById('null-window'), 'contentWindow', {
    value: null,
    configurable: true
  });
  Object.defineProperty(dom.window.document.getElementById('throwing-window'), 'contentWindow', {
    get() {
      throw new Error('SecurityError: blocked a frame from accessing a cross-origin frame');
    },
    configurable: true
  });

  const result = await runa11yCoreAcrossFrames('https://example.test/', null, FAST, null);

  assert.deepStrictEqual(result.frames, [
    { url: 'https://never-loaded.test/', error: 'frame has no accessible contentWindow' },
    { url: 'https://cross.test/', error: 'frame has no accessible contentWindow' }
  ]);
});

test('a frame that answers the ping but fails the scan is reported, not fatal', async () => {
  const dom = setupPage(
    '<!doctype html><html><body><iframe id="a" src="https://child.test/embed.html"></iframe></body></html>'
  );

  attachChildWindow(dom.window.document.getElementById('a'), {
    respondWith: () => {
      throw new Error('the child frame blew up mid-scan');
    }
  });

  const result = await runa11yCoreAcrossFrames('https://example.test/', null, FAST, null);

  assert.deepStrictEqual(result.frames, [
    { url: 'https://child.test/embed.html', error: 'the child frame blew up mid-scan' }
  ]);
});

test('a frame that answers the ping then goes quiet times out per frameWaitTime', async () => {
  const dom = setupPage(
    '<!doctype html><html><body><iframe id="a" src="https://child.test/embed.html"></iframe></body></html>'
  );

  // Reachable -- surea11y is loaded and opted in over there -- but its scan
  // never comes back.
  attachChildWindow(dom.window.document.getElementById('a'), {
    respondWith: () => new Promise(() => {})
  });

  const result = await runa11yCoreAcrossFrames(
    'https://example.test/',
    null,
    { pingWaitTime: 30, frameWaitTime: 20 },
    null
  );

  assert.strictEqual(result.frames.length, 1);
  assert.match(result.frames[0].error, /timed out waiting for a run result/);
});

test('a contextSelector limits which frames are reached at all', async () => {
  const dom = setupPage(`<!doctype html><html><body>
    <div id="widget"><iframe id="inside" src="https://child.test/inside.html"></iframe></div>
    <iframe id="outside" src="https://child.test/outside.html"></iframe>
  </body></html>`);

  attachChildWindow(dom.window.document.getElementById('inside'), {
    respondWith: () => ({ topFrame: { fromChild: true }, frames: [] })
  });
  attachChildWindow(dom.window.document.getElementById('outside'), {
    respondWith: () => {
      throw new Error('a frame outside the scan scope must never be contacted');
    }
  });

  const result = await runa11yCoreAcrossFrames('https://example.test/', '#widget', FAST, null);

  assert.deepStrictEqual(
    result.frames.map((f) => f.url),
    ['https://child.test/inside.html']
  );
});

test('engineOptions is tolerated in every shape a caller might pass', async () => {
  setupPage('<!doctype html><html><body></body></html>');

  for (const engineOptions of [null, undefined, 'not an object', 42, []]) {
    const result = await runa11yCoreAcrossFrames('https://example.test/', null, engineOptions);
    assert.deepStrictEqual(result.frames, []);
    assert.ok(result.topFrame);
  }
});

test('a11yCoreEnableFrameResponder makes this window answer a parent scan', async () => {
  const dom = setupPage(
    '<!doctype html><html><body><img src="x.png"><iframe id="a"></iframe></body></html>'
  );
  Object.defineProperty(dom.window.document.getElementById('a'), 'contentWindow', {
    value: null,
    configurable: true
  });

  const disable = a11yCoreEnableFrameResponder();
  assert.strictEqual(typeof disable, 'function');

  const parentWin = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://parent.test/'
  }).window;

  const pageHandle = {
    postMessage(data) {
      dispatch(globalThis.window, data, parentHandle);
    }
  };
  const parentHandle = {
    postMessage(data) {
      dispatch(parentWin, data, pageHandle);
    }
  };
  // The responder answers its embedder only, so the page must see the caller
  // as its parent.
  Object.defineProperty(globalThis.window, 'parent', {
    value: parentHandle,
    configurable: true
  });

  assert.strictEqual(await pingFrame(parentWin, pageHandle, 30), true);

  const reply = await sendFrameRunCommand(
    parentWin,
    pageHandle,
    {
      pageUrl: 'https://example.test/',
      contextSelector: null,
      engineOptions: FAST,
      runOnly: null
    },
    200
  );

  assert.deepStrictEqual(reply.topFrame, {
    pageUrl: 'https://example.test/',
    checksResults: []
  });
  assert.deepStrictEqual(reply.frames, [
    { url: null, error: 'frame has no accessible contentWindow' }
  ]);

  disable();
  await assert.rejects(
    () => sendFrameRunCommand(parentWin, pageHandle, {}, 20),
    /timed out waiting for a run result/
  );
});

test('a11yCoreEnableFrameResponder survives a parent that sends no payload', async () => {
  setupPage('<!doctype html><html><body></body></html>');

  const disable = a11yCoreEnableFrameResponder();

  const parentWin = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://parent.test/'
  }).window;

  const pageHandle = {
    postMessage(data) {
      dispatch(globalThis.window, data, parentHandle);
    }
  };
  const parentHandle = {
    postMessage(data) {
      dispatch(parentWin, data, pageHandle);
    }
  };
  // The responder answers its embedder only, so the page must see the caller
  // as its parent.
  Object.defineProperty(globalThis.window, 'parent', {
    value: parentHandle,
    configurable: true
  });

  const reply = await sendFrameRunCommand(parentWin, pageHandle, null, 200);

  assert.deepStrictEqual(reply.frames, []);
  assert.strictEqual(reply.topFrame.pageUrl, null);

  disable();
});
