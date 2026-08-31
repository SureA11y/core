/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Generate the rule review page (docs/rule-review.html): every rule on its own
 * screen with what it applies to, what it expects, every message it can emit
 * filed under the outcome it is emitted as, and the fixture cases behind those
 * verdicts -- each replayed through the engine so the outcome shown is the one
 * the engine really returns.
 *
 * The page is a self-contained reader for going through the rule set by hand
 * and recording a verdict per rule; it keeps that progress in the browser.
 * For a one-row-per-rule index of the same rule set, see
 * scripts/generate-rule-catalog.js.
 *
 * Usage:
 *   npm run build && node scripts/generate-rule-review.js
 *   node scripts/generate-rule-review.js --out docs/rule-review.html
 *   node scripts/generate-rule-review.js --types automatic
 */

const fs = require('node:fs');
const path = require('node:path');

const { collect, findRepoRoot } = require('./lib/rule-review-data');

function parseArgs(argv) {
  const args = { out: 'docs/rule-review.html', types: 'automatic,manual' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--types') args.types = argv[++i];
  }
  return args;
}

/** Narrow the collected data to the fields the page renders. */
function forPage(rules) {
  return rules.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    sc: r.sc,
    level: r.level,
    confidence: r.confidence,
    severity: r.severity,
    category: r.category,
    applicability: r.applicability,
    expectation: r.expectation,
    outcomes: r.outcomes,
    messages: r.messages,
    ruleFile: r.ruleFile,
    testFile: r.testFile,
    fixtureFile: r.fixtureFile,
    cases: r.cases.map((c) => ({
      id: c.id || c.marker,
      label: c.label,
      marker: c.marker,
      outcome: c.outcome,
      section: c.section,
      notes: c.notes,
      markup: c.markup,
      engine: c.engineOutcome,
      hits: c.engineHits.map((h) => ({
        o: h.outcome,
        s: h.summary,
        sel: h.selector,
        u: h.uncertainty
      })),
      agrees: c.agrees
    })),
    tests: r.tests
  }));
}

function renderPage(collected) {
  const rules = forPage(collected);
  // The data rides in a JSON script block; escaping < keeps a fixture's markup
  // from closing that block early.
  const json = JSON.stringify({ rules }).replace(/</g, '\\u003c');

  return `<title>SureA11y Rule Review</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>
:root {
  --bg: #f2f4f7;
  --surface: #ffffff;
  --surface-2: #f7f9fb;
  --line: #dce2ea;
  --line-strong: #c3ccd8;
  --ink: #131820;
  --ink-2: #4e5a69;
  --ink-3: #7b8796;
  --accent: #2a5fa5;
  --accent-soft: #e8eff8;
  --on-accent: #ffffff;
  --fail: #b32a3e;
  --fail-bg: #fbedef;
  --ct: #8f5c00;
  --ct-bg: #fbf2e2;
  --pass: #1f6b4a;
  --pass-bg: #e9f3ed;
  --na: #5f6b79;
  --na-bg: #eef1f4;
  --flag: #a34a12;
  --flag-bg: #fbf0e7;
  --shadow: 0 1px 2px rgba(19, 24, 32, .06), 0 8px 24px -16px rgba(19, 24, 32, .3);
  --radius: 10px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0e1216;
    --surface: #161b21;
    --surface-2: #1b212a;
    --line: #29313b;
    --line-strong: #3a4552;
    --ink: #e7ecf2;
    --ink-2: #a9b4c0;
    --ink-3: #7b8795;
    --accent: #7faee8;
    --accent-soft: #1a2735;
    --on-accent: #0e1216;
    --fail: #ef9099;
    --fail-bg: #2c191d;
    --ct: #dfb066;
    --ct-bg: #2a2317;
    --pass: #79c9a0;
    --pass-bg: #15271e;
    --na: #94a0ad;
    --na-bg: #1d232b;
    --flag: #e5a173;
    --flag-bg: #2a1f16;
    --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 10px 28px -18px rgba(0, 0, 0, .9);
  }
}
:root[data-theme="dark"] {
  --bg: #0e1216;
  --surface: #161b21;
  --surface-2: #1b212a;
  --line: #29313b;
  --line-strong: #3a4552;
  --ink: #e7ecf2;
  --ink-2: #a9b4c0;
  --ink-3: #7b8795;
  --accent: #7faee8;
  --accent-soft: #1a2735;
  --on-accent: #0e1216;
  --fail: #ef9099;
  --fail-bg: #2c191d;
  --ct: #dfb066;
  --ct-bg: #2a2317;
  --pass: #79c9a0;
  --pass-bg: #15271e;
  --na: #94a0ad;
  --na-bg: #1d232b;
  --flag: #e5a173;
  --flag-bg: #2a1f16;
  --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 10px 28px -18px rgba(0, 0, 0, .9);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-text-size-adjust: 100%;
}

code, kbd, pre, .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }

a { color: var(--accent); }

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.wrap { max-width: 760px; margin: 0 auto; padding: 0 16px; }

/* ---------- top bar ---------- */
.bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.bar-in {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
}
.bar-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .02em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 500;
}
.iconbtn:disabled { opacity: .38; cursor: default; }
.counter {
  font-family: "IBM Plex Mono", monospace;
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ---------- masthead ---------- */
.mast { padding: 26px 0 8px; }
.eyebrow {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 8px;
}
h1 {
  font-size: 27px;
  line-height: 1.15;
  letter-spacing: -.02em;
  margin: 0 0 10px;
  text-wrap: balance;
}
.lede { color: var(--ink-2); margin: 0 0 18px; max-width: 60ch; }

/* ---------- progress ---------- */
.progress {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}
.progress-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.progress-num {
  font-family: "IBM Plex Mono", monospace;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.progress-num small { font-size: 13px; font-weight: 400; color: var(--ink-3); }
.track {
  height: 6px;
  border-radius: 999px;
  background: var(--na-bg);
  overflow: hidden;
  display: flex;
}
.track i { display: block; height: 100%; }
.track .t-ok { background: var(--pass); }
.track .t-flag { background: var(--flag); }
.progress-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-2);
}
.progress-legend span { display: inline-flex; align-items: center; gap: 6px; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dot.ok { background: var(--pass); }
.dot.flag { background: var(--flag); }
.dot.none { background: transparent; border: 1.5px solid var(--line-strong); }

.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  font-size: 14px;
  font-weight: 500;
}
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
.btn.wide { flex: 1; }

/* ---------- filters ---------- */
.filters {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding: 2px 0 10px;
  scrollbar-width: none;
}
.filters::-webkit-scrollbar { display: none; }
.chip {
  flex: none;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
}
.chip[aria-pressed="true"] {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.seg button {
  flex: 1;
  min-height: 40px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  gap: 1px;
}
.seg button small {
  font-family: "IBM Plex Mono", monospace;
  font-size: 10.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}
.seg button[aria-pressed="true"] {
  background: var(--surface);
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font-weight: 600;
  box-shadow: var(--shadow);
}
.seg button[aria-pressed="true"] small { color: var(--accent); }

.search {
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 15px;
}
.search::placeholder { color: var(--ink-3); }

/* ---------- rule list ---------- */
.list {
  list-style: none;
  margin: 0 0 30px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
}
.list li + li { border-top: 1px solid var(--line); }
.row {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 12px;
  align-items: start;
  width: 100%;
  padding: 13px 14px;
  text-align: left;
}
.row:hover { background: var(--surface-2); }
.row-gutter { display: block; padding-top: 6px; }
.row-id {
  display: block;
  font-family: "IBM Plex Mono", monospace;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--accent);
  word-break: break-word;
}
.row-title {
  display: block;
  font-size: 14px;
  color: var(--ink);
  margin-top: 1px;
  line-height: 1.4;
}
.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
  align-items: center;
}
.tag {
  font-family: "IBM Plex Mono", monospace;
  font-size: 10.5px;
  letter-spacing: .04em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--na-bg);
  color: var(--na);
  white-space: nowrap;
}
.tag.f { background: var(--fail-bg); color: var(--fail); }
.tag.c { background: var(--ct-bg); color: var(--ct); }
.tag.p { background: var(--pass-bg); color: var(--pass); }
.tag.flagged { background: var(--flag-bg); color: var(--flag); }
.empty { padding: 26px 14px; color: var(--ink-3); text-align: center; font-size: 14px; }

/* ---------- rule detail ---------- */
.detail { padding-bottom: 210px; }
.rule-id {
  font-family: "IBM Plex Mono", monospace;
  font-size: 13px;
  color: var(--accent);
  margin: 22px 0 6px;
  word-break: break-word;
}
h2.rule-title {
  font-size: 22px;
  line-height: 1.25;
  letter-spacing: -.015em;
  margin: 0 0 12px;
  text-wrap: balance;
}
.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 12px;
}
.panel h3 {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 8px;
  font-weight: 500;
}
.panel p { margin: 0 0 8px; }
.panel p:last-child { margin-bottom: 0; }

.callout {
  border-left: 3px solid var(--flag);
  background: var(--flag-bg);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 14px;
}
.callout h3 { color: var(--flag); }
.callout ul { margin: 6px 0 0; padding-left: 18px; }
.callout li { margin-bottom: 5px; }

/* ---------- outcome sections ---------- */
.outcome { margin: 22px 0 0; }
.outcome-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--oc, var(--line));
  margin-bottom: 12px;
}
.outcome-key {
  font-family: "IBM Plex Mono", monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--oc);
  letter-spacing: -.01em;
}
.outcome-count {
  margin-left: auto;
  font-family: "IBM Plex Mono", monospace;
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}
.outcome.fail { --oc: var(--fail); --ocbg: var(--fail-bg); }
.outcome.cantTell { --oc: var(--ct); --ocbg: var(--ct-bg); }
.outcome.pass { --oc: var(--pass); --ocbg: var(--pass-bg); }
.outcome.notApplicable { --oc: var(--na); --ocbg: var(--na-bg); }

.msg {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid var(--oc);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.msg-text { font-size: 14.5px; margin: 0 0 6px; }
.msg-hint { font-size: 13.5px; color: var(--ink-2); margin: 0; }
.msg-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
.msg-needed {
  margin: 9px 0 0;
  font-size: 13px;
  color: var(--ink-2);
  padding-left: 10px;
  border-left: 2px solid var(--line);
}

.case {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 11px 13px;
  margin-bottom: 8px;
}
.case.mismatch { border-color: var(--flag); background: var(--flag-bg); }
.case-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 5px;
}
.case-id {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.case-label { font-size: 14px; }
.case-note { font-size: 13px; color: var(--ink-2); margin: 6px 0 0; }
.case-section {
  font-size: 11.5px;
  color: var(--ink-3);
  margin: 6px 0 0;
  font-style: italic;
}
details.snip { margin-top: 8px; }
details.snip > summary {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--ink-3);
  cursor: pointer;
  padding: 4px 0;
  list-style: none;
}
details.snip > summary::-webkit-details-marker { display: none; }
details.snip > summary::before { content: "▸ "; }
details.snip[open] > summary::before { content: "▾ "; }
pre {
  margin: 6px 0 0;
  padding: 10px 11px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre;
  tab-size: 2;
}

.tests { margin-top: 8px; }
.tests > summary {
  font-size: 13.5px;
  color: var(--ink-2);
  cursor: pointer;
  padding: 9px 0;
  font-weight: 500;
}
.tests ul { margin: 4px 0 8px; padding-left: 20px; }
.tests li { font-size: 13.5px; margin-bottom: 6px; color: var(--ink-2); }

.srcline {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11.5px;
  color: var(--ink-3);
  margin: 24px 0 0;
  word-break: break-all;
  line-height: 1.7;
}

/* ---------- verdict bar ---------- */
.verdict {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--line);
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
}
.verdict-in { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
.verdict-row { display: flex; gap: 8px; }
.vbtn {
  flex: 1;
  min-height: 46px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.vbtn[aria-pressed="true"].ok {
  background: var(--pass-bg);
  border-color: var(--pass);
  color: var(--pass);
  font-weight: 600;
}
.vbtn[aria-pressed="true"].flag {
  background: var(--flag-bg);
  border-color: var(--flag);
  color: var(--flag);
  font-weight: 600;
}
.note {
  width: 100%;
  min-height: 74px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  resize: vertical;
}
.saved {
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
  min-height: 16px;
}
.hidden { display: none !important; }
.footnote { color: var(--ink-3); font-size: 12.5px; margin: 18px 0 30px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>

<div class="bar">
  <div class="bar-in">
    <button class="iconbtn hidden" id="back" aria-label="Back to the rule list">←</button>
    <div class="bar-title" id="barTitle">SureA11y rule review</div>
    <span class="counter" id="counter"></span>
    <button class="iconbtn hidden" id="prev" aria-label="Previous rule">‹</button>
    <button class="iconbtn hidden" id="next" aria-label="Next rule">›</button>
  </div>
</div>

<main class="wrap" id="app"></main>

<div class="verdict hidden" id="verdict">
  <div class="verdict-in">
    <textarea class="note hidden" id="note" placeholder="What would you change about this rule?"></textarea>
    <div class="verdict-row">
      <button class="vbtn ok" id="vOk" aria-pressed="false">Looks right</button>
      <button class="vbtn flag" id="vFlag" aria-pressed="false">Flag to change</button>
    </div>
    <div class="saved" id="saved"></div>
  </div>
</div>

<script type="application/json" id="data">${json}</script>
<script>
(function () {
  'use strict';

  var ALL = JSON.parse(document.getElementById('data').textContent).rules;
  var RULES = [];
  var KEY = 'surea11y-rule-review-v1';
  var ORDER = ['fail', 'cantTell', 'pass', 'notApplicable'];
  var NAMES = {
    fail: 'fail',
    cantTell: 'cantTell',
    pass: 'pass',
    notApplicable: 'notApplicable',
    other: 'unlabelled'
  };
  var BLURB = {
    fail: 'The rule decided the content does not meet the criterion.',
    cantTell: 'The rule found the shape it looks for but will not decide it alone.',
    pass: 'The rule applied and the expectation held.',
    notApplicable: 'Out of scope — the rule never got as far as deciding.',
    other: 'Cases the fixture did not label with an outcome.'
  };

  /* ---------- saved review state ---------- */
  var state = load();

  function setMode(m) {
    mode = m;
    state._mode = m;
    RULES = ALL.filter(function (r) {
      return r.type === m;
    });
    current = 0;
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function entry(id) {
    return state[id] || {};
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function scLabel(r) {
    if (!r.sc || !r.sc.length) return 'no SC mapping';
    return 'WCAG ' + r.sc.join(', ') + (r.level ? ' (' + r.level + ')' : '');
  }

  function counts(r) {
    var c = { fail: 0, cantTell: 0, pass: 0, notApplicable: 0, other: 0 };
    r.cases.forEach(function (x) {
      c[x.outcome] = (c[x.outcome] || 0) + 1;
    });
    return c;
  }

  function mismatches(r) {
    return r.cases.filter(function (c) {
      return !c.agrees;
    });
  }

  /* ---------- routing ---------- */
  var view = 'index';
  var mode = 'automatic';
  var current = 0;
  var filter = 'all';
  var query = '';

  var app = document.getElementById('app');
  var bar = {
    back: document.getElementById('back'),
    title: document.getElementById('barTitle'),
    counter: document.getElementById('counter'),
    prev: document.getElementById('prev'),
    next: document.getElementById('next')
  };
  var verdict = document.getElementById('verdict');
  var noteBox = document.getElementById('note');
  var vOk = document.getElementById('vOk');
  var vFlag = document.getElementById('vFlag');
  var savedMsg = document.getElementById('saved');

  function go(v, i) {
    view = v;
    if (typeof i === 'number') current = i;
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- index ---------- */
  function renderIndex() {
    bar.back.classList.add('hidden');
    bar.prev.classList.add('hidden');
    bar.next.classList.add('hidden');
    verdict.classList.add('hidden');
    bar.title.textContent = mode === 'manual' ? 'Manual rules' : 'Automatic rules';

    var done = RULES.filter(function (r) {
      return entry(r.id).status;
    }).length;
    var ok = RULES.filter(function (r) {
      return entry(r.id).status === 'ok';
    }).length;
    var flagged = RULES.filter(function (r) {
      return entry(r.id).status === 'flag';
    }).length;
    bar.counter.textContent = done + '/' + RULES.length;

    var totalCases = RULES.reduce(function (s, r) {
      return s + r.cases.length;
    }, 0);
    var totalMismatch = RULES.reduce(function (s, r) {
      return s + mismatches(r).length;
    }, 0);

    var autoCount = ALL.filter(function (r) { return r.type === 'automatic'; }).length;
    var manCount = ALL.filter(function (r) { return r.type === 'manual'; }).length;
    var autoDone = ALL.filter(function (r) { return r.type === 'automatic' && entry(r.id).status; }).length;
    var manDone = ALL.filter(function (r) { return r.type === 'manual' && entry(r.id).status; }).length;

    app.innerHTML =
      '<div class="mast">' +
      '<p class="eyebrow">' + ALL.length + ' rules · engine 1.7.0</p>' +
      '<h1>Every rule, and what makes it decide</h1>' +
      '<p class="lede">One rule per screen: what it applies to, what it expects, every message it can emit, ' +
      'and the fixture cases behind those verdicts — each replayed through the engine so the outcome shown is the one it really returns. ' +
      'Mark each rule as you go; your place and your notes are kept on this device.</p>' +
      '</div>' +
      '<div class="seg" role="group" aria-label="Which rules to review">' +
      '<button data-m="automatic" aria-pressed="' + (mode === 'automatic') + '">Automatic' +
      '<small>' + autoDone + '/' + autoCount + ' reviewed</small></button>' +
      '<button data-m="manual" aria-pressed="' + (mode === 'manual') + '">Manual' +
      '<small>' + manDone + '/' + manCount + ' reviewed</small></button>' +
      '</div>' +
      '<p class="lede" style="font-size:13.5px;margin:-4px 0 16px">' +
      (mode === 'automatic'
        ? 'The ' + autoCount + ' WCAG-normative rules that can decide against a page on their own.'
        : 'The ' + manCount + ' advisory rules. None of these can return <code>fail</code>: the default policy caps a manual rule at <code>cantTell</code>, so what to review here is whether each one is asking the right question of a human.') +
      '</p>' +
      '<div class="progress">' +
      '<div class="progress-top">' +
      '<div class="progress-num">' + done + ' <small>of ' + RULES.length + ' reviewed</small></div>' +
      '</div>' +
      '<div class="track">' +
      '<i class="t-ok" style="width:' + (ok / RULES.length) * 100 + '%"></i>' +
      '<i class="t-flag" style="width:' + (flagged / RULES.length) * 100 + '%"></i>' +
      '</div>' +
      '<div class="progress-legend">' +
      '<span><i class="dot ok"></i>' + ok + ' look right</span>' +
      '<span><i class="dot flag"></i>' + flagged + ' flagged</span>' +
      '<span><i class="dot none"></i>' + (RULES.length - done) + ' to go</span>' +
      '</div>' +
      '<div class="actions">' +
      '<button class="btn primary wide" id="resume"></button>' +
      '<button class="btn" id="export">Copy notes</button>' +
      '</div>' +
      '</div>' +
      '<input class="search" id="q" type="search" placeholder="Search rule id, title or SC" value="' + esc(query) + '">' +
      '<div class="filters" role="group" aria-label="Filter rules">' +
      filterChip('all', 'All ' + RULES.length) +
      filterChip('todo', 'Not reviewed') +
      filterChip('flag', 'Flagged') +
      filterChip('ok', 'Looks right') +
      filterChip('mismatch', 'Fixture disagrees (' + totalMismatch + ')') +
      (mode === 'automatic' ? filterChip('cantTell', 'Can say cantTell') + filterChip('nofail', 'Never fails') : '') +
      '</div>' +
      '<ul class="list" id="list"></ul>' +
      '<details class="tests" style="margin-bottom:26px"><summary>Where this material comes from</summary>' +
      '<ul>' +
      '<li><strong>Applies to</strong> and <strong>Expectation</strong> are the rule header in its own source file.</li>' +
      '<li><strong>Messages</strong> are every string the rule can emit, filed under the outcome it is emitted as. ' +
      'A message whose key says <code>fail</code> but which carries an uncertainty block is filed under <code>cantTell</code>, because that is what the engine returns.</li>' +
      '<li><strong>Cases</strong> are the rule’s scenario fixture, replayed through the engine here so each case shows the verdict it really produces alongside the one the fixture claims.</li>' +
      '<li><strong>From the test suite</strong> are the rule’s own test names, grouped by the outcome each one asserts.</li>' +
      '</ul></details>' +
      '<p class="footnote">' +
      (mode === 'automatic'
        ? 'Switch to Manual above for the ' + manCount + ' advisory rules.'
        : 'Switch to Automatic above for the ' + autoCount + ' WCAG-normative rules.') +
      '</p>';

    var resume = document.getElementById('resume');
    var nextIdx = resumeIndex();
    resume.textContent =
      done === 0 ? 'Start reviewing' : nextIdx === -1 ? 'Review again from the top' : 'Resume at ' + RULES[nextIdx].id;
    resume.addEventListener('click', function () {
      go('rule', nextIdx === -1 ? 0 : nextIdx);
    });

    document.getElementById('export').addEventListener('click', exportNotes);

    Array.prototype.forEach.call(app.querySelectorAll('.seg button'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.m === mode) return;
        setMode(b.dataset.m);
        save();
        renderIndex();
        window.scrollTo(0, 0);
      });
    });

    var q = document.getElementById('q');
    q.addEventListener('input', function () {
      query = q.value;
      renderList();
    });

    Array.prototype.forEach.call(app.querySelectorAll('.chip'), function (c) {
      c.addEventListener('click', function () {
        filter = c.dataset.f;
        Array.prototype.forEach.call(app.querySelectorAll('.chip'), function (o) {
          o.setAttribute('aria-pressed', String(o.dataset.f === filter));
        });
        renderList();
      });
    });

    renderList();
  }

  function filterChip(id, label) {
    return (
      '<button class="chip" data-f="' + id + '" aria-pressed="' + (filter === id) + '">' + esc(label) + '</button>'
    );
  }

  function firstUnreviewed() {
    for (var i = 0; i < RULES.length; i++) if (!entry(RULES[i].id).status) return i;
    return -1;
  }

  /* Pick up where the reading left off: the last rule opened if it is still
     undecided, otherwise the first one never looked at. */
  function resumeIndex() {
    if (state._last) {
      for (var i = 0; i < RULES.length; i++) {
        if (RULES[i].id === state._last && !entry(RULES[i].id).status) return i;
      }
    }
    return firstUnreviewed();
  }

  function matches(r) {
    var st = entry(r.id).status;
    if (filter === 'todo' && st) return false;
    if (filter === 'flag' && st !== 'flag') return false;
    if (filter === 'ok' && st !== 'ok') return false;
    if (filter === 'mismatch' && !mismatches(r).length) return false;
    if (filter === 'cantTell' && !r.messages.cantTell.length) return false;
    if (filter === 'nofail' && r.messages.fail.length) return false;
    if (query) {
      var hay = (r.id + ' ' + r.title + ' ' + (r.sc || []).join(' ')).toLowerCase();
      if (hay.indexOf(query.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function renderList() {
    var list = document.getElementById('list');
    if (!list) return;
    list.innerHTML = '';
    var shown = 0;

    RULES.forEach(function (r, i) {
      if (!matches(r)) return;
      shown++;
      var st = entry(r.id).status;
      var c = counts(r);
      var mm = mismatches(r).length;

      var tags = '<span class="tag">' + esc(scLabel(r)) + '</span>';
      if (r.messages.fail.length) tags += '<span class="tag f">' + r.messages.fail.length + ' fail msg</span>';
      if (r.messages.cantTell.length)
        tags += '<span class="tag c">' + r.messages.cantTell.length + ' cantTell msg</span>';
      if (!r.messages.fail.length && mode === 'automatic')
        tags += '<span class="tag c">never fails</span>';
      tags += '<span class="tag">' + r.cases.length + ' cases</span>';
      if (mm) tags += '<span class="tag flagged">' + mm + ' disagree</span>';

      var li = document.createElement('li');
      var b = el(
        '<button class="row">' +
          '<span class="row-gutter"><i class="dot ' +
          (st === 'ok' ? 'ok' : st === 'flag' ? 'flag' : 'none') +
          '"></i></span>' +
          '<span>' +
          '<span class="row-id">' + esc(r.id) + '</span>' +
          '<span class="row-title">' + esc(r.title) + '</span>' +
          '<span class="row-meta">' + tags + '</span>' +
          '</span>' +
          '</button>'
      );
      b.addEventListener('click', function () {
        go('rule', i);
      });
      li.appendChild(b);
      list.appendChild(li);
    });

    if (!shown) list.innerHTML = '<li class="empty">No rule matches that filter.</li>';
  }

  /* ---------- rule detail ---------- */
  function renderRule() {
    var r = RULES[current];
    bar.back.classList.remove('hidden');
    bar.prev.classList.remove('hidden');
    bar.next.classList.remove('hidden');
    verdict.classList.remove('hidden');
    bar.title.textContent = r.id;
    bar.counter.textContent = current + 1 + '/' + RULES.length;
    bar.prev.disabled = current === 0;
    bar.next.disabled = current === RULES.length - 1;

    var mm = mismatches(r);
    var html = '<div class="detail">';

    html +=
      '<p class="rule-id">' + esc(r.id) + '</p>' +
      '<h2 class="rule-title">' + esc(r.title) + '</h2>' +
      '<div class="meta-grid">' +
      '<span class="tag">' + esc(scLabel(r)) + '</span>' +
      '<span class="tag">confidence ' + esc(r.confidence) + '</span>' +
      '<span class="tag">severity ' + esc(r.severity) + '</span>' +
      '<span class="tag">' + esc(r.category) + '</span>' +
      '</div>';

    html += '<div class="panel"><h3>What it checks</h3><p>' + esc(r.description) + '</p></div>';

    var returns = ORDER.filter(function (o) {
      return r.outcomes.indexOf(o) !== -1;
    });
    html +=
      '<div class="panel"><h3>Outcomes it can return</h3><div class="meta-grid" style="margin:0">' +
      returns
        .map(function (o) {
          var cls = o === 'fail' ? 'f' : o === 'cantTell' ? 'c' : o === 'pass' ? 'p' : '';
          return '<span class="tag ' + cls + '">' + o + '</span>';
        })
        .join('') +
      '</div>' +
      (r.messages.fail.length
        ? ''
        : '<p class="msg-hint" style="margin-top:9px">No message in this rule is emitted as a plain <code>fail</code>: every finding carries an uncertainty block, so it reports <code>cantTell</code>.</p>') +
      '</div>';

    if (r.applicability)
      html += '<div class="panel"><h3>Applies to</h3>' + paras(r.applicability) + '</div>';
    if (r.expectation)
      html += '<div class="panel"><h3>Expectation</h3>' + paras(r.expectation) + '</div>';

    if (mm.length) {
      html +=
        '<div class="callout"><h3>Worth a look — ' + mm.length + ' fixture case' + (mm.length > 1 ? 's' : '') +
        ' the engine decides differently</h3><ul>' +
        mm
          .map(function (c) {
            return (
              '<li><code>' + esc(c.id || '') + '</code> is labelled <strong>' + esc(NAMES[c.outcome] || c.outcome) +
              '</strong>, engine returns <strong>' + esc(c.engine === 'notFlagged' ? 'nothing' : c.engine) +
              '</strong> — ' + esc(c.label) + '</li>'
            );
          })
          .join('') +
        '</ul></div>';
    }

    ORDER.concat(['other']).forEach(function (o) {
      var msgs = r.messages[o] || [];
      var cases = r.cases.filter(function (c) {
        return c.outcome === o;
      });
      var tests = r.tests.filter(function (t) {
        return t.outcome === o;
      });
      if (!msgs.length && !cases.length && !tests.length) return;

      html +=
        '<section class="outcome ' + o + '">' +
        '<div class="outcome-head"><span class="outcome-key">' + esc(NAMES[o]) + '</span>' +
        '<span class="outcome-count">' + cases.length + ' case' + (cases.length === 1 ? '' : 's') + '</span></div>' +
        '<p class="msg-hint" style="margin:-4px 0 12px">' + esc(BLURB[o]) + '</p>';

      msgs.forEach(function (m) {
        html +=
          '<div class="msg">' +
          '<p class="msg-text">' + esc(m.text) + '</p>' +
          (m.hint ? '<p class="msg-hint">' + esc(m.hint) + '</p>' : '') +
          (m.needed ? '<p class="msg-needed">Needs a human to settle: ' + esc(m.needed) + '</p>' : '') +
          '<div class="msg-tags">' +
          (m.uncertaintyCode ? '<span class="tag c">' + esc(m.uncertaintyCode) + '</span>' : '') +
          (m.reasonCode ? '<span class="tag">' + esc(m.reasonCode) + '</span>' : '') +
          '<span class="tag">' + esc(m.key) + '</span>' +
          '</div></div>';
      });

      cases.forEach(function (c) {
        var bad = !c.agrees;
        html +=
          '<div class="case' + (bad ? ' mismatch' : '') + '">' +
          '<div class="case-head">' +
          '<span class="case-id">' + esc(c.id || c.marker) + '</span>' +
          (bad
            ? '<span class="tag flagged">engine: ' + esc(c.engine === 'notFlagged' ? 'not flagged' : c.engine) + '</span>'
            : c.engine !== 'notFlagged'
              ? '<span class="tag ' + (c.engine === 'fail' ? 'f' : 'c') + '">engine: ' + esc(c.engine) + '</span>'
              : '') +
          '</div>' +
          '<div class="case-label">' + esc(c.label) + '</div>' +
          (c.notes.length ? '<p class="case-note">' + esc(c.notes.join(' ')) + '</p>' : '') +
          (c.section ? '<p class="case-section">' + esc(c.section) + '</p>' : '') +
          (c.hits.length && (msgs.length > 1 || bad)
            ? '<p class="case-note">' +
              esc(
                c.hits
                  .map(function (h) {
                    return h.s;
                  })
                  .filter(function (v, i, a) {
                    return a.indexOf(v) === i;
                  })
                  .join(' ')
              ) +
              '</p>'
            : '') +
          (c.markup
            ? '<details class="snip"><summary>Markup</summary><pre><code>' + esc(c.markup) + '</code></pre></details>'
            : '') +
          '</div>';
      });

      if (tests.length) {
        html +=
          '<details class="tests"><summary>' + tests.length + ' more from the test suite</summary><ul>' +
          tests
            .map(function (t) {
              return '<li>' + esc(t.name) + '</li>';
            })
            .join('') +
          '</ul></details>';
      }

      html += '</section>';
    });

    var otherTests = r.tests.filter(function (t) {
      return t.outcome === 'other';
    });
    if (otherTests.length && !(r.messages.other || []).length) {
      html +=
        '<section class="outcome"><div class="outcome-head"><span class="outcome-key" style="color:var(--ink-2)">Mechanics</span></div>' +
        '<details class="tests"><summary>' + otherTests.length + ' tests that pin behaviour without naming an outcome</summary><ul>' +
        otherTests
          .map(function (t) {
            return '<li>' + esc(t.name) + '</li>';
          })
          .join('') +
        '</ul></details></section>';
    }

    html +=
      '<p class="srcline">' + esc(r.ruleFile) + '<br>' + esc(r.testFile) +
      (r.fixtureFile ? '<br>' + esc(r.fixtureFile) : '') + '</p>';

    html += '</div>';
    app.innerHTML = html;
    syncVerdict();
  }

  function paras(text) {
    return String(text)
      .split(/\\n\\n+/)
      .map(function (p) {
        return '<p>' + esc(p) + '</p>';
      })
      .join('');
  }

  /* ---------- verdict controls ---------- */
  function syncVerdict() {
    var r = RULES[current];
    var e = entry(r.id);
    vOk.setAttribute('aria-pressed', String(e.status === 'ok'));
    vFlag.setAttribute('aria-pressed', String(e.status === 'flag'));
    noteBox.value = e.note || '';
    noteBox.classList.toggle('hidden', e.status !== 'flag' && !e.note);
    savedMsg.textContent = e.status ? 'Saved' : '';
  }

  function setStatus(s) {
    var r = RULES[current];
    var e = state[r.id] || (state[r.id] = {});
    e.status = e.status === s ? null : s;
    if (!e.status && !e.note) delete state[r.id];
    save();
    syncVerdict();
    if (e.status === 'ok' && current < RULES.length - 1) {
      setTimeout(function () {
        go('rule', current + 1);
      }, 180);
    }
  }

  vOk.addEventListener('click', function () {
    setStatus('ok');
  });
  vFlag.addEventListener('click', function () {
    setStatus('flag');
    noteBox.classList.remove('hidden');
    noteBox.focus();
  });

  var noteTimer;
  noteBox.addEventListener('input', function () {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      var r = RULES[current];
      var e = state[r.id] || (state[r.id] = {});
      e.note = noteBox.value;
      if (!e.note && !e.status) delete state[r.id];
      savedMsg.textContent = save() ? 'Saved' : 'Could not save on this device';
    }, 350);
  });

  function exportNotes() {
    var lines = [];
    RULES.forEach(function (r) {
      var e = entry(r.id);
      if (!e.status && !e.note) return;
      lines.push('- ' + r.id + ' [' + (e.status === 'flag' ? 'CHANGE' : 'ok') + ']' + (e.note ? ': ' + e.note : ''));
    });
    var text = lines.length ? lines.join('\\n') : 'Nothing reviewed yet.';
    var btn = document.getElementById('export');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          btn.textContent = 'Copied';
          setTimeout(function () {
            btn.textContent = 'Copy notes';
          }, 1600);
        },
        function () {
          showNotes(text);
        }
      );
    } else showNotes(text);
  }

  function showNotes(text) {
    var pre = document.createElement('pre');
    pre.textContent = text;
    pre.style.marginTop = '12px';
    document.getElementById('export').parentNode.appendChild(pre);
  }

  /* ---------- nav wiring ---------- */
  bar.back.addEventListener('click', function () {
    go('index');
  });
  bar.prev.addEventListener('click', function () {
    if (current > 0) go('rule', current - 1);
  });
  bar.next.addEventListener('click', function () {
    if (current < RULES.length - 1) go('rule', current + 1);
  });
  document.addEventListener('keydown', function (ev) {
    if (view !== 'rule') return;
    if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
    if (ev.key === 'ArrowLeft' && current > 0) go('rule', current - 1);
    if (ev.key === 'ArrowRight' && current < RULES.length - 1) go('rule', current + 1);
    if (ev.key === 'Escape') go('index');
  });

  function render() {
    if (view === 'index') renderIndex();
    else renderRule();
    state._last = view === 'rule' ? RULES[current].id : null;
    save();
  }

  setMode(state._mode === 'manual' ? 'manual' : 'automatic');
  render();
})();
</script>
`;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = findRepoRoot(__dirname);
  const types = args.types
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const { rules, stats } = collect({ repoRoot, types });
  const outPath = path.isAbsolute(args.out) ? args.out : path.resolve(repoRoot, args.out);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, renderPage(rules));

  console.log(
    `[generate-rule-review] wrote ${outPath} (${stats.rules} rules, ${stats.cases} fixture cases, ` +
      `${stats.tests} tests, ${stats.disagreements} marker disagreements)`
  );
}

main();
