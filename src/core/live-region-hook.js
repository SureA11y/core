/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The live-region hook: an opt-in script that records what a page's live
 * regions are given while it runs, which a scan of the page at one moment
 * cannot see.
 *
 * Run in a page before the page's own scripts, it waits for the document to
 * load, notes the live regions there and the text each holds, and from then
 * on watches the document with a MutationObserver. For each batch of changes
 * (the changes one task made), it records:
 *
 * - each text a live region was given while shown and reachable by
 *   assistive technology: what the page made available to announce, read by
 *   getAnnouncements(). Not what a screen reader said, which depends on the
 *   screen reader, its settings and what else was being announced.
 * - a live region added to the page with its text already in it
 *   (LIVE_REGION_INSERTED_WITH_CONTENT): screen readers commonly announce
 *   changes to a region they already know, not the content of a new one, so
 *   this is often silent. role="alert" is left out: an alert added with its
 *   text is announced.
 * - a live region that was hidden (display: none, visibility: hidden,
 *   [hidden]) and was shown and given its text in the same task
 *   (LIVE_REGION_SHOWN_AND_FILLED): the region was not in the accessibility
 *   tree before the text arrived.
 *
 * The two findings are reported by live-region-announcements. A live region
 * is an element whose aria-live is polite or assertive, or, without an
 * aria-live, whose role is status, log or alert, or an <output>; aria-live
 * "off" turns any of them off. Content the page loads with, or adds before
 * the load event, is the page's starting state, not a change, so nothing is
 * recorded until the document has loaded.
 *
 * The page gets exactly what it would have: the hook wraps nothing, and only
 * observes. Its cost is one MutationObserver on the document, whose callback
 * looks at the live regions a batch touched, so a page that changes no live
 * region pays for the mutation records only. Each list keeps its first
 * MAX_ENTRIES entries and counts the rest.
 *
 * The registry it leaves is a frozen object on the global, under
 * Symbol.for('surea11y.liveRegions'), which no page markup or named access
 * can produce: { version: 1, early, announcements, findings, dropped, flush }.
 * Each announcement is { text, politeness, time, element }; each finding is
 * { code, text, time, element }; time is performance.now() in milliseconds.
 * `early` is whether it was installed before the document finished loading,
 * so that it saw every change since. `flush` hands the observer's pending
 * records to the hook, so a scan run in the same task as a change sees it.
 *
 * Nothing here runs unless an integrator injects the script: core never
 * installs it. Each frame is its own realm and needs its own copy.
 *
 * readLiveRegionHook is inlined into generated core.js (scripts/build-core.js)
 * and into the browser bundle, so it is self-contained.
 */

const MAX_ENTRIES = 500;
// The concrete WAI-ARIA roles: a role attribute's role is its first token
// that names one, as getExplicitRole reads it, so role="foo status" is a
// status. The engine's own list (aria-helpers.js), which a test keeps this
// equal to; copied, as aria-helpers.js is not published on its own.
const CONCRETE_ROLES = [
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'blockquote',
  'button',
  'caption',
  'cell',
  'checkbox',
  'code',
  'columnheader',
  'combobox',
  'comment',
  'complementary',
  'contentinfo',
  'definition',
  'deletion',
  'dialog',
  'directory',
  'doc-abstract',
  'doc-acknowledgments',
  'doc-afterword',
  'doc-appendix',
  'doc-backlink',
  'doc-biblioentry',
  'doc-bibliography',
  'doc-biblioref',
  'doc-chapter',
  'doc-colophon',
  'doc-conclusion',
  'doc-cover',
  'doc-credit',
  'doc-credits',
  'doc-dedication',
  'doc-endnote',
  'doc-endnotes',
  'doc-epigraph',
  'doc-epilogue',
  'doc-errata',
  'doc-example',
  'doc-footnote',
  'doc-foreword',
  'doc-glossary',
  'doc-glossref',
  'doc-index',
  'doc-introduction',
  'doc-noteref',
  'doc-notice',
  'doc-pagebreak',
  'doc-pagefooter',
  'doc-pageheader',
  'doc-pagelist',
  'doc-part',
  'doc-preface',
  'doc-prologue',
  'doc-pullquote',
  'doc-qna',
  'doc-subtitle',
  'doc-tip',
  'doc-toc',
  'document',
  'emphasis',
  'feed',
  'figure',
  'form',
  'generic',
  'graphics-document',
  'graphics-object',
  'graphics-symbol',
  'grid',
  'gridcell',
  'group',
  'heading',
  'image',
  'img',
  'insertion',
  'link',
  'list',
  'listbox',
  'listitem',
  'log',
  'main',
  'mark',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'meter',
  'navigation',
  'none',
  'note',
  'option',
  'paragraph',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'search',
  'searchbox',
  'sectionfooter',
  'sectionheader',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'strong',
  'subscript',
  'suggestion',
  'superscript',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'text',
  'textbox',
  'time',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem'
];
const MAX_TEXT = 300;

// The script, as text, so a bundler or a coverage tool never rewrites it.
// Plain ES2015, with no eval, so it runs under any Content Security Policy
// that lets the init script itself run.
const LIVE_REGION_HOOK_SOURCE = [
  '// The live-region hook for @surea11y/core (liveRegionHookScript): records',
  '// what live regions are given, so a scan can see what the page made',
  '// available to announce.',
  '(function (global) {',
  "  'use strict';",
  '  try {',
  "    var KEY = Symbol.for('surea11y.liveRegions');",
  '    if (!global || Object.prototype.hasOwnProperty.call(global, KEY)) return;',
  '    var doc = global.document;',
  '    var Observer = global.MutationObserver;',
  "    if (!doc || typeof Observer !== 'function') return;",
  `    var MAX = ${MAX_ENTRIES};`,
  `    var MAX_TEXT = ${MAX_TEXT};`,
  "    var SELECTOR = '[aria-live],[role],output';",
  "    var ROLES = { status: 'polite', log: 'polite', alert: 'assertive' };",
  `    var CONCRETE = new Set(${JSON.stringify(CONCRETE_ROLES)});`,
  '    var announcements = [];',
  '    var findings = [];',
  '    var dropped = { announcements: 0, findings: 0 };',
  // Each region seen: whether it was shown, and its text, when last looked at.
  '    var known = new WeakMap();',
  '    var regions = new Set();',
  '    var observer = null;',
  '    var perf = global.performance;',
  '    function now() {',
  "      return perf && typeof perf.now === 'function' ? Math.round(perf.now()) : 0;",
  '    }',
  '    function attr(el, name) {',
  '      var v = el.getAttribute ? el.getAttribute(name) : null;',
  "      return v == null ? '' : String(v).trim().toLowerCase();",
  '    }',
  // The politeness a live region has, or '' for none.
  // The role the role attribute gives, as getExplicitRole reads it.
  '    function roleOf(el) {',
  "      var tokens = attr(el, 'role').split(/\\s+/);",
  '      for (var i = 0; i < tokens.length; i++) if (CONCRETE.has(tokens[i])) return tokens[i];',
  "      return '';",
  '    }',
  '    function politeness(el) {',
  "      if (!el || el.nodeType !== 1) return '';",
  "      var live = attr(el, 'aria-live');",
  "      if (live === 'polite' || live === 'assertive') return live;",
  "      if (live === 'off') return '';",
  '      var role = roleOf(el);',
  '      if (role && Object.prototype.hasOwnProperty.call(ROLES, role)) return ROLES[role];',
  "      if (!role && String(el.localName).toLowerCase() === 'output') return 'polite';",
  "      return '';",
  '    }',
  '    function isAlert(el) {',
  "      return roleOf(el) === 'alert' && attr(el, 'aria-live') === '';",
  '    }',
  '    function parentOf(node) {',
  '      var p = node.parentNode;',
  '      if (p && p.nodeType === 11 && p.host) return p.host;',
  '      return p;',
  '    }',
  // The nearest live region at or above a node, or null: closest() to the
  // nearest element that could be one, through shadow roots to their hosts.
  '    function regionOf(node) {',
  '      var el = node.nodeType === 1 ? node : parentOf(node);',
  '      while (el) {',
  '        if (el.nodeType !== 1) {',
  '          el = el.nodeType === 11 && el.host ? el.host : null;',
  '          continue;',
  '        }',
  '        var near = el.closest(SELECTOR);',
  '        if (!near) {',
  '          var root = el.getRootNode();',
  '          el = root && root.nodeType === 11 && root.host ? root.host : null;',
  '          continue;',
  '        }',
  '        if (politeness(near)) return near;',
  '        el = parentOf(near);',
  '      }',
  '      return null;',
  '    }',
  '    function textOf(el) {',
  "      var t = String(el.textContent || '').replace(/\\s+/g, ' ').trim();",
  '      return t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) : t;',
  '    }',
  // Whether the region is drawn: no display: none or [hidden] on it or above
  // it, and not visibility: hidden. checkVisibility where the browser has it.
  '    function shown(el) {',
  '      if (!el.isConnected) return false;',
  "      if (typeof el.checkVisibility === 'function') {",
  '        return el.checkVisibility({ visibilityProperty: true });',
  '      }',
  '      var view = doc.defaultView;',
  '      for (var n = el; n && n.nodeType === 1; n = parentOf(n)) {',
  "        if (n.hasAttribute('hidden')) return false;",
  "        if (view && view.getComputedStyle(n).display === 'none') return false;",
  '      }',
  "      var v = view ? view.getComputedStyle(el).visibility : '';",
  "      return v !== 'hidden' && v !== 'collapse';",
  '    }',
  // Whether aria-hidden or inert keeps the region from assistive technology.
  '    function unreachable(el) {',
  '      for (var n = el; n && n.nodeType === 1; n = parentOf(n)) {',
  "        if (attr(n, 'aria-hidden') === 'true' || n.hasAttribute('inert')) return true;",
  '      }',
  '      return false;',
  '    }',
  '    function push(list, key, entry) {',
  '      if (list.length < MAX) list.push(entry);',
  '      else dropped[key]++;',
  '    }',
  '    function note(el) {',
  '      var state = { shown: shown(el), text: textOf(el) };',
  '      known.set(el, state);',
  '      regions.add(el);',
  '      return state;',
  '    }',
  // The live regions at or inside a node.
  '    function regionsIn(node, out) {',
  '      if (!node || node.nodeType !== 1) return;',
  '      if (politeness(node)) out.push(node);',
  '      if (!node.firstElementChild) return;',
  '      var found = node.querySelectorAll(SELECTOR);',
  '      for (var i = 0; i < found.length; i++) if (politeness(found[i])) out.push(found[i]);',
  '    }',
  '    function handle(records) {',
  // The regions the batch touched, in the order it touched them: 'added'
  // for one added in it, 'changed' for one whose text changed or that an
  // attribute change may have shown or hidden.
  '      var touched = new Map();',
  '      var regionByTarget = new Map();',
  '      var moved = [];',
  '      for (var i = 0; i < records.length; i++) {',
  '        var r = records[i];',
  "        if (r.type === 'childList') {",
  // Records of one batch often share a target (rows added to one list).
  '          var around = regionByTarget.has(r.target) ? regionByTarget.get(r.target) : regionOf(r.target);',
  '          regionByTarget.set(r.target, around);',
  "          if (around && !touched.has(around)) touched.set(around, 'changed');",
  '          for (var j = 0; j < r.addedNodes.length; j++) {',
  '            var inserted = [];',
  '            regionsIn(r.addedNodes[j], inserted);',
  "            for (var k = 0; k < inserted.length; k++) touched.set(inserted[k], 'added');",
  '          }',
  "        } else if (r.type === 'characterData') {",
  '          var at = regionOf(r.target);',
  "          if (at && !touched.has(at)) touched.set(at, 'changed');",
  '        } else {',
  // An element that has just become a live region is noted as it is now,
  // so its next change counts and the text it came with does not.
  '          var name = r.attributeName;',
  "          if ((name === 'aria-live' || name === 'role') && !known.has(r.target) && politeness(r.target)) {",
  '            note(r.target);',
  '          }',
  '          if (moved.indexOf(r.target) === -1) moved.push(r.target);',
  '        }',
  '      }',
  '      if (moved.length) {',
  '        regions.forEach(function (el) {',
  '          if (!el.isConnected) {',
  '            regions.delete(el);',
  '            return;',
  '          }',
  '          if (touched.has(el)) return;',
  '          for (var m = 0; m < moved.length; m++) {',
  '            if (moved[m] === el || (moved[m].contains && moved[m].contains(el))) {',
  "              touched.set(el, 'changed');",
  '              break;',
  '            }',
  '          }',
  '        });',
  '      }',
  // Regions that have left the page are let go, so a toast added and removed
  // again and again is not kept.
  '      if (regions.size > 100) {',
  '        regions.forEach(function (el) {',
  '          if (!el.isConnected) regions.delete(el);',
  '        });',
  '      }',
  '      touched.forEach(function (kind, el) {',
  '        if (!politeness(el)) return;',
  '        var before = known.get(el);',
  '        var state = note(el);',
  '        if (!state.text || !state.shown || unreachable(el)) return;',
  // A region added with its text: asked about unless it is an alert. Its
  // text is not counted as announced, as screen readers commonly skip it.
  "        if (kind === 'added' && el.isConnected) {",
  "          if (isAlert(el)) push(announcements, 'announcements', { text: state.text, politeness: 'assertive', time: now(), element: el });",
  "          else push(findings, 'findings', { code: 'LIVE_REGION_INSERTED_WITH_CONTENT', text: state.text, time: now(), element: el });",
  '          return;',
  '        }',
  '        if (!before || state.text === before.text) return;',
  '        if (!before.shown) {',
  "          push(findings, 'findings', { code: 'LIVE_REGION_SHOWN_AND_FILLED', text: state.text, time: now(), element: el });",
  '          return;',
  '        }',
  "        push(announcements, 'announcements', { text: state.text, politeness: politeness(el), time: now(), element: el });",
  '      });',
  '    }',
  '    function start() {',
  '      if (observer) return;',
  '      var found = [];',
  '      regionsIn(doc.documentElement, found);',
  '      for (var i = 0; i < found.length; i++) note(found[i]);',
  '      observer = new Observer(function (records) {',
  '        try {',
  '          handle(records);',
  '        } catch (e) {}',
  '      });',
  '      observer.observe(doc, {',
  '        subtree: true,',
  '        childList: true,',
  '        characterData: true,',
  '        attributes: true,',
  "        attributeFilter: ['hidden', 'style', 'class', 'aria-hidden', 'inert', 'aria-live', 'role']",
  '      });',
  '    }',
  '    function flush() {',
  '      if (!observer) return;',
  '      try {',
  '        var pending = observer.takeRecords();',
  '        if (pending.length) handle(pending);',
  '      } catch (e) {}',
  '    }',
  '    var early = false;',
  '    try {',
  "      early = doc.readyState !== 'complete';",
  '    } catch (e) {}',
  "    if (doc.readyState === 'complete') start();",
  "    else global.addEventListener('load', start, { once: true });",
  '    Object.defineProperty(global, KEY, {',
  '      value: Object.freeze({',
  '        version: 1,',
  '        early: early,',
  '        announcements: announcements,',
  '        findings: findings,',
  '        dropped: dropped,',
  '        flush: flush',
  '      })',
  '    });',
  '  } catch (e) {}',
  "})(typeof globalThis !== 'undefined' ? globalThis : this);",
  ''
].join('\n');

const EARLY_LINE = "      early = doc.readyState !== 'complete';";
const LIVE_REGION_HOOK_SOURCE_EARLY = LIVE_REGION_HOOK_SOURCE.replace(
  EARLY_LINE,
  '      early = true;'
);

// The hook's script, to run in every frame of a page before the page's own
// scripts. `early: true` is a promise the caller makes: that no change the
// test cares about has happened yet, for a hook installed after the document
// loaded (a jsdom test's setup file). Only the first copy installed in a
// realm counts.
const checked = new Set();
function liveRegionHookScript(options) {
  if (options !== undefined) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('liveRegionHookScript(options): options must be an object.');
    }
    const unknown = Object.keys(options).filter((k) => k !== 'early');
    if (unknown.length) {
      throw new TypeError(
        `liveRegionHookScript(options): no option named ${unknown.map((k) => `"${k}"`).join(', ')}; use early.`
      );
    }
    if (options.early !== undefined && typeof options.early !== 'boolean') {
      throw new TypeError('liveRegionHookScript(options): early must be true or false.');
    }
  }
  const source =
    options && options.early === true ? LIVE_REGION_HOOK_SOURCE_EARLY : LIVE_REGION_HOOK_SOURCE;
  if (!checked.has(source)) {
    const nodeRequire =
      typeof module === 'object' && module && typeof module.require === 'function'
        ? (id) => module.require(id)
        : null;
    if (nodeRequire) {
      try {
        new (nodeRequire('node:vm').Script)(source);
      } catch (e) {
        throw new Error(
          `liveRegionHookScript wrote a script that does not parse: ${e && e.message}`,
          { cause: e }
        );
      }
    }
    checked.add(source);
  }
  return source;
}

// The registry the hook left in a window, as { early, announcements,
// findings, dropped }, copies of its lists, or null when there is none or it
// isn't shaped as the hook makes it: a page can define that symbol itself.
// Read through property descriptors, so no getter on it runs. The hook's own
// flush runs first, so changes made in the current task are in the lists.
function readLiveRegionHook(win) {
  try {
    if (!win || (typeof win !== 'object' && typeof win !== 'function')) return null;
    const own = (o, key) => {
      const d = o && Object.getOwnPropertyDescriptor(o, key);
      return d && 'value' in d ? d.value : undefined;
    };
    const registry = own(win, Symbol.for('surea11y.liveRegions'));
    if (!registry || typeof registry !== 'object' || own(registry, 'version') !== 1) return null;
    if (!Object.isFrozen(registry)) return null;
    const flush = own(registry, 'flush');
    if (typeof flush === 'function') {
      try {
        Reflect.apply(flush, undefined, []);
      } catch {
        // The lists as they are.
      }
    }
    const copy = (list, fields) => {
      const out = [];
      if (!Array.isArray(list)) return out;
      const n = own(list, 'length');
      for (let i = 0; i < n; i++) {
        const entry = own(list, i);
        if (!entry || typeof entry !== 'object') continue;
        const item = {};
        for (const f of fields) item[f] = own(entry, f);
        if (typeof item.text !== 'string') continue;
        out.push(item);
      }
      return out;
    };
    const dropped = own(registry, 'dropped');
    const count = (key) => {
      const v = dropped && typeof dropped === 'object' ? own(dropped, key) : 0;
      return typeof v === 'number' && v > 0 ? v : 0;
    };
    return {
      early: own(registry, 'early') === true,
      announcements: copy(own(registry, 'announcements'), [
        'text',
        'politeness',
        'time',
        'element'
      ]),
      findings: copy(own(registry, 'findings'), ['code', 'text', 'time', 'element']),
      dropped: { announcements: count('announcements'), findings: count('findings') }
    };
  } catch {
    return null;
  }
}

module.exports = {
  CONCRETE_ROLES,
  LIVE_REGION_HOOK_SOURCE,
  MAX_ENTRIES,
  liveRegionHookScript,
  readLiveRegionHook
};
