'use strict';

/**
 * postMessage-based RPC used to reach into cooperating child frames (same-
 * or cross-origin, treated identically). Used by frame-scan.js.
 *
 * Only matters for the "plain script injection" consumption mode (surea11y
 * loaded directly into a page with no automation driver -- see
 * docs/INTEGRATION.md's "Browser extension context" section). A Playwright-
 * driven scan doesn't need any of this: Playwright reaches cross-origin
 * frames unconditionally via CDP (see @surea11y/playwright's ROADMAP.md gap
 * #1), which is strictly better than what a cooperative postMessage protocol
 * can achieve. This exists for when there IS no automation driver.
 *
 * Zero free vars in each exported piece -- inlined into generated core.js
 * via inlineConstFunction (scripts/build-core.js), same as dom-helpers.js/
 * dom-runner.js/rule-meta.js. All functions here become sibling `const`
 * declarations in the same generated scope, so they may freely reference
 * each other (matching how resolveEffectiveRunOnly/ruleMatchesRunOnly/etc.
 * already do) -- but each is independently a zero-free-var function with
 * respect to anything OUTSIDE that shared generated scope.
 */

const FRAME_RPC_CHANNEL = '__frame_rpc_v1__';

function getFrameRpcRegistry(win) {
  if (!win.__a11yCoreFrameRpc__) {
    win.__a11yCoreFrameRpc__ = {
      pending: new Map(),
      seq: 0,
      responder: null,
      listening: false
    };
  }
  return win.__a11yCoreFrameRpc__;
}

function installFrameRpcListener(win, channel) {
  const registry = getFrameRpcRegistry(win);
  if (registry.listening) return registry;

  win.addEventListener('message', function a11yCoreFrameRpcListener(event) {
    const data = event && event.data;
    if (!data || data.__a11ycore !== true || data.channel !== channel) return;

    if (data.type === 'ping') {
      try {
        event.source &&
          event.source.postMessage(
            { __a11ycore: true, channel: channel, requestId: data.requestId, type: 'pong' },
            '*'
          );
      } catch (e) {
        /* target gone/closed -- nothing to do */
      }
      return;
    }

    if (data.type === 'run') {
      const responder = registry.responder;
      if (typeof responder !== 'function') return; // no responder enabled here: unreachable
      Promise.resolve()
        .then(function () {
          return responder(data.payload);
        })
        .then(function (result) {
          try {
            event.source &&
              event.source.postMessage(
                {
                  __a11ycore: true,
                  channel: channel,
                  requestId: data.requestId,
                  type: 'result',
                  payload: result
                },
                '*'
              );
          } catch (e) {
            /* target gone/closed */
          }
        })
        .catch(function (err) {
          try {
            event.source &&
              event.source.postMessage(
                {
                  __a11ycore: true,
                  channel: channel,
                  requestId: data.requestId,
                  type: 'error',
                  payload: String(err && err.message ? err.message : err)
                },
                '*'
              );
          } catch (e) {
            /* target gone/closed */
          }
        });
      return;
    }

    // 'pong' | 'result' | 'error' -- resolve whichever pending request this replies to.
    const pending = registry.pending.get(data.requestId);
    if (!pending) return;
    if (data.type === 'pong') {
      pending.onPong();
      return;
    }
    registry.pending.delete(data.requestId);
    if (data.type === 'result') pending.resolve(data.payload);
    else
      pending.reject(
        new Error(typeof data.payload === 'string' ? data.payload : 'surea11y frame RPC error')
      );
  });

  registry.listening = true;
  return registry;
}

function nextFrameRpcRequestId(win) {
  const registry = getFrameRpcRegistry(win);
  registry.seq += 1;
  return (
    'req_' +
    Date.now().toString(36) +
    '_' +
    registry.seq +
    '_' +
    Math.random().toString(36).slice(2, 8)
  );
}

/**
 * Pings a target frame's window; resolves true if a cooperating surea11y
 * responder answers within pingWaitTime (default 500ms), false otherwise.
 * Never rejects -- "not reachable" is a normal, expected outcome (most
 * iframes on the web have no surea11y loaded at all), not an error.
 */
function pingFrame(win, targetWindow, pingWaitTime) {
  installFrameRpcListener(win, FRAME_RPC_CHANNEL);
  const registry = getFrameRpcRegistry(win);
  const requestId = nextFrameRpcRequestId(win);
  const waitMs = typeof pingWaitTime === 'number' ? pingWaitTime : 500;

  return new Promise(function (resolve) {
    let settled = false;
    const timeout = setTimeout(function () {
      if (settled) return;
      settled = true;
      registry.pending.delete(requestId);
      resolve(false);
    }, waitMs);

    registry.pending.set(requestId, {
      onPong: function () {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        registry.pending.delete(requestId);
        resolve(true);
      },
      resolve: function () {},
      reject: function () {}
    });

    try {
      targetWindow.postMessage(
        { __a11ycore: true, channel: FRAME_RPC_CHANNEL, requestId: requestId, type: 'ping' },
        '*'
      );
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        registry.pending.delete(requestId);
        resolve(false);
      }
    }
  });
}

/**
 * Sends a 'run' command to a target frame's window (already confirmed
 * reachable via pingFrame) and resolves with its reply payload, or rejects
 * on timeout (default 60s) or an explicit error reply.
 */
function sendFrameRunCommand(win, targetWindow, payload, frameWaitTime) {
  installFrameRpcListener(win, FRAME_RPC_CHANNEL);
  const registry = getFrameRpcRegistry(win);
  const requestId = nextFrameRpcRequestId(win);
  const waitMs = typeof frameWaitTime === 'number' ? frameWaitTime : 60000;

  return new Promise(function (resolve, reject) {
    const timeout = setTimeout(function () {
      registry.pending.delete(requestId);
      reject(new Error('surea11y frame RPC timed out waiting for a run result'));
    }, waitMs);

    registry.pending.set(requestId, {
      onPong: function () {},
      resolve: function (result) {
        clearTimeout(timeout);
        resolve(result);
      },
      reject: function (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    try {
      targetWindow.postMessage(
        {
          __a11ycore: true,
          channel: FRAME_RPC_CHANNEL,
          requestId: requestId,
          type: 'run',
          payload: payload
        },
        '*'
      );
    } catch (e) {
      clearTimeout(timeout);
      registry.pending.delete(requestId);
      reject(e);
    }
  });
}

/**
 * Registers this window as reachable by a parent frame's scan: `handler`
 * receives the run command's payload and must return a result (or a
 * Promise of one). Returns a disable() function that removes the responder
 * (the message listener itself stays installed -- harmless/idle -- so a
 * later re-enable doesn't need to re-attach it).
 */
function enableFrameRpcResponder(win, handler) {
  installFrameRpcListener(win, FRAME_RPC_CHANNEL);
  const registry = getFrameRpcRegistry(win);
  registry.responder = handler;
  return function disable() {
    if (registry.responder === handler) registry.responder = null;
  };
}

module.exports = {
  FRAME_RPC_CHANNEL,
  getFrameRpcRegistry,
  installFrameRpcListener,
  nextFrameRpcRequestId,
  pingFrame,
  sendFrameRunCommand,
  enableFrameRpcResponder
};
