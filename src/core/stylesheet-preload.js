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
 * CDNs), so a script may fetch them all the same. This fetches every sheet
 * the page can't read, those it links and those an @import brings in,
 * whether in a sheet the page reads or in one it fetches, and resolves with
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
  // The options' own keys only: a value a page's script put on
  // Object.prototype (deadline: 0) is never read as one (round 12, R12F-7).
  const option = (key) =>
    options && typeof options === 'object' && Object.prototype.hasOwnProperty.call(options, key)
      ? options[key]
      : undefined;
  const doc = option('document') || (typeof document !== 'undefined' ? document : null);
  const givenTimeout = option('timeoutMs');
  const timeoutMs =
    typeof givenTimeout === 'number' && Number.isFinite(givenTimeout) && givenTimeout >= 0
      ? givenTimeout
      : 5000;
  const fetchFn = typeof fetch === 'function' ? fetch : null;
  const givenDeadline = option('deadline');
  const deadline =
    typeof givenDeadline === 'number' && Number.isFinite(givenDeadline) ? givenDeadline : null;
  // The sheets the deadline left unread, on the list resolved with.
  const notRead = [];
  const done = (list) => {
    Object.defineProperty(list, 'notRead', { value: notRead });
    return list;
  };
  if (!doc || !fetchFn) return done([]);

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
    for (const rule of [...rules]) {
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
    for (const sheet of [...(list || [])]) visit(sheet, 0);
  } catch {
    return done([]);
  }

  // Each fetch waits timeoutMs, and never past the deadline; one the
  // deadline cut short is named in notRead.
  function withTimeout(promise, href) {
    return new Promise((resolve) => {
      const wait = deadline === null ? timeoutMs : Math.min(timeoutMs, deadline - Date.now());
      const timer = setTimeout(
        () => {
          if (deadline !== null && wait < timeoutMs) notRead.push(href);
          resolve(null);
        },
        Math.max(0, wait)
      );
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

  function fetchText(href) {
    if (deadline !== null && Date.now() >= deadline) {
      notRead.push(href);
      return Promise.resolve(null);
    }
    return withTimeout(
      fetchFn(href, { mode: 'cors', credentials: 'omit' }).then((res) =>
        res && res.ok ? res.text().then((text) => ({ href, text })) : null
      ),
      href
    );
  }

  // The sheets a fetched sheet @imports, by their absolute URL. The page
  // can't list them, since it can't read the sheet that imports them.
  const IMPORT = /@import\s+(?:url\(\s*(['"]?)([^'")\s]+)\1\s*\)|(['"])([^'"]+)\3)/gi;
  function importsOf(sheet) {
    const out = [];
    const text = sheet.text.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(IMPORT)) {
      try {
        out.push(new URL(m[2] || m[4], sheet.href).href);
      } catch {
        // not a URL
      }
    }
    return out;
  }

  // Fetched level by level, so the sheets one imports are fetched once it
  // has come, and each URL once.
  const seen = new Set(hrefs);
  const out = [];
  let level = hrefs;
  for (let depth = 0; level.length && depth <= 10; depth++) {
    const got = (await Promise.all(level.map(fetchText))).filter(
      (s) => s && typeof s.text === 'string'
    );
    out.push(...got);
    level = [];
    for (const sheet of got) {
      for (const href of importsOf(sheet)) {
        if (seen.has(href)) continue;
        seen.add(href);
        level.push(href);
      }
    }
  }
  return done(out);
}

module.exports = { preloadStyleSheets };
