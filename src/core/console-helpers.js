/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The browser bundle's helpers for a scan run by hand, from the browser's
 * console: run(), table(), highlight(), clearHighlights() and openReport().
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
  var REPORT_FILE = 'surea11y.report.js';

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

  function clearHighlights() {
    var doc = documentOf();
    if (!doc) return;
    var hosts = dom.querySelectorAll(doc, '[' + HIGHLIGHT_ATTR + ']');
    for (var i = 0; i < hosts.length; i++) dom.remove(hosts[i]);
  }

  // Draws a box over each element a fail or cantTell occurrence names, in a
  // layer of its own: one element added to the page, holding a shadow root,
  // hidden from assistive technology and inert. The page's own elements are
  // never changed. A box is red for a failure and amber, dashed, for a
  // question, labelled with the rules that reported the element; the labels'
  // white text is above 7:1 on both, so a scan run with them on the page
  // finds nothing in them to report. Returns how
  // many elements it marked; one with no box (display: none) is skipped.
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
        if (!o.selector) continue;
        var el;
        try {
          el = dom.querySelector(doc, o.selector);
        } catch {
          el = null;
        }
        if (!el) continue;
        var entry = byElement.get(el) || { fail: false, rules: [] };
        if ((o.occurrenceOutcome || c.outcome) === 'fail') entry.fail = true;
        if (entry.rules.indexOf(c.ruleId) === -1) entry.rules.push(c.ruleId);
        byElement.set(el, entry);
      }
    }

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
      '.tag{position:absolute;bottom:100%;left:-3px;padding:0 4px;' +
      'font:12px/1.5 system-ui,sans-serif;white-space:nowrap;color:#fff;background:#a30000}' +
      '.ask .tag{background:#704400}';
    dom.appendChild(root, style);

    var sx = global.scrollX || 0;
    var sy = global.scrollY || 0;
    var count = 0;
    byElement.forEach(function (entry, el) {
      var r = dom.getBoundingClientRect(el);
      if (!r || (r.width === 0 && r.height === 0)) return;
      var box = dom.createElement(doc, 'div');
      box.className = entry.fail ? 'box' : 'box ask';
      box.style.left = r.left + sx + 'px';
      box.style.top = r.top + sy + 'px';
      box.style.width = r.width + 'px';
      box.style.height = r.height + 'px';
      var tag = dom.createElement(doc, 'span');
      tag.className = 'tag';
      tag.textContent = entry.rules.join(', ');
      dom.appendChild(box, tag);
      dom.appendChild(root, box);
      count += 1;
    });
    dom.appendChild(dom.documentElement(doc), host);
    return count;
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
  // runOnly, the rule ids to run (engineOptions.rules is per-rule settings). Clears any highlights first, so the overlay
  // is never scanned.
  function run(options) {
    var engineOptions = Object.assign({}, options || {});
    var context = engineOptions.context != null ? engineOptions.context : null;
    var runOnly = Array.isArray(engineOptions.runOnly) ? engineOptions.runOnly : null;
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
    clearHighlights: clearHighlights,
    openReport: openReport
  };
}

module.exports = { consoleHelpers };
