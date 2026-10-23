/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The browser bundle's helpers for a scan run by hand, from the browser's
 * console: run(), table(), highlight(), inspect(), clearHighlights() and
 * openReport().
 * scripts/build-browser.js inlines this function's source into the bundle,
 * so it reads nothing outside its own body.
 *
 * @param {object} global The page's window.
 * @param {object} api The bundle's own object, for its scan functions.
 * @param {string|null} scriptSrc Where the bundle was loaded from, for
 *   finding surea11y.report.js beside it.
 */
function consoleHelpers(global, api, scriptSrc) {
  // Reads DOM properties through the prototypes, so a page's named form
  // controls and images can't redirect them (#90): the same lookup as
  // src/core/safe-dom.js, repeated because this function travels alone.
  // Writes go to elements this function creates, as the engine's do.
  var dom = (function () {
    function lookup(obj, name) {
      for (var p = Object.getPrototypeOf(obj); p; p = Object.getPrototypeOf(p)) {
        var d = Object.getOwnPropertyDescriptor(p, name);
        if (d && (typeof d.get === 'function' || typeof d.value === 'function')) return d;
      }
      return null;
    }
    function read(name) {
      return function (obj) {
        var d = lookup(obj, name);
        return d && d.get ? Reflect.apply(d.get, obj, []) : obj[name];
      };
    }
    function call(name) {
      return function (obj) {
        var d = lookup(obj, name);
        var fn = d && typeof d.value === 'function' ? d.value : obj[name];
        return Reflect.apply(fn, obj, Array.prototype.slice.call(arguments, 1));
      };
    }
    return {
      documentElement: read('documentElement'),
      shadowRoot: read('shadowRoot'),
      head: read('head'),
      querySelector: call('querySelector'),
      querySelectorAll: call('querySelectorAll'),
      createElement: call('createElement'),
      setAttribute: call('setAttribute'),
      attachShadow: call('attachShadow'),
      appendChild: call('appendChild'),
      remove: call('remove'),
      getBoundingClientRect: call('getBoundingClientRect')
    };
  })();
  var OUTCOME_RANK = { fail: 0, cantTell: 1, pass: 2, notApplicable: 3 };
  var SEVERITY_RANK = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  var HIGHLIGHT_ATTR = 'data-surea11y-highlights';
  var INSPECT_RULE = 'surea11y-inspect';
  var INSPECT_KINDS = ['headings', 'landmarks', 'names', 'focus-order'];
  var REPORT_FILE = 'surea11y.report.js';
  // The selection's own keys; tags, includeMode and profile are engine
  // options too.
  var RUN_ONLY_KEYS = [
    'wcag',
    'bestPractices',
    'excludeTags',
    'includeRuleIds',
    'excludeRuleIds',
    'includeTestIds',
    'excludeTestIds'
  ];

  function rank(table, value) {
    return Object.prototype.hasOwnProperty.call(table, value) ? table[value] : 9;
  }
  function checksOf(result) {
    return result && Array.isArray(result.checksResults) ? result.checksResults : [];
  }
  function documentOf() {
    return global && global.document ? global.document : null;
  }

  // One row per occurrence of a fail or cantTell rule, worst first: fail
  // before cantTell, then by severity, then by rule. With { all: true }, a
  // row for each rule that passed or did not apply follows.
  function table(result, options) {
    var all = !!(options && options.all);
    var rows = [];
    var checks = checksOf(result);
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      if (!c) continue;
      var occurrences = Array.isArray(c.occurrences) ? c.occurrences : [];
      if (c.outcome === 'fail' || c.outcome === 'cantTell') {
        for (var j = 0; j < occurrences.length; j++) {
          var o = occurrences[j] || {};
          rows.push({
            outcome: o.occurrenceOutcome || c.outcome,
            severity: c.severity || '',
            rule: c.ruleId,
            element: o.selector || '',
            summary: o.summary || ''
          });
        }
        if (!occurrences.length) {
          rows.push({
            outcome: c.outcome,
            severity: c.severity || '',
            rule: c.ruleId,
            element: '',
            summary: ''
          });
        }
      } else if (all) {
        rows.push({ outcome: c.outcome, severity: '', rule: c.ruleId, element: '', summary: '' });
      }
    }
    rows.sort(function (a, b) {
      return (
        rank(OUTCOME_RANK, a.outcome) - rank(OUTCOME_RANK, b.outcome) ||
        rank(SEVERITY_RANK, a.severity) - rank(SEVERITY_RANK, b.severity) ||
        (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0)
      );
    });
    if (global && global.console && typeof global.console.table === 'function') {
      global.console.table(rows);
    }
    return rows;
  }

  // The element an occurrence names, through the shadow hosts that lead to
  // it; null when it is gone or its selector no longer matches.
  function locate(doc, o) {
    try {
      var root = doc;
      var hosts = Array.isArray(o.shadowHostSelectors) ? o.shadowHostSelectors : [];
      for (var i = 0; i < hosts.length; i++) {
        var host = dom.querySelector(root, hosts[i]);
        root = host ? dom.shadowRoot(host) : null;
        if (!root) return null;
      }
      return o.selector ? dom.querySelector(root, o.selector) : null;
    } catch {
      return null;
    }
  }

  // The layer highlight() and inspect() draw in: one element added to the
  // page, holding a shadow root, hidden from assistive technology and inert.
  // Each mark is a box over an element with a label above it; `kind` picks
  // its colour. The labels' white text is above 7:1 on each colour, so a
  // scan run with them on the page finds nothing in them to report. Returns
  // how many marks it drew; an element with no box (display: none) is
  // skipped.
  function drawMarks(doc, marks) {
    var host = dom.createElement(doc, 'div');
    dom.setAttribute(host, HIGHLIGHT_ATTR, '');
    dom.setAttribute(host, 'aria-hidden', 'true');
    host.inert = true;
    host.style.cssText =
      'position:absolute;top:0;left:0;width:0;height:0;margin:0;padding:0;border:0;' +
      'z-index:2147483647;pointer-events:none;';
    var root = dom.attachShadow(host, { mode: 'open' });
    var style = dom.createElement(doc, 'style');
    style.textContent =
      '.box{position:absolute;box-sizing:border-box;border:3px solid #a30000}' +
      '.box.ask{border-style:dashed;border-color:#704400}' +
      '.box.info{border-width:2px;border-color:#1a4f8b}' +
      '.tag{position:absolute;bottom:100%;left:-3px;padding:0 4px;' +
      'font:12px/1.5 system-ui,sans-serif;white-space:nowrap;color:#fff;background:#a30000}' +
      '.ask .tag{background:#704400}' +
      '.info .tag{background:#1a4f8b}';
    dom.appendChild(root, style);

    var sx = global.scrollX || 0;
    var sy = global.scrollY || 0;
    var count = 0;
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var r = dom.getBoundingClientRect(m.element);
      if (!r || (r.width === 0 && r.height === 0)) continue;
      var box = dom.createElement(doc, 'div');
      box.className = m.kind === 'fail' ? 'box' : 'box ' + m.kind;
      box.style.left = r.left + sx + 'px';
      box.style.top = r.top + sy + 'px';
      box.style.width = r.width + 'px';
      box.style.height = r.height + 'px';
      var tag = dom.createElement(doc, 'span');
      tag.className = 'tag';
      tag.textContent = m.label;
      dom.appendChild(box, tag);
      dom.appendChild(root, box);
      count += 1;
    }
    dom.appendChild(dom.documentElement(doc), host);
    return count;
  }

  function clearHighlights() {
    var doc = documentOf();
    if (!doc) return;
    var hosts = dom.querySelectorAll(doc, '[' + HIGHLIGHT_ATTR + ']');
    for (var i = 0; i < hosts.length; i++) dom.remove(hosts[i]);
  }

  // Draws a box over each element a fail or cantTell occurrence names (see
  // drawMarks): red for a failure and amber, dashed, for a question,
  // labelled with the rules that reported the element. The page's own
  // elements are never changed. Returns how many elements it marked.
  function highlight(result) {
    clearHighlights();
    var doc = documentOf();
    if (!doc || !dom.documentElement(doc)) return 0;

    var byElement = new Map();
    var checks = checksOf(result);
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      if (!c || (c.outcome !== 'fail' && c.outcome !== 'cantTell')) continue;
      var occurrences = Array.isArray(c.occurrences) ? c.occurrences : [];
      for (var j = 0; j < occurrences.length; j++) {
        var o = occurrences[j] || {};
        var el = locate(doc, o);
        if (!el) continue;
        var entry = byElement.get(el) || { fail: false, rules: [] };
        if ((o.occurrenceOutcome || c.outcome) === 'fail') entry.fail = true;
        if (entry.rules.indexOf(c.ruleId) === -1) entry.rules.push(c.ruleId);
        byElement.set(el, entry);
      }
    }
    var marks = [];
    byElement.forEach(function (entry, el) {
      marks.push({ element: el, kind: entry.fail ? 'fail' : 'ask', label: entry.rules.join(', ') });
    });
    return drawMarks(doc, marks);
  }

  // What inspect() lists, worked out by the engine's own helpers in a rule
  // of its own, so the roles, names and levels are the ones the rules judge.
  // Elements hidden from everyone are left out, as the rules leave them.
  // Each element is one occurrence whose details hold what is listed.
  function inspectRule(kind) {
    return {
      id: INSPECT_RULE,
      meta: { title: 'Inspect the page', defaultSeverity: 'minor' },
      runInPage: function (ctx) {
        var h = ctx.helpers;
        // The engine's safe DOM reads, in place of the helpers' own above.
        var dom = h.dom;
        var occurrences = [];
        // Roles whose name comes from their content (accname), named as the
        // rules name them; the rest from ARIA, a label, alt or title.
        var FROM_CONTENT =
          /^(button|link|checkbox|radio|switch|tab|treeitem|option|menuitem|menuitemcheckbox|menuitemradio|heading|gridcell|cell|columnheader|rowheader|tooltip)$/;
        // An input button with no other name takes its value, else the
        // label browsers show on a submit or reset button (HTML-AAM), as
        // button-name-present reads it.
        var INPUT_BUTTON_LABEL = { button: '', submit: 'Submit', reset: 'Reset' };
        function clean(text) {
          return String(text).replace(/\s+/g, ' ').trim();
        }
        function nameOf(el, role) {
          var info = FROM_CONTENT.test(role)
            ? h.getNameFromContentInfo(el, ctx)
            : h.getAccessibleNameInfo(el, ctx);
          var name = info && info.present && info.value ? clean(info.value) : '';
          if (name || role !== 'button' || dom.localName(el) !== 'input') return name;
          var type = clean(dom.getAttribute(el, 'type') || '').toLowerCase();
          if (!Object.prototype.hasOwnProperty.call(INPUT_BUTTON_LABEL, type)) return '';
          return clean(dom.getAttribute(el, 'value') || '') || INPUT_BUTTON_LABEL[type];
        }
        // The role as the attribute or internals give it, else the element's
        // own (h1 is a heading, a <td> a cell or, in a grid, a gridcell); a
        // presentational role browsers honour gives none.
        function nativeRoleOf(el) {
          if (dom.localName(el) === 'td') return h.aria.getTableCellRole(el);
          return h.aria.getNativeRoleForElement(el) || '';
        }
        function roleOf(el) {
          var info = h.getRoleInfo(el, ctx);
          if (info && info.flags.indexOf('presentation') !== -1) {
            return h.isPresentationalRoleIgnored(el) ? nativeRoleOf(el) : '';
          }
          return (info && info.role) || nativeRoleOf(el);
        }
        function add(el, details) {
          occurrences.push(h.reportOccurrence(el, { summary: kind, data: { details: details } }));
        }
        var els, i, el;
        if (kind === 'headings') {
          els = h.queryAllSmart('h1, h2, h3, h4, h5, h6, [role]');
          for (i = 0; i < els.length; i++) {
            el = els[i];
            if (roleOf(el) !== 'heading' || !h.isIncludedInAccessibilityTree(el)) continue;
            var level = h.parseHtmlInteger(dom.getAttribute(el, 'aria-level') || '');
            if (!(level > 0)) {
              var tag = /^h([1-6])$/i.exec(dom.localName(el) || '');
              level = tag ? Number(tag[1]) : 2;
            }
            add(el, { level: level, name: nameOf(el, 'heading') });
          }
        } else if (kind === 'landmarks') {
          els = h.queryAllSmart(h.landmarkCandidateSelector);
          for (i = 0; i < els.length; i++) {
            el = els[i];
            var landmark = h.getLandmarkRole(el, ctx);
            if (!landmark || !h.isIncludedInAccessibilityTree(el)) continue;
            var label = h.getLandmarkNameInfo(el, ctx);
            add(el, {
              role: landmark,
              name: label && label.value ? String(label.value).trim() : ''
            });
          }
        } else {
          var WIDGETS =
            /^(button|link|checkbox|radio|switch|textbox|searchbox|combobox|listbox|option|menuitem|menuitemcheckbox|menuitemradio|slider|spinbutton|tab|treeitem|gridcell|scrollbar)$/;
          els = h.queryAllSmart(
            'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable], [role]'
          );
          var entries = [];
          for (i = 0; i < els.length; i++) {
            el = els[i];
            if (!h.isIncludedInAccessibilityTree(el)) continue;
            var role = roleOf(el);
            var focus = h.getFocusableInfo(el, ctx);
            var tabbable = !!(focus && focus.tabbable);
            if (kind === 'focus-order' ? !tabbable : !(WIDGETS.test(role) || tabbable)) continue;
            var tabindex = h.parseHtmlInteger(dom.getAttribute(el, 'tabindex') || '');
            entries.push({
              el: el,
              index: i,
              tabindex: tabindex > 0 ? tabindex : 0,
              role: role || String(dom.localName(el) || '').toLowerCase(),
              name: nameOf(el, role)
            });
          }
          // Sequential focus order: positive tabindex values first, lowest
          // first, then the rest in document order.
          if (kind === 'focus-order') {
            entries.sort(function (a, b) {
              if (a.tabindex !== b.tabindex) {
                if (!a.tabindex) return 1;
                if (!b.tabindex) return -1;
                return a.tabindex - b.tabindex;
              }
              return a.index - b.index;
            });
          }
          for (i = 0; i < entries.length; i++) {
            var e = entries[i];
            var details = { role: e.role, name: e.name };
            if (kind === 'focus-order') {
              details.order = i + 1;
              if (e.tabindex) details.tabindex = e.tabindex;
            }
            add(e.el, details);
          }
        }
        return {
          ruleId: ctx.rule.ruleId,
          outcome: occurrences.length ? 'cantTell' : 'notApplicable',
          severity: 'minor',
          occurrences: occurrences
        };
      }
    };
  }

  function shorten(text) {
    return text.length > 60 ? text.slice(0, 59) + '\u2026' : text;
  }

  // Draws what a person reviewing the page checks by hand, over the page,
  // in the layer highlight() uses, and logs it as a table: 'headings' (each
  // heading's level and name), 'landmarks' (role and name), 'names' (each
  // control's role and accessible name; one with no name is marked amber)
  // or 'focus-order' (the controls Tab reaches, numbered in the order the
  // engine works out from tabindex and the document; press Tab to confirm
  // it). Clears any highlights first. Resolves to the rows; options.draw:
  // false only lists them. A review aid: it judges nothing.
  function inspect(kind, options) {
    if (INSPECT_KINDS.indexOf(kind) === -1) {
      return Promise.reject(
        new TypeError(
          'inspect: kind must be one of ' +
            INSPECT_KINDS.join(', ') +
            ', not ' +
            JSON.stringify(kind) +
            '.'
        )
      );
    }
    clearHighlights();
    var doc = documentOf();
    var href = global.location ? global.location.href : null;
    return Promise.resolve()
      .then(function () {
        return api.runa11yCoreInPage(href, null, { customRules: [inspectRule(kind)] }, [
          INSPECT_RULE
        ]);
      })
      .then(function (result) {
        var check = null;
        var checks = checksOf(result);
        for (var i = 0; i < checks.length; i++) {
          if (checks[i] && checks[i].ruleId === INSPECT_RULE) check = checks[i];
        }
        if (check && check.error && (!check.occurrences || !check.occurrences.length)) {
          throw new Error('inspect: ' + check.error);
        }
        var rows = [];
        var marks = [];
        var occurrences = check && Array.isArray(check.occurrences) ? check.occurrences : [];
        for (var j = 0; j < occurrences.length; j++) {
          var o = occurrences[j] || {};
          var d = (o.data && o.data.details) || {};
          var row;
          var label;
          if (kind === 'headings') {
            row = { level: d.level, name: d.name, element: o.selector || '' };
            label = 'H' + d.level + (d.name ? ' ' + shorten(d.name) : '');
          } else if (kind === 'focus-order') {
            row = { order: d.order, role: d.role, name: d.name, element: o.selector || '' };
            if (d.tabindex) row.tabindex = d.tabindex;
            label = String(d.order);
          } else {
            row = { role: d.role, name: d.name, element: o.selector || '' };
            label = d.role + ': ' + (d.name ? shorten(d.name) : '(no name)');
          }
          rows.push(row);
          var el = doc ? locate(doc, o) : null;
          if (el) {
            marks.push({
              element: el,
              kind: kind === 'names' && !d.name ? 'ask' : 'info',
              label: label
            });
          }
        }
        if (doc && dom.documentElement(doc) && !(options && options.draw === false)) {
          drawMarks(doc, marks);
        }
        if (global.console && typeof global.console.table === 'function')
          global.console.table(rows);
        return rows;
      });
  }

  // The report's side file sits beside the bundle; options.reportScript
  // overrides where it is, for a bundle loaded by a bundler, which has no
  // address of its own.
  var reportLoading = null;
  function loadReport(options) {
    if (global.a11ycoreReport) return Promise.resolve(global.a11ycoreReport);
    if (reportLoading) return reportLoading;
    var doc = documentOf();
    var url = (options && options.reportScript) || null;
    if (!url && scriptSrc) {
      try {
        url = new URL(REPORT_FILE, scriptSrc).href;
      } catch {
        url = null;
      }
    }
    if (!doc || !url) {
      return Promise.reject(
        new Error(
          'openReport: cannot tell where ' +
            REPORT_FILE +
            ' is. Load it with a <script> tag, or pass { reportScript: url }.'
        )
      );
    }
    reportLoading = new Promise(function (resolve, reject) {
      var s = dom.createElement(doc, 'script');
      s.src = url;
      s.onload = function () {
        dom.remove(s);
        if (global.a11ycoreReport) resolve(global.a11ycoreReport);
        else reject(new Error('openReport: ' + url + ' loaded, but defined no report.'));
      };
      s.onerror = function () {
        dom.remove(s);
        reportLoading = null;
        reject(
          new Error(
            'openReport: could not load ' +
              url +
              ". The page's Content Security Policy may block it; load " +
              REPORT_FILE +
              ' yourself, or render the report in Node.'
          )
        );
      };
      dom.appendChild(dom.head(doc) || dom.documentElement(doc), s);
    });
    return reportLoading;
  }

  // Opens the scan's HTML report in a new tab, and resolves to its address.
  // Where the browser blocks the tab, the address is logged to open by hand.
  function openReport(result, options) {
    return loadReport(options).then(function (report) {
      var html = report.renderHtmlReport(result, (options && options.report) || {});
      var url = global.URL.createObjectURL(new global.Blob([html], { type: 'text/html' }));
      var opened = typeof global.open === 'function' ? global.open(url, '_blank') : null;
      if (!opened && global.console) {
        global.console.info('surea11y: the report is at ' + url + ' (no tab could be opened).');
      }
      return url;
    });
  }

  // A scan of the page, as runa11yCoreInPageAsync runs it (the style sheets
  // the page can't read are fetched first), with the engine options and two
  // of its own: context, a selector to scan only part of the page, and
  // runOnly, the selection, in any form the scan takes (rule ids, or
  // { wcag, bestPractices, tags, ... }), checked by the engine as anywhere
  // else (engineOptions.rules is per-rule settings). Clears any highlights
  // first, so the overlay is never scanned. Options that are not an object,
  // or a selection key outside runOnly, are refused: either would run every
  // rule.
  function run(options) {
    if (options != null && (typeof options !== 'object' || Array.isArray(options))) {
      return Promise.reject(
        new TypeError(
          'run: options must be an object, not ' +
            (Array.isArray(options) ? 'a list' : typeof options) +
            ". Rule ids and selections go under runOnly: run({ runOnly: ['img-alt-present'] })."
        )
      );
    }
    for (var i = 0; options && i < RUN_ONLY_KEYS.length; i++) {
      if (Object.prototype.hasOwnProperty.call(options, RUN_ONLY_KEYS[i])) {
        return Promise.reject(
          new TypeError(
            'run: ' +
              RUN_ONLY_KEYS[i] +
              ' is part of the selection, which goes under runOnly: run({ runOnly: { ' +
              RUN_ONLY_KEYS[i] +
              ': ... } }).'
          )
        );
      }
    }
    var engineOptions = Object.assign({}, options || {});
    var context = engineOptions.context != null ? engineOptions.context : null;
    var runOnly = engineOptions.runOnly != null ? engineOptions.runOnly : null;
    delete engineOptions.context;
    delete engineOptions.runOnly;
    clearHighlights();
    var href = global.location ? global.location.href : null;
    return api.runa11yCoreInPageAsync(href, context, engineOptions, runOnly);
  }

  return {
    run: run,
    table: table,
    highlight: highlight,
    inspect: inspect,
    clearHighlights: clearHighlights,
    openReport: openReport
  };
}

module.exports = { consoleHelpers };
