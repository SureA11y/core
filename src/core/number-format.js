/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Numbers in human messages, written as the message's language writes them:
 * a contrast ratio of 1.36 reads "1,36:1" in French, German and Spanish, and
 * "1.36:1" in English and Japanese. Only the text people read changes: a
 * finding's data, details, metrics and i18n.params keep plain numbers.
 *
 * Inlined into generated core.js (scripts/build-core.js), so every function
 * here is self-contained: no references to anything outside its own body.
 */

/**
 * A decimal as `locale` writes it: the same digits, with the locale's
 * decimal separator. Anything that is not a finite number or a plain decimal
 * string ("1.36", "-0.5"), such as an integer, a CSS value or a version, is
 * returned as it is, and so is a decimal in a locale that writes a point
 * (English, Japanese) or one Intl does not know.
 */
function formatLocaleDecimal(value, locale) {
  let text;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return value;
    text = String(value);
  } else if (typeof value === 'string') {
    text = value;
  } else {
    return value;
  }
  const m = /^(-?\d+)\.(\d+)$/.exec(text);
  if (!m || !locale) return value;
  // The separator, worked out once per locale. A locale Intl does not know,
  // or one that writes other digits, keeps the point.
  const key = String(locale);
  // Own, with no prototype, and defined, not assigned (round 12, F12-4).
  if (!Object.prototype.hasOwnProperty.call(formatLocaleDecimal, 'separators')) {
    Object.defineProperty(formatLocaleDecimal, 'separators', {
      value: Object.create(null),
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  const cache = formatLocaleDecimal.separators;
  if (!Object.prototype.hasOwnProperty.call(cache, key)) {
    let sep = '.';
    try {
      const shown = new Intl.NumberFormat(key, { useGrouping: false }).format(1.5);
      if (/^1[^0-9]5$/.test(shown)) sep = shown.charAt(1);
    } catch {
      sep = '.';
    }
    cache[key] = sep;
  }
  return cache[key] === '.' ? value : `${m[1]}${cache[key]}${m[2]}`;
}

/**
 * The params a message is written with, the decimals among them written as
 * `locale` writes them. Only params named as a measurement are changed: a
 * contrast ratio or threshold (`ratio`, `bestRatio`, `threshold`,
 * `ownThreshold`...) or a size in pixels (`fontSizePx`...). A value quoted
 * from the page or its CSS (opacity: 0.5, alpha=0.5) keeps its own form.
 * Returns the same object when nothing changes.
 */
function localizeNumberParams(params, locale) {
  if (!params || typeof params !== 'object' || Array.isArray(params) || !locale) return params;
  let out = params;
  for (const key of Object.keys(params)) {
    if (!/(?:ratio|threshold|Px)$/i.test(key)) continue;
    const v = formatLocaleDecimal(params[key], locale);
    if (v === params[key]) continue;
    if (out === params) out = { ...params };
    out[key] = v;
  }
  return out;
}

module.exports = { formatLocaleDecimal, localizeNumberParams };
