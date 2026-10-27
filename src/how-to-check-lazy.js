/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The steps for undecided findings, for a reporter that may also be bundled
 * for a browser (src/report.js is, as surea11y.report.js). They are read
 * from core's review dictionaries on disk (src/how-to-check.js), so, as
 * src/index.js does, the module is loaded through Node's own require, which a
 * bundler doesn't follow: in a browser, the result is given back as it is,
 * with the steps it already carries, and the bundle grows by no dictionary.
 * `packs`, the packs the scan ran, adds their rules' own steps (src/pack.js,
 * meta.review).
 */

let howToCheckModule;
function withHowToCheck(result, packs) {
  if (howToCheckModule === undefined) {
    howToCheckModule = null;
    try {
      if (typeof module === 'object' && module && typeof module.require === 'function') {
        const id = './how-to-check.js';
        howToCheckModule = module.require(id);
      }
    } catch {
      howToCheckModule = null;
    }
  }
  return howToCheckModule
    ? howToCheckModule.addHowToCheck(result, Array.isArray(packs) ? { packs } : undefined)
    : result;
}

module.exports = { withHowToCheck };
