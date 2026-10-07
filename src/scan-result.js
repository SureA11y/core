/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { wcagLinks } = require('./coverage/wcag-criteria.js');

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

// Every frame of a cross-frame result, the top frame first, then depth
// first: { frame, result }, or { frame, error } for a frame that did not
// answer. `frame` says which one it is: `path`, the selectors of the
// <iframe>/<frame> elements leading to it from the top document ([] for
// the top frame), its `title` and its `url`. A plain scan result is one
// frame.
function flattenCrossFrameResult(value) {
  if (!isCrossFrameResult(value)) {
    return value && typeof value === 'object' && Array.isArray(value.checksResults)
      ? [{ frame: { path: [], title: null, url: value.url || null }, result: value }]
      : [];
  }
  const out = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    const frame = {
      path,
      title: typeof node.title === 'string' ? node.title : null,
      url:
        typeof node.url === 'string'
          ? node.url
          : node.topFrame && typeof node.topFrame.url === 'string'
            ? node.topFrame.url
            : null
    };
    if (node.topFrame && typeof node.topFrame === 'object')
      out.push({ frame, result: node.topFrame });
    else out.push({ frame, error: typeof node.error === 'string' ? node.error : 'not scanned' });
    for (const child of Array.isArray(node.frames) ? node.frames : []) {
      const step =
        child && typeof child.selector === 'string' && child.selector ? child.selector : 'iframe';
      walk(child, path.concat(step));
    }
  };
  walk(value, []);
  return out;
}

// What a reporter that takes frames reads: every frame of one scan result
// or of a cross-frame result. Throws a TypeError naming the caller for
// anything else, as assertScanResult does.
function framesOf(value, caller) {
  if (isCrossFrameResult(value)) return flattenCrossFrameResult(value);
  return flattenCrossFrameResult(assertScanResult(value, caller));
}

// A frame's path as one line, for a reader: "#ads > iframe → iframe".
function framePathText(path) {
  return Array.isArray(path) ? path.join(' \u2192 ') : '';
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

// A rule's help link, for a reporter to show: its own meta.helpUrl, or
// else the Understanding document of the first WCAG criterion it maps to,
// which explains the criterion and the techniques that meet it. Only an
// absolute http(s) URL is ever given, so no other scheme (javascript:, a
// relative path that would resolve against the report) is linked. Null
// when there is none: { url, kind: 'rule' } or { url, kind:
// 'understanding', sc, title }.
function helpLinkOf(check) {
  const meta = check && check.meta;
  const own = meta && typeof meta.helpUrl === 'string' ? meta.helpUrl.trim() : '';
  if (/^https?:\/\/[^\s]+$/i.test(own)) return { url: own, kind: 'rule' };
  const mappings = (meta && Array.isArray(meta.normativeMappings) && meta.normativeMappings) || [];
  for (const m of mappings) {
    if (!m || m.type || (m.standard != null && m.standard !== 'WCAG') || !m.requirement) continue;
    const given = typeof m.understandingUrl === 'string' ? m.understandingUrl.trim() : '';
    const links = wcagLinks(m.requirement, m.version || '2.2');
    const url = /^https?:\/\/[^\s]+$/i.test(given) ? given : links && links.understandingUrl;
    if (url) {
      return { url, kind: 'understanding', sc: String(m.requirement), title: m.title || '' };
    }
  }
  return null;
}

function helpUrlOf(check) {
  const link = helpLinkOf(check);
  return link ? link.url : null;
}

module.exports = {
  assertScanResult,
  isCrossFrameResult,
  flattenCrossFrameResult,
  framesOf,
  framePathText,
  ruleErrorOf,
  helpLinkOf,
  helpUrlOf
};
