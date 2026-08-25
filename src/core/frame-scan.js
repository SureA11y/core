/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Cross-frame orchestration for the "plain script injection" consumption
 * mode (surea11y loaded directly into a page with no automation driver --
 * see docs/INTEGRATION.md's "Browser extension context" section). A
 * Playwright-driven scan doesn't need any of this (see
 * @surea11y/playwright's ROADMAP.md gap #1 -- CDP-level frame access is
 * unconditional, strictly better than what a cooperative protocol like this
 * one can achieve). This exists for when there is no automation driver.
 *
 * Inlined into generated core.js (via scripts/build-core.js), wrapped in its
 * own private IIFE alongside the postMessage helpers it needs. The local
 * frame is scanned through runa11yCoreInPage, which is itself self-contained
 * and require-free, so this stays usable the same bundler-free way that
 * function already is: raw source injected into a page, a bookmarklet or a
 * content script with no build step, rather than needing a bundler to
 * resolve `require()` calls first. Delegating also keeps the rule catalog
 * and the shared runner block from being emitted a second time -- they
 * account for roughly half of core.js on their own.
 *
 * References runa11yCoreInPage/resolveContextRoots/pingFrame/
 * sendFrameRunCommand/enableFrameRpcResponder as free vars, satisfied by
 * that wrapping. Not requireable/testable in isolation for that reason
 * (same as dom-runner.js) -- test via the generated core.js bundle instead.
 */

/* global runa11yCoreInPage, resolveContextRoots, pingFrame,
   sendFrameRunCommand, enableFrameRpcResponder */

function findChildFrameElements(roots) {
  const seen = new Set();
  const out = [];
  for (const root of roots) {
    if (!root || typeof root.querySelectorAll !== 'function') continue;
    let matches;
    try {
      matches = root.querySelectorAll('iframe, frame');
    } catch (e) {
      matches = [];
    }
    for (const el of matches) {
      if (el && !seen.has(el)) {
        seen.add(el);
        out.push(el);
      }
    }
  }
  return out;
}

function getFrameElementUrl(el) {
  try {
    if (el.contentWindow && el.contentWindow.location && el.contentWindow.location.href) {
      return el.contentWindow.location.href;
    }
  } catch (e) {
    // Cross-origin: reading contentWindow.location.href itself throws. Fall
    // back to the authored src attribute (always readable, any origin).
  }
  return el.getAttribute ? el.getAttribute('src') || null : null;
}

/**
 * Scans the current frame, then attempts to reach every direct child
 * <iframe>/<frame> within the same scan scope via the frame RPC protocol
 * (src/core/frame-messaging.js). A child that doesn't respond (no
 * cooperating surea11y loaded and enabled there via
 * a11yCoreEnableFrameResponder() -- the common case for most third-party
 * embeds) is reported as { url, error } rather than aborting the scan,
 * matching the non-fatal-per-frame philosophy already
 * established for the Playwright binding's .frames(true). A child that
 * does respond replies with its OWN complete { topFrame, frames } result,
 * recursively including ITS OWN nested frames -- a tree, not a flat list
 * (unlike the Playwright binding: that binding can flatten because
 * Playwright's page.frames() already gives a flat list regardless of
 * nesting depth; a postMessage relay can't know about a grandchild without
 * asking through the child first).
 *
 * @returns {Promise<{ topFrame: object, frames: Array<{url:string|null, topFrame?:object, frames?:Array, error?:string}> }>}
 */
function runa11yCoreAcrossFrames(pageUrl, contextSelector, engineOptions, runOnly) {
  const topFrame = runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly);

  const eo = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
  const pingWaitTime = typeof eo.pingWaitTime === 'number' ? eo.pingWaitTime : undefined;
  const frameWaitTime = typeof eo.frameWaitTime === 'number' ? eo.frameWaitTime : undefined;

  const { roots } = resolveContextRoots(document, contextSelector);
  const frameElements = findChildFrameElements(roots);

  const framePromises = frameElements.map(function (el) {
    const url = getFrameElementUrl(el);
    let targetWindow = null;
    try {
      targetWindow = el.contentWindow || null;
    } catch (e) {
      targetWindow = null;
    }
    if (!targetWindow) {
      return Promise.resolve({ url: url, error: 'frame has no accessible contentWindow' });
    }

    return pingFrame(window, targetWindow, pingWaitTime).then(function (reachable) {
      if (!reachable) {
        return {
          url: url,
          error:
            'no surea11y frame responder detected (that frame never called a11yCoreEnableFrameResponder(), or has not finished loading yet)'
        };
      }
      return sendFrameRunCommand(
        window,
        targetWindow,
        { pageUrl: url, contextSelector: null, engineOptions: eo, runOnly: runOnly },
        frameWaitTime
      )
        .then(function (result) {
          return { url: url, topFrame: result.topFrame, frames: result.frames };
        })
        .catch(function (err) {
          return { url: url, error: String(err && err.message ? err.message : err) };
        });
    });
  });

  return Promise.all(framePromises).then(function (frames) {
    return { topFrame: topFrame, frames: frames };
  });
}

/**
 * Opt-in: makes the CURRENT window reachable by a parent frame's
 * runa11yCoreAcrossFrames() call. A page calls this once (e.g. right after
 * loading surea11y) to become scannable from above. Deliberately a
 * separate, explicit call rather than an automatic side effect of loading
 * surea11y's code: an explicit opt-in is a clear consent point, and it
 * means every Node/jsdom consumer that merely requires the module never
 * gets a phantom `window.addEventListener` they didn't ask for.
 *
 * The incoming run command's own engineOptions/runOnly are always used
 * as-is (the parent's request carries the options, the child just executes
 * with them, no local override) -- there's no origin/identity check on the
 * sender beyond the namespaced message envelope itself (running a read-only
 * scan and replying with DOM-derived results isn't a privileged operation;
 * the DOM content involved is no more sensitive than what's already
 * rendered on the page).
 *
 * @returns {function(): void} disable() -- stops responding to future scans
 */
function a11yCoreEnableFrameResponder() {
  return enableFrameRpcResponder(window, function (payload) {
    return runa11yCoreAcrossFrames(
      payload ? payload.pageUrl : null,
      payload ? payload.contextSelector : null,
      payload ? payload.engineOptions : {},
      payload ? payload.runOnly : null
    );
  });
}

module.exports = {
  findChildFrameElements,
  getFrameElementUrl,
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder
};
