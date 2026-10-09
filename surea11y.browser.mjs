// SPDX-License-Identifier: MPL-2.0
// @surea11y/core/browser for an ES module import: the browser bundle, with the
// names its types declare as named exports. The bundle assigns module.exports
// whole, which Node can't read names from. require() gets the bundle itself.
import a11ycore from './surea11y.browser.js';

export const {
  ENGINE_TAG,
  SCHEMA_VERSION,
  registerMessages,
  waitForPageReady,
  getMargins,
  runa11yCoreInPage
} = a11ycore;
export default a11ycore;
