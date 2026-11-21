/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The known key a typo most likely meant, or null: two edits away at most,
 * one for a key of four letters or fewer, so short unrelated keys aren't
 * matched. Shared by checkEngineOptions and the browser console's run(),
 * which leaves the warning about a near typo to the scan. Self-contained:
 * the browser bundle passes its source to the console helpers.
 */
function closestOptionKey(key, known) {
  // Optimal string alignment distance, case ignored: "lcoale" is one from
  // "locale", "includeShadowDOM" none from "includeShadowDom".
  function distance(a, b) {
    const s = a.toLowerCase();
    const t = b.toLowerCase();
    const d = [];
    for (let i = 0; i <= s.length; i++) d.push([i]);
    for (let j = 1; j <= t.length; j++) d[0][j] = j;
    for (let i = 1; i <= s.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[s.length][t.length];
  }
  let best = null;
  let bestD = Infinity;
  for (const k of known) {
    const dk = distance(key, k);
    if (dk < bestD) {
      best = k;
      bestD = dk;
    }
  }
  const limit = Math.min(key.length, best ? best.length : 0) <= 4 ? 1 : 2;
  return best !== null && bestD <= limit ? best : null;
}

module.exports = { closestOptionKey };
