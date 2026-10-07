/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * What the reporters (/report, /sarif, /junit, /earl, /baseline) accept as a
 * scan result. Each of them reads checksResults and treats a missing one as
 * empty, so a value of another shape, such as the { topFrame, frames } tree
 * runa11yCoreAcrossFrames returns, an array of results or a string, rendered
 * as a clean scan with nothing found: a CI gate passed on a page full of
 * violations. So did a missing result, as when a scan that broke returned
 * undefined. A reporter now takes only an object with a checksResults
 * array; other fields (url, engine, rulesResults) may be missing, and
 * render as unknown.
 */

function isCrossFrameResult(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !Array.isArray(value.checksResults) &&
    !!value.topFrame &&
    typeof value.topFrame === 'object' &&
    Array.isArray(value.frames)
  );
}

function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  if (typeof value !== 'object')
    return typeof value === 'undefined' ? 'undefined' : 'a ' + typeof value;
  return 'an object without a checksResults array';
}

// Throws a TypeError naming the caller unless `value` is one scan result.
function assertScanResult(value, caller) {
  if (isCrossFrameResult(value)) {
    throw new TypeError(
      caller +
        ' takes one scan result, and got a cross-frame result ({ topFrame, frames }). ' +
        'Pass result.topFrame, and each entry of result.frames (its topFrame, then its own frames) in a call of its own.'
    );
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !Array.isArray(value.checksResults)
  ) {
    throw new TypeError(
      caller +
        ' takes one scan result (an object with a checksResults array), and got ' +
        describe(value) +
        '.'
    );
  }
  return value;
}

// Every scan result in a cross-frame result, depth first from the top
// frame. A frame that did not answer has no result and is left out.
function flattenCrossFrameResult(value) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.topFrame && typeof node.topFrame === 'object') out.push(node.topFrame);
    for (const frame of Array.isArray(node.frames) ? node.frames : []) walk(frame);
  };
  walk(value);
  return out;
}

// The message of a rule that did not complete: it threw, or returned
// nothing usable. The engine reports one as cantTell with no occurrences and
// its error (docs/OUTPUT_SCHEMA.md); every other cantTell names what it
// could not decide, and a fail always names what failed. Null otherwise.
function ruleErrorOf(check) {
  if (!check || check.outcome !== 'cantTell') return null;
  if (Array.isArray(check.occurrences) && check.occurrences.length) return null;
  return typeof check.error === 'string' && check.error.trim() ? check.error.trim() : null;
}

// A rule's help link, for a reporter to show: its meta.helpUrl when that is
// an absolute http(s) URL, else null, so no other scheme (javascript:, a
// relative path that would resolve against the report) is ever linked.
function helpUrlOf(check) {
  const url =
    check && check.meta && typeof check.meta.helpUrl === 'string' ? check.meta.helpUrl.trim() : '';
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : null;
}

module.exports = {
  assertScanResult,
  isCrossFrameResult,
  flattenCrossFrameResult,
  ruleErrorOf,
  helpUrlOf
};
