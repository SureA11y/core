/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// surea11y public API: the generated core surface verbatim, plus the one
// helper for reading a cross-frame result that the reporters share.
const { flattenCrossFrameResult } = require('./scan-result');

module.exports = { ...require('./core'), flattenCrossFrameResult };
