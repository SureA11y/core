/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { wcagLinks } = require('./coverage/wcag-criteria.js');
const { NORMATIVE_STANDARDS } = require('./coverage/standards.js');

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

// A result scanned with output.detail: 'findings' keeps only the rule,
// outcome and type of a pass or notApplicable (engine.outputDetail). Their
// title, description and meta are the catalog's, the same on every page:
// for a reporter they are read back from it, for the result's locale,
// mappings and profile, so a compact result reports as a full one would.
// The engine keeps whole what that can't fill in (a scan with packs, a
// custom rule, a rule the caller's messages reword); a rule the catalog
// doesn't have, in a result made before it did, is named by its id. Any
// other result is returned as it is.
function expandCompactResult(result) {
  if (!result || !result.engine || result.engine.outputDetail !== 'findings') return result;
  // Required here, not at the top: the package's entry requires this file.
  const { getCheckDefById } = require('./index.js');
  const options = {
    locale: result.engine.locale && result.engine.locale.resolved,
    mappings: result.engine.mappings || [],
    ...(result.engine.profile ? { profile: result.engine.profile } : {})
  };
  const checksResults = result.checksResults.map((c) => {
    if (!c || c.meta) return c;
    const def = getCheckDefById(c.ruleId, options);
    const base = { occurrences: [], ...c };
    if (!def) return { ...base, title: c.ruleId, meta: { ruleId: c.ruleId } };
    return {
      ...base,
      title: def.title,
      description: def.description,
      i18n: def.i18n,
      meta: {
        ruleId: def.ruleId,
        helpUrl: def.helpUrl,
        tags: def.tags,
        normativeMappings: def.normativeMappings,
        standard: def.standard,
        category: def.category
      }
    };
  });
  return { ...result, checksResults };
}

// What a reporter that takes frames reads: every frame of one scan result
// or of a cross-frame result, a compact one read back in full. Throws a
// TypeError naming the caller for anything else, as assertScanResult does.
function framesOf(value, caller) {
  const frames = isCrossFrameResult(value)
    ? flattenCrossFrameResult(value)
    : flattenCrossFrameResult(assertScanResult(value, caller));
  return frames.map((f) => (f.result ? { ...f, result: expandCompactResult(f.result) } : f));
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

// The standards a result names besides WCAG, as a reporter shows them, in
// registry order: [{ key, standard, titleLang?, note? }]. A result carries
// them (result.standards), so it renders without the registry that produced
// it. A result made before it did, or naming none, is read against the
// built-in registry, with each note translated by `tr(key)` when given.
function standardsOf(result, tr) {
  return standardsInfoOf(result, tr).standards;
}

// standardsOf, and whether the result's own list could not be relied on:
// { standards, unreadable }. A standard a rollup's meta.standard or a
// built-in or pack rule's mappings name that the list lacks (it is missing,
// damaged, or names the standard otherwise) is added after it under its own
// name, keyed by that name, so its entries are never taken for WCAG ones or
// dropped. A standard only a custom rule names is no registered one, and is
// left out as before.
function standardsInfoOf(result, tr) {
  const given = result ? result.standards : undefined;
  const usable = (s) =>
    s && typeof s.key === 'string' && typeof s.standard === 'string' && s.standard !== 'WCAG';
  let listed;
  let unreadable;
  if (Array.isArray(given)) {
    // A standard listed twice is shown once.
    const seenNames = new Set();
    listed = given.filter(usable).filter((s) => {
      if (seenNames.has(s.standard)) return false;
      seenNames.add(s.standard);
      return true;
    });
    unreadable = !given.length || given.filter(usable).length !== given.length;
  } else {
    unreadable = given !== undefined;
    listed = NORMATIVE_STANDARDS.map((s) => {
      const report = s.report || {};
      const note = report.noteKey && tr ? tr(report.noteKey) : '';
      return {
        key: s.key,
        standard: s.standard,
        ...(report.titleLang ? { titleLang: report.titleLang } : {}),
        ...(note ? { note } : {})
      };
    });
  }
  const names = new Set(listed.map((s) => s.standard));
  const keys = new Set(listed.map((s) => s.key).concat('wcag'));
  const added = [];
  const add = (name) => {
    if (typeof name !== 'string' || !name || name === 'WCAG' || names.has(name)) return;
    names.add(name);
    const base = keyOfName(name);
    let key = base;
    for (let n = 2; keys.has(key); n++) key = `${base}-${n}`;
    keys.add(key);
    added.push({ key, standard: name });
  };
  const checks = Array.isArray(result && result.checksResults) ? result.checksResults : [];
  const rollups = Array.isArray(result && result.rulesResults) ? result.rulesResults : [];
  // The custom rules, by the ids each result's options echo.
  const custom = new Set();
  for (const r of checks.concat(rollups)) {
    const list = r && r.engineOptions && r.engineOptions.customRules;
    for (const c of Array.isArray(list) ? list : []) if (c && c.id) custom.add(String(c.id).trim());
  }
  const isRollup = new Set(rollups);
  for (const r of checks.concat(rollups)) {
    const meta = r && r.meta;
    if (!meta || typeof meta !== 'object' || custom.has(r.ruleId)) continue;
    if (isRollup.has(r)) add(meta.standard);
    for (const m of Array.isArray(meta.normativeMappings) ? meta.normativeMappings : []) {
      if (m && typeof m === 'object' && m.requirement) add(m.standard);
    }
  }
  return { standards: listed.concat(added), unreadable: unreadable || added.length > 0 };
}

// A key for a standard known only by its name: "Sample Standard" is
// "sample-standard".
function keyOfName(name) {
  let key = '';
  for (const ch of name.toLowerCase()) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) key += ch;
    else if (key && !key.endsWith('-')) key += '-';
  }
  if (key.endsWith('-')) key = key.slice(0, -1);
  return key || 'standard';
}

// The standard among `standards` (standardsOf) an entry belongs to, or null:
// WCAG itself, or a standard the result does not list, such as one only a
// custom rule declares.
function standardOfEntryIn(standards, m) {
  if (!m || typeof m !== 'object' || !m.requirement) return null;
  return standards.find((s) => s.standard === m.standard) || null;
}

module.exports = {
  assertScanResult,
  isCrossFrameResult,
  flattenCrossFrameResult,
  expandCompactResult,
  framesOf,
  framePathText,
  ruleErrorOf,
  helpLinkOf,
  helpUrlOf,
  standardsOf,
  standardsInfoOf,
  standardOfEntryIn
};
