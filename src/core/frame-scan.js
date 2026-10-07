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

// The only module required here: a self-contained one, inlined into the
// page bundle next to these functions.
const { createSafeDom } = require('./safe-dom');

/* global runa11yCoreInPage, resolveContextRoots, normalizeSelectorList, pingFrame,
   sendFrameRunCommand, enableFrameRpcResponder */

function findChildFrameElements(roots) {
  const dom = createSafeDom();
  const seen = new Set();
  const out = [];
  for (const root of roots) {
    if (!root || typeof dom.get(root, 'querySelectorAll') !== 'function') continue;
    let matches;
    try {
      matches = dom.querySelectorAll(root, 'iframe, frame');
    } catch {
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

// A frame the page does not show -- under display:none or the hidden
// attribute, in a closed <details>, under content-visibility:hidden -- is
// left out like any other hidden content, so its findings are not reported
// as the page's. checkVisibility() answers it; a browser without it scans
// every frame, as before.
function isFrameShown(el) {
  const dom = createSafeDom();
  try {
    if (typeof dom.get(el, 'checkVisibility') === 'function') {
      return dom.checkVisibility(el, { visibilityProperty: true });
    }
  } catch {}
  return true;
}

// A frame matching excludeSelectors, or inside an element that does, is
// left out with its whole content, as excluded content is by every rule:
// excluding a third-party embed (an ad slot, a video player) keeps its
// document out of the result too. A selector the page can't parse
// excludes nothing; the scan of this frame has already said so.
function isFrameExcluded(el, excludeSelectors) {
  const dom = createSafeDom();
  for (const selector of normalizeSelectorList(excludeSelectors)) {
    try {
      if (dom.closest(el, selector)) return true;
    } catch {}
  }
  return false;
}

// A selector for a frame element in its document, so an entry names its
// <iframe>: its id when no other element has it, else the element's path
// by type from the nearest ancestor with such an id, or from <html>.
function getFrameElementSelector(el) {
  const dom = createSafeDom();
  const doc = dom.ownerDocument(el);
  const uniqueId = (node) => {
    const id = dom.get(node, 'getAttribute') ? dom.getAttribute(node, 'id') : null;
    if (!id || !/^[A-Za-z_][\w-]*$/.test(id)) return null;
    try {
      return dom.querySelectorAll(doc, '#' + id).length === 1 ? '#' + id : null;
    } catch {
      return null;
    }
  };
  const parts = [];
  for (let node = el; node && dom.nodeType(node) === 1; node = dom.parentElement(node)) {
    const id = uniqueId(node);
    if (id) {
      parts.unshift(id);
      break;
    }
    const tag = String(dom.localName(node) || '').toLowerCase();
    if (!dom.parentElement(node)) {
      parts.unshift(tag);
      break;
    }
    let index = 1;
    let others = 0;
    for (let sib = dom.previousElementSibling(node); sib; sib = dom.previousElementSibling(sib)) {
      if (String(dom.localName(sib) || '').toLowerCase() === tag) index++;
    }
    for (
      let sib = dom.nextElementSibling(node);
      sib && !others;
      sib = dom.nextElementSibling(sib)
    ) {
      if (String(dom.localName(sib) || '').toLowerCase() === tag) others++;
    }
    parts.unshift(index > 1 || others ? tag + ':nth-of-type(' + index + ')' : tag);
  }
  return parts.join(' > ');
}

// Which <iframe>/<frame> an entry is: its selector, and its title, the
// name it gives its content.
function describeFrameElement(el) {
  const dom = createSafeDom();
  let title = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'title') : null;
  title = typeof title === 'string' && title.trim() ? title.trim() : null;
  let selector = null;
  try {
    selector = getFrameElementSelector(el) || null;
  } catch {}
  return { selector: selector, title: title };
}

function getFrameElementUrl(el) {
  const dom = createSafeDom();
  // A frame that has not navigated yet (still loading, or never answering)
  // shows about:blank; the URL it was given says which document it is.
  const src = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'src') : null;
  try {
    if (
      dom.contentWindow(el) &&
      dom.contentWindow(el).location &&
      dom.contentWindow(el).location.href
    ) {
      const href = dom.contentWindow(el).location.href;
      if (href !== 'about:blank' || !src || !String(src).trim()) return href;
      return dom.get(el, 'src') || src;
    }
  } catch {
    // Cross-origin: reading contentWindow.location.href itself throws. Fall
    // back to the authored src attribute (always readable, any origin).
  }
  return dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'src') || null : null;
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
  const dom = createSafeDom();
  // An invalid contextSelector (or runOnly) throws in the local scan; reject
  // with it, as any other failure of this promise-returning call would.
  let topFrame;
  try {
    topFrame = runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly);
  } catch (err) {
    return Promise.reject(err);
  }

  const eo = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
  const pingWaitTime = typeof eo.pingWaitTime === 'number' ? eo.pingWaitTime : undefined;
  const frameWaitTime = typeof eo.frameWaitTime === 'number' ? eo.frameWaitTime : undefined;

  const { roots } = resolveContextRoots(document, contextSelector);
  const frameElements = findChildFrameElements(roots).filter(
    (el) =>
      (eo.includeHiddenElements === true || isFrameShown(el)) &&
      !isFrameExcluded(el, eo.excludeSelectors)
  );

  const framePromises = frameElements.map(function (el) {
    const described = describeFrameElement(el);
    return scanFrame(el).then(function (entry) {
      const out = { url: entry.url, selector: described.selector, title: described.title };
      for (const key of Object.keys(entry)) if (key !== 'url') out[key] = entry[key];
      return out;
    });
  });

  function scanFrame(el) {
    const url = getFrameElementUrl(el);
    let targetWindow = null;
    try {
      targetWindow = dom.contentWindow(el) || null;
    } catch {
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
  }

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
 * as-is: the parent's request carries the options, the child just executes
 * with them, no local override.
 *
 * Only the frame that embeds this one is answered. Any window holding a
 * reference can postMessage here -- a sibling frame reached through
 * parent.frames[i], or an opener -- and a scan result carries occurrence
 * html, which is DOM content the same-origin policy gives those windows no
 * way to read. The relay is hop-by-hop, so a legitimate request always comes
 * from the direct parent; everything else is refused in frame-messaging.js.
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
  isFrameShown,
  isFrameExcluded,
  getFrameElementSelector,
  describeFrameElement,
  getFrameElementUrl,
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder
};
