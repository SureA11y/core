/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Fetches the text of the style sheets a page can't read, for a scan to
 * read instead.
 *
 * A page's script can't read the rules of a style sheet from another origin
 * (CSSOM: cssRules throws), so a rule that looks for something in the CSS,
 * as css-orientation-lock does, can't tell whether it is there and asks
 * about it. Many such sheets are served with CORS headers (fonts services,
 * CDNs), so a script may fetch them all the same; axe does the same before
 * it scans. This fetches every sheet the page can't read, those it links
 * and those an @import brings in, and resolves with
 * [{ href, text }] for the ones it got, which a scan takes as
 * engineOptions.styleSheetTexts. A sheet the server doesn't share stays
 * unreadable; a binding can fetch it from outside the page instead.
 *
 * It never rejects. Each fetch is given up after `timeoutMs` (default 5000),
 * without credentials. Without a document or fetch it resolves with [].
 *
 * Self-contained, with nothing from outside its body but the page's own
 * globals: the browser bundle includes it by its source.
 */
async function preloadStyleSheets(options) {
  const opts = options && typeof options === 'object' ? options : {};
  const doc = opts.document || (typeof document !== 'undefined' ? document : null);
  const timeoutMs =
    typeof opts.timeoutMs === 'number' && Number.isFinite(opts.timeoutMs) && opts.timeoutMs >= 0
      ? opts.timeoutMs
      : 5000;
  const fetchFn = typeof fetch === 'function' ? fetch : null;
  if (!doc || !fetchFn) return [];

  // The sheets that can't be read, by their absolute URL: linked ones, and
  // those an @import in a readable sheet brings in.
  const hrefs = [];
  function visit(sheet, depth) {
    if (!sheet || depth > 10) return;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      rules = null;
    }
    if (!rules) {
      if (sheet.href && !hrefs.includes(sheet.href)) hrefs.push(sheet.href);
      return;
    }
    for (const rule of Array.from(rules)) {
      // CSSImportRule
      if (rule && rule.type === 3) visit(rule.styleSheet, depth + 1);
    }
  }
  // Read through Document's own getter: an element named "styleSheets" (a
  // form control, an image) shadows document.styleSheets.
  try {
    const view = typeof window !== 'undefined' ? window : null;
    const proto = view && view.Document ? view.Document.prototype : null;
    const getter = proto && Object.getOwnPropertyDescriptor(proto, 'styleSheets');
    const list = getter && getter.get ? getter.get.call(doc) : [];
    for (const sheet of Array.from(list || [])) visit(sheet, 0);
  } catch {
    return [];
  }

  function withTimeout(promise) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      promise.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        }
      );
    });
  }

  const got = await Promise.all(
    hrefs.map((href) =>
      withTimeout(
        fetchFn(href, { mode: 'cors', credentials: 'omit' }).then((res) =>
          res && res.ok ? res.text().then((text) => ({ href, text })) : null
        )
      )
    )
  );
  return got.filter((s) => s && typeof s.text === 'string');
}

module.exports = { preloadStyleSheets };
