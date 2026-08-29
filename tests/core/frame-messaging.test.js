'use strict';

/**
 * Unit tests for the postMessage RPC protocol behind cross-frame scanning
 * (src/core/frame-messaging.js).
 *
 * tests/core/frame-scan.test.js already drives the protocol end to end in a
 * real browser across a real origin boundary, but only along the happy path:
 * a cooperating child answers, and the scan comes back. Everything the
 * protocol exists to survive -- a frame that never answers, a responder that
 * throws, a window that goes away mid-exchange, replies for requests nobody
 * is waiting on, unrelated postMessage traffic on the same window -- is
 * exercised here, where each of those can be provoked deterministically.
 *
 * The functions take the windows they talk to as arguments, so a pair of
 * jsdom windows wired together by hand stands in for a frame boundary: the
 * protocol never touches anything a real cross-origin exchange wouldn't
 * already restrict it to (postMessage in, MessageEvent out).
 */

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const {
  FRAME_RPC_CHANNEL,
  getFrameRpcRegistry,
  installFrameRpcListener,
  nextFrameRpcRequestId,
  pingFrame,
  sendFrameRunCommand,
  enableFrameRpcResponder
} = require('../../src/core/frame-messaging.js');

// Short enough to keep the suite fast, long enough that a same-tick reply
// always lands first.
const PING_WAIT = 50;
const RUN_WAIT = 50;

function makeWindow() {
  return new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.test/'
  }).window;
}

/**
 * Delivers `data` to `win` as a message event whose `source` is `source`,
 * the shape the protocol reads (it replies via `event.source.postMessage`).
 */
function deliver(win, data, source) {
  const event = new win.MessageEvent('message', { data });
  Object.defineProperty(event, 'source', { value: source, configurable: true });
  win.dispatchEvent(event);
}

/**
 * Wires two windows into a loopback pair and returns each side's handle on
 * the other -- what `targetWindow` and `event.source` are in a real frame
 * exchange. The child's `parent` is pointed at the parent's handle, since a
 * responder only answers the frame that embeds it.
 */
function connect(parentWin, childWin) {
  const parentHandle = {
    postMessage(data) {
      deliver(parentWin, data, childHandle);
    }
  };
  const childHandle = {
    postMessage(data) {
      deliver(childWin, data, parentHandle);
    }
  };
  Object.defineProperty(childWin, 'parent', { value: parentHandle, configurable: true });
  return { parentHandle, childHandle };
}

function tick(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('getFrameRpcRegistry creates one registry per window and reuses it', () => {
  const win = makeWindow();

  const first = getFrameRpcRegistry(win);
  assert.ok(first.pending instanceof Map);
  assert.strictEqual(first.seq, 0);
  assert.strictEqual(first.responder, null);
  assert.strictEqual(first.listening, false);

  first.seq = 7;
  assert.strictEqual(getFrameRpcRegistry(win), first, 'expected the registry to be memoized');
  assert.strictEqual(getFrameRpcRegistry(win).seq, 7);

  assert.notStrictEqual(
    getFrameRpcRegistry(makeWindow()),
    first,
    'expected a separate window to get its own registry'
  );
});

test('installFrameRpcListener attaches exactly one listener per window', () => {
  const win = makeWindow();
  let added = 0;
  const originalAdd = win.addEventListener.bind(win);
  win.addEventListener = function counted(...args) {
    if (args[0] === 'message') added += 1;
    return originalAdd(...args);
  };

  const registry = installFrameRpcListener(win, FRAME_RPC_CHANNEL);
  assert.strictEqual(registry.listening, true);
  assert.strictEqual(added, 1);

  assert.strictEqual(installFrameRpcListener(win, FRAME_RPC_CHANNEL), registry);
  assert.strictEqual(added, 1, 'expected a second install to be a no-op');
});

test('nextFrameRpcRequestId returns unique ids and advances the sequence', () => {
  const win = makeWindow();
  const ids = new Set();

  for (let i = 1; i <= 5; i += 1) {
    const id = nextFrameRpcRequestId(win);
    assert.match(id, /^req_[a-z0-9]+_\d+_[a-z0-9]+$/);
    assert.strictEqual(getFrameRpcRegistry(win).seq, i);
    ids.add(id);
  }

  assert.strictEqual(ids.size, 5);
});

test('pingFrame resolves true when a cooperating frame answers', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);

  assert.strictEqual(await pingFrame(parentWin, childHandle, PING_WAIT), true);
  assert.strictEqual(
    getFrameRpcRegistry(parentWin).pending.size,
    0,
    'expected the answered request to be cleared from the pending map'
  );
});

test('pingFrame resolves false when nothing answers, and cleans up', async () => {
  const parentWin = makeWindow();
  // A frame with no surea11y loaded: it receives the ping and does nothing.
  const silentFrame = { postMessage() {} };

  assert.strictEqual(await pingFrame(parentWin, silentFrame, 20), false);
  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('pingFrame resolves false when postMessage to the frame throws', async () => {
  const parentWin = makeWindow();
  const goneFrame = {
    postMessage() {
      throw new Error('window is closed');
    }
  };

  assert.strictEqual(await pingFrame(parentWin, goneFrame, 60_000), false);
  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('pingFrame defaults to a 500ms wait when none is given', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);

  assert.strictEqual(await pingFrame(parentWin, childHandle), true);
});

test('a late second pong for an already-settled ping is ignored', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle, parentHandle } = connect(parentWin, childWin);

  installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);
  const registry = getFrameRpcRegistry(parentWin);

  const seenIds = [];
  const originalDeliver = childHandle.postMessage;
  childHandle.postMessage = function record(data) {
    seenIds.push(data.requestId);
    return originalDeliver.call(this, data);
  };

  assert.strictEqual(await pingFrame(parentWin, childHandle, PING_WAIT), true);

  // Replay the pong the frame already sent. Nothing is pending under that id
  // any more, so it must be dropped rather than throw.
  deliver(
    parentWin,
    {
      __a11ycore: true,
      channel: FRAME_RPC_CHANNEL,
      requestId: seenIds[0],
      type: 'pong'
    },
    parentHandle
  );

  assert.strictEqual(registry.pending.size, 0);
});

test('the listener ignores traffic that is not ours', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);
  installFrameRpcListener(parentWin, FRAME_RPC_CHANNEL);

  const registry = getFrameRpcRegistry(parentWin);
  registry.pending.set('never-resolved', {
    onPong() {
      throw new Error('foreign traffic must not resolve a pending request');
    },
    resolve() {
      throw new Error('foreign traffic must not resolve a pending request');
    },
    reject() {
      throw new Error('foreign traffic must not reject a pending request');
    }
  });

  for (const foreign of [
    null,
    'a string from some other library',
    { requestId: 'never-resolved', type: 'pong' },
    { __a11ycore: true, channel: 'some-other-channel', requestId: 'never-resolved', type: 'pong' }
  ]) {
    deliver(parentWin, foreign, childHandle);
  }

  assert.strictEqual(registry.pending.size, 1);
  registry.pending.clear();
});

test('a ping whose sender is already gone does not throw', () => {
  const childWin = makeWindow();
  installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);

  const deadSource = {
    postMessage() {
      throw new Error('sender window is closed');
    }
  };

  for (const source of [null, deadSource]) {
    deliver(
      childWin,
      { __a11ycore: true, channel: FRAME_RPC_CHANNEL, requestId: 'req_x', type: 'ping' },
      source
    );
  }
});

test('sendFrameRunCommand resolves with the responder result', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  const seen = [];
  enableFrameRpcResponder(childWin, (payload) => {
    seen.push(payload);
    return { topFrame: { checksResults: [] }, frames: [] };
  });

  const result = await sendFrameRunCommand(
    parentWin,
    childHandle,
    { pageUrl: 'https://child.test/', contextSelector: null, engineOptions: {}, runOnly: null },
    RUN_WAIT
  );

  assert.deepStrictEqual(result, { topFrame: { checksResults: [] }, frames: [] });
  assert.deepStrictEqual(seen, [
    { pageUrl: 'https://child.test/', contextSelector: null, engineOptions: {}, runOnly: null }
  ]);
  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('sendFrameRunCommand awaits a responder that returns a promise', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  enableFrameRpcResponder(childWin, async () => {
    await tick(5);
    return { async: true };
  });

  assert.deepStrictEqual(await sendFrameRunCommand(parentWin, childHandle, {}, 60_000), {
    async: true
  });
});

test('sendFrameRunCommand rejects with the message a throwing responder produced', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  enableFrameRpcResponder(childWin, () => {
    throw new Error('the child frame blew up');
  });

  await assert.rejects(
    () => sendFrameRunCommand(parentWin, childHandle, {}, 60_000),
    /the child frame blew up/
  );
  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('sendFrameRunCommand rejects when a responder rejects with a non-Error', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  enableFrameRpcResponder(childWin, () => Promise.reject('just a string'));

  await assert.rejects(
    () => sendFrameRunCommand(parentWin, childHandle, {}, 60_000),
    /just a string/
  );
});

test('sendFrameRunCommand rejects on timeout when the frame never replies', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  // Listening, but no responder enabled: 'run' commands are dropped on the
  // floor, which is exactly what a frame with surea11y loaded but never
  // opted in looks like.
  installFrameRpcListener(childWin, FRAME_RPC_CHANNEL);

  await assert.rejects(
    () => sendFrameRunCommand(parentWin, childHandle, {}, 20),
    /timed out waiting for a run result/
  );
  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('sendFrameRunCommand defaults to a 60s wait when none is given', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  enableFrameRpcResponder(childWin, () => ({ ok: true }));

  assert.deepStrictEqual(await sendFrameRunCommand(parentWin, childHandle, {}), { ok: true });
});

test('sendFrameRunCommand rejects when postMessage to the frame throws', async () => {
  const parentWin = makeWindow();
  const goneFrame = {
    postMessage() {
      throw new Error('window is closed');
    }
  };

  await assert.rejects(
    () => sendFrameRunCommand(parentWin, goneFrame, {}, 60_000),
    /window is closed/
  );
  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('a responder whose caller is already gone does not throw', async () => {
  const childWin = makeWindow();
  enableFrameRpcResponder(childWin, () => ({ ok: true }));

  const deadSource = {
    postMessage() {
      throw new Error('caller window is closed');
    }
  };

  for (const source of [null, deadSource]) {
    deliver(
      childWin,
      {
        __a11ycore: true,
        channel: FRAME_RPC_CHANNEL,
        requestId: 'req_result',
        type: 'run',
        payload: {}
      },
      source
    );
  }

  await tick(10);
});

test('a throwing responder whose caller is already gone does not throw', async () => {
  const childWin = makeWindow();
  enableFrameRpcResponder(childWin, () => {
    throw new Error('nope');
  });

  const deadSource = {
    postMessage() {
      throw new Error('caller window is closed');
    }
  };

  for (const source of [null, deadSource]) {
    deliver(
      childWin,
      {
        __a11ycore: true,
        channel: FRAME_RPC_CHANNEL,
        requestId: 'req_error',
        type: 'run',
        payload: {}
      },
      source
    );
  }

  await tick(10);
});

test('enableFrameRpcResponder returns a disable() that stops future scans', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  const disable = enableFrameRpcResponder(childWin, () => ({ ok: true }));
  assert.deepStrictEqual(await sendFrameRunCommand(parentWin, childHandle, {}, RUN_WAIT), {
    ok: true
  });

  disable();
  assert.strictEqual(getFrameRpcRegistry(childWin).responder, null);
  await assert.rejects(
    () => sendFrameRunCommand(parentWin, childHandle, {}, 20),
    /timed out waiting for a run result/
  );

  // The listener itself stays installed, so re-enabling never re-attaches it.
  enableFrameRpcResponder(childWin, () => ({ again: true }));
  assert.deepStrictEqual(await sendFrameRunCommand(parentWin, childHandle, {}, RUN_WAIT), {
    again: true
  });
});

test('disable() from a superseded responder does not unregister its replacement', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  const disableFirst = enableFrameRpcResponder(childWin, () => ({ which: 'first' }));
  enableFrameRpcResponder(childWin, () => ({ which: 'second' }));

  disableFirst();

  assert.deepStrictEqual(await sendFrameRunCommand(parentWin, childHandle, {}, RUN_WAIT), {
    which: 'second'
  });
});

test('a ping still answers while a responder is enabled', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle } = connect(parentWin, childWin);

  enableFrameRpcResponder(childWin, () => ({ ok: true }));

  assert.strictEqual(await pingFrame(parentWin, childHandle, PING_WAIT), true);
});

test('a result or error reply for an unknown request is dropped', () => {
  const parentWin = makeWindow();
  installFrameRpcListener(parentWin, FRAME_RPC_CHANNEL);

  for (const type of ['result', 'error', 'pong']) {
    deliver(
      parentWin,
      {
        __a11ycore: true,
        channel: FRAME_RPC_CHANNEL,
        requestId: 'nobody-is-waiting',
        type,
        payload: {}
      },
      null
    );
  }

  assert.strictEqual(getFrameRpcRegistry(parentWin).pending.size, 0);
});

test('an error reply with a non-string payload still rejects with a usable message', async () => {
  const parentWin = makeWindow();
  installFrameRpcListener(parentWin, FRAME_RPC_CHANNEL);
  const registry = getFrameRpcRegistry(parentWin);

  const rejected = new Promise((resolve, reject) => {
    registry.pending.set('req_weird', {
      onPong() {},
      resolve,
      reject
    });
  });

  deliver(
    parentWin,
    {
      __a11ycore: true,
      channel: FRAME_RPC_CHANNEL,
      requestId: 'req_weird',
      type: 'error',
      payload: { not: 'a string' }
    },
    null
  );

  await assert.rejects(() => rejected, /surea11y frame RPC error/);
});

test('a stray pong for an in-flight run command is harmless', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  const { childHandle, parentHandle } = connect(parentWin, childWin);

  const seenIds = [];
  const forward = childHandle.postMessage;
  childHandle.postMessage = function record(data) {
    seenIds.push(data.requestId);
    return forward.call(this, data);
  };

  enableFrameRpcResponder(childWin, async () => {
    await tick(5);
    return { ok: true };
  });

  const pending = sendFrameRunCommand(parentWin, childHandle, {}, 60_000);

  deliver(
    parentWin,
    {
      __a11ycore: true,
      channel: FRAME_RPC_CHANNEL,
      requestId: seenIds[0],
      type: 'pong'
    },
    parentHandle
  );

  assert.deepStrictEqual(await pending, { ok: true });
});

test('a result or error reply to a ping is absorbed without settling it twice', async () => {
  const parentWin = makeWindow();
  const silentFrame = { postMessage() {} };
  const registry = getFrameRpcRegistry(parentWin);

  for (const [type, payload] of [
    ['result', { unexpected: true }],
    ['error', 'unexpected']
  ]) {
    const ping = pingFrame(parentWin, silentFrame, 60_000);
    const [requestId] = [...registry.pending.keys()];

    deliver(
      parentWin,
      { __a11ycore: true, channel: FRAME_RPC_CHANNEL, requestId, type, payload },
      silentFrame
    );

    // The ping's own resolve/reject slots are inert on purpose: a frame that
    // answers a ping with anything but a pong leaves it to time out rather
    // than reporting a bogus reachability verdict.
    assert.strictEqual(registry.pending.has(requestId), false);
    assert.strictEqual(
      await Promise.race([ping, tick(30).then(() => 'still-pending')]),
      'still-pending'
    );
  }
});

test('only the window a request went to may answer it', async () => {
  const parentWin = makeWindow();
  const child = { postMessage() {} };
  const bystander = { postMessage() {} };
  const registry = getFrameRpcRegistry(parentWin);

  const run = sendFrameRunCommand(parentWin, child, { pageUrl: null }, RUN_WAIT);
  const [requestId] = [...registry.pending.keys()];

  deliver(
    parentWin,
    {
      __a11ycore: true,
      channel: FRAME_RPC_CHANNEL,
      requestId,
      type: 'result',
      payload: { topFrame: { forged: true }, frames: [] }
    },
    bystander
  );

  await assert.rejects(run, /timed out/);
});

test('a ping is not answered on behalf of the frame it was sent to', async () => {
  const parentWin = makeWindow();
  const child = { postMessage() {} };
  const bystander = { postMessage() {} };
  const registry = getFrameRpcRegistry(parentWin);

  const ping = pingFrame(parentWin, child, PING_WAIT);
  const [requestId] = [...registry.pending.keys()];

  deliver(
    parentWin,
    { __a11ycore: true, channel: FRAME_RPC_CHANNEL, requestId, type: 'pong' },
    bystander
  );

  assert.strictEqual(await ping, false, 'reachability is the addressed frame’s answer to give');
});

test('a responder answers only the frame that embeds it, not a sibling holding a reference', async () => {
  const parentWin = makeWindow();
  const childWin = makeWindow();
  connect(parentWin, childWin);

  let answered = null;
  enableFrameRpcResponder(childWin, () => ({ secret: 'child dom' }));

  const sibling = {
    postMessage(data) {
      answered = data;
    }
  };
  deliver(
    childWin,
    {
      __a11ycore: true,
      channel: FRAME_RPC_CHANNEL,
      requestId: 'sibling-1',
      type: 'run',
      payload: {}
    },
    sibling
  );
  await tick(30);

  assert.strictEqual(answered, null, 'a sibling frame must not be able to read this frame’s DOM');
});

test('a responder in an unframed window answers nobody', async () => {
  const win = makeWindow();
  let answered = null;
  enableFrameRpcResponder(win, () => ({ secret: 'top dom' }));

  const caller = {
    postMessage(data) {
      answered = data;
    }
  };
  deliver(
    win,
    {
      __a11ycore: true,
      channel: FRAME_RPC_CHANNEL,
      requestId: 'opener-1',
      type: 'run',
      payload: {}
    },
    caller
  );
  await tick(30);

  assert.strictEqual(answered, null, 'nothing embeds a top-level window, so nothing may scan it');
});
