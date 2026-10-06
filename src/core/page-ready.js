/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Waits for the page to finish loading, for code about to scan it.
 *
 * A scan reads the page as it is at that moment (runa11yCoreInPage is
 * synchronous, and stays so). A layout rule measuring text in a fallback
 * font, or boxes an image hasn't arrived in yet, gets another result a
 * moment later, so a tool scanning a page it has just opened waits for it
 * first: the bindings, an in-page integration such as a CMS plugin, anyone
 * else. The scan itself never calls this.
 *
 * In order, each within what is left of `timeoutMs` (default 5000):
 *   - the window's `load` event, unless the document has already loaded;
 *   - `document.fonts.ready`;
 *   - every image still loading, except those with loading="lazy", which
 *     wait for the reader to scroll and may never load;
 *   - with `quietMs`, no change to the DOM for that long, for a page its
 *     script is still building after `load`. Off by default: a page that
 *     updates itself all the time (a live feed, a clock) never goes quiet.
 *
 * It never rejects. It resolves with `ready: true` when all of that
 * happened, or, when the time ran out first, `ready: false` and `pending`
 * saying what was still loading, so a result taken on an unsettled page can
 * be read for what it is. Without a document (Node with no DOM) or in jsdom,
 * which loads nothing, it resolves at once.
 *
 * Self-contained, with nothing from outside its body but the page's own
 * globals, so a binding can send its source into the page as it does
 * runa11yCoreInPage's.
 *
 * @param {{ timeoutMs?: number, quietMs?: number, document?: Document }} [options]
 * @returns {Promise<{ ready: boolean, waitedMs: number,
 *   pending: { load: boolean, fonts: boolean, images: number, domChanging?: boolean } }>}
 */
async function waitForPageReady(options) {
  // Reads DOM properties through the prototypes, so a page's named form
  // controls and images can't redirect them (#90): the same lookup as
  // src/core/safe-dom.js, repeated because this function travels alone.
  const dom = (() => {
    const lookup = (obj, name) => {
      for (let p = Object.getPrototypeOf(obj); p; p = Object.getPrototypeOf(p)) {
        const d = Object.getOwnPropertyDescriptor(p, name);
        if (d && (typeof d.get === 'function' || typeof d.value === 'function')) return d;
      }
      return null;
    };
    const get = (obj, name) => {
      const d = lookup(obj, name);
      return d ? (d.get ? Reflect.apply(d.get, obj, []) : d.value) : obj[name];
    };
    const read = (name) => (obj) => {
      const d = lookup(obj, name);
      return d && d.get ? Reflect.apply(d.get, obj, []) : obj[name];
    };
    const call =
      (name) =>
      (obj, ...args) => {
        const d = lookup(obj, name);
        return Reflect.apply(d && typeof d.value === 'function' ? d.value : obj[name], obj, args);
      };
    return {
      get,
      defaultView: read('defaultView'),
      fonts: read('fonts'),
      readyState: read('readyState'),
      querySelectorAll: call('querySelectorAll'),
      getAttribute: call('getAttribute'),
      addEventListener: call('addEventListener'),
      removeEventListener: call('removeEventListener')
    };
  })();
  const opts = options && typeof options === 'object' ? options : {};
  const doc = opts.document || (typeof document !== 'undefined' ? document : null);
  const win = doc && dom.defaultView(doc) ? dom.defaultView(doc) : null;
  const validTimeout = Number.isFinite(opts.timeoutMs) && opts.timeoutMs >= 0;
  if (opts.timeoutMs !== undefined && !validTimeout) {
    try {
      console.warn(
        '[surea11y] waitForPageReady: timeoutMs must be a finite number of milliseconds, 0 or more; got ' +
          String(opts.timeoutMs) +
          ', so the default 5000 applies.'
      );
    } catch {}
  }
  const timeoutMs = validTimeout ? opts.timeoutMs : 5000;
  const quietMs = Number.isFinite(opts.quietMs) && opts.quietMs > 0 ? opts.quietMs : 0;
  const started = Date.now();
  const left = () => Math.max(0, timeoutMs - (Date.now() - started));

  // Resolves when `promise` settles or the time left runs out, whichever is
  // first; never rejects.
  function within(promise) {
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(resolve, left());
    });
    return Promise.race([Promise.resolve(promise).then(null, () => {}), timeout]).then(() =>
      clearTimeout(timer)
    );
  }

  function pendingImages() {
    if (!doc || typeof dom.get(doc, 'querySelectorAll') !== 'function') return [];
    return Array.from(dom.querySelectorAll(doc, 'img')).filter(
      (img) =>
        !img.complete && String(dom.getAttribute(img, 'loading') || '').toLowerCase() !== 'lazy'
    );
  }

  function fontsLoading() {
    let loading = false;
    try {
      if (dom.fonts(doc) && typeof dom.fonts(doc).forEach === 'function') {
        dom.fonts(doc).forEach((face) => {
          if (face && face.status === 'loading') loading = true;
        });
      }
    } catch {}
    return loading;
  }

  let domQuiet;
  if (doc) {
    if (dom.readyState(doc) !== 'complete' && win) {
      let onLoad = null;
      await within(
        new Promise((resolve) => {
          onLoad = resolve;
          dom.addEventListener(win, 'load', resolve, { once: true });
        })
      );
      if (onLoad) dom.removeEventListener(win, 'load', onLoad);
    }

    if (dom.fonts(doc) && dom.fonts(doc).ready && left() > 0) await within(dom.fonts(doc).ready);

    const images = pendingImages();
    if (images.length && left() > 0) {
      const cleanups = [];
      await within(
        Promise.all(
          images.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) return resolve();
                dom.addEventListener(img, 'load', resolve, { once: true });
                dom.addEventListener(img, 'error', resolve, { once: true });
                cleanups.push(() => {
                  dom.removeEventListener(img, 'load', resolve);
                  dom.removeEventListener(img, 'error', resolve);
                });
              })
          )
        )
      );
      for (const cleanup of cleanups) cleanup();
    }

    if (quietMs) {
      domQuiet = false;
      // The document's own window's observer: the global one belongs to
      // another realm, or doesn't exist (Node with jsdom).
      const Observer =
        (win && win.MutationObserver) ||
        (typeof MutationObserver === 'function' ? MutationObserver : null);
      if (left() > 0 && Observer) {
        let observer = null;
        let timer = null;
        await within(
          new Promise((resolve) => {
            const done = () => {
              domQuiet = true;
              resolve();
            };
            timer = setTimeout(done, quietMs);
            observer = new Observer(() => {
              clearTimeout(timer);
              timer = setTimeout(done, quietMs);
            });
            observer.observe(doc, {
              subtree: true,
              childList: true,
              attributes: true,
              characterData: true
            });
          })
        );
        clearTimeout(timer);
        if (observer) observer.disconnect();
      }
    }
  }

  const pending = {
    load: !!doc && dom.readyState(doc) !== 'complete',
    fonts: !!doc && fontsLoading(),
    images: pendingImages().length
  };
  if (quietMs) pending.domChanging = !domQuiet;
  return {
    ready: !pending.load && !pending.fonts && pending.images === 0 && !pending.domChanging,
    waitedMs: Date.now() - started,
    pending
  };
}

module.exports = { waitForPageReady };
