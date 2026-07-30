'use strict';

/**
 * Renders one scan result into a single, self-contained HTML report (no
 * external CSS/JS/fonts -- opens straight from disk, no server, no network).
 *
 * Structurally adapted from the sibling cross-engine-diff project's own HTML
 * report tool (~/dev/surea11y/comparisons/cross-engine/render-html-report.js)
 * -- that tool's shell (self-contained single file, hero bar + legend,
 * grouped "worth reviewing" cards with an overflow cap, collapsible
 * "full technical data" with a scorecard + searchable/filterable/paginated
 * table, dark-mode CSS) is generic and reusable; everything here is written
 * fresh for a single-engine scan result, not copied, since that tool's own
 * organizing principle (a 7-way "does surea11y vs the reference engine agree" taxonomy)
 * has no single-engine analog.
 */

// Same 4-status vocabulary/palette as the reference tool (the dataviz
// skill's validated status palette) -- maps 1:1 onto this engine's own
// 4 outcomes, so no new palette is needed.
const STATUS = {
  good: { color: '#0ca30c', bg: '#e9f7e9', icon: '✓' },
  serious: { color: '#c1502e', bg: '#fdece5', icon: '⚠' },
  warning: { color: '#8a6400', bg: '#fdf3d9', icon: 'ℹ' },
  neutral: { color: '#5f6368', bg: '#f1f2f3', icon: '–' }
};

// fail first: a QA tester scanning a report wants violations up front,
// matching the reference engine-html-reporter/accessibility-insights-report's own convention
// of leading with violations, not passes.
const OUTCOME_ORDER = ['fail', 'cantTell', 'pass', 'notApplicable'];
const OUTCOME_INFO = {
  fail: { label: 'Fail', status: 'serious', defaultOn: true },
  cantTell: { label: 'Needs review', status: 'warning', defaultOn: true },
  pass: { label: 'Pass', status: 'good', defaultOn: false },
  notApplicable: { label: 'Not applicable', status: 'neutral', defaultOn: false }
};
for (const code of OUTCOME_ORDER) {
  Object.assign(OUTCOME_INFO[code], STATUS[OUTCOME_INFO[code].status]);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Neutralizes '<' so embedded JSON can never break out of its <script> tag,
// even if an occurrence's own html snippet literally contains "</script>".
function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function fmtPct(n, total) {
  return total ? `${((n / total) * 100).toFixed(1)}%` : '0.0%';
}

function countByOutcome(checksResults) {
  const counts = { pass: 0, fail: 0, cantTell: 0, notApplicable: 0 };
  for (const r of checksResults) {
    if (Object.prototype.hasOwnProperty.call(counts, r.outcome)) counts[r.outcome] += 1;
  }
  return counts;
}

// One plain-language headline + one horizontal stacked bar + a legend with
// icon+label+count (status color is never the only signal) -- the first
// thing a reader sees; exhaustive detail lives in the collapsed
// "full technical data" section further down.
function renderHeroBar(byOutcome) {
  const total = OUTCOME_ORDER.reduce((sum, c) => sum + byOutcome[c], 0) || 1;
  const applicable = byOutcome.pass + byOutcome.fail + byOutcome.cantTell;

  const segments = OUTCOME_ORDER
    .filter((c) => byOutcome[c] > 0)
    .map((c) => {
      const n = byOutcome[c];
      const pct = (n / total) * 100;
      const info = OUTCOME_INFO[c];
      return `<div class="hero-bar-seg" style="width:${pct}%; background:${info.color}" title="${esc(info.label)}: ${n.toLocaleString()} (${pct.toFixed(1)}%)"></div>`;
    })
    .join('');

  const legend = OUTCOME_ORDER
    .map((c) => {
      const n = byOutcome[c];
      const info = OUTCOME_INFO[c];
      return `<div class="hero-legend-item">
        <span class="hero-legend-swatch" style="background:${info.color}">${info.icon}</span>
        <span class="hero-legend-label">${esc(info.label)}</span>
        <span class="hero-legend-count">${n.toLocaleString()} (${fmtPct(n, total)})</span>
      </div>`;
    })
    .join('\n');

  let headline;
  if (byOutcome.fail > 0) {
    headline = `<strong>${byOutcome.pass.toLocaleString()}</strong> of <strong>${applicable.toLocaleString()}</strong> applicable checks passed. <strong>${byOutcome.fail.toLocaleString()}</strong> failure${byOutcome.fail === 1 ? '' : 's'} need${byOutcome.fail === 1 ? 's' : ''} attention below.`;
  } else if (byOutcome.cantTell > 0) {
    headline = `<strong>${byOutcome.pass.toLocaleString()}</strong> of <strong>${applicable.toLocaleString()}</strong> applicable checks passed, with <strong>${byOutcome.cantTell.toLocaleString()}</strong> needing manual review.`;
  } else if (applicable > 0) {
    headline = `All <strong>${applicable.toLocaleString()}</strong> applicable checks passed.`;
  } else {
    headline = 'No applicable checks ran for this scan.';
  }

  return `<div class="hero">
    <p class="hero-headline">${headline}</p>
    <div class="hero-bar">${segments}</div>
    <div class="hero-legend">${legend}</div>
  </div>`;
}

function renderScorecard(byOutcome) {
  const total = OUTCOME_ORDER.reduce((sum, c) => sum + byOutcome[c], 0);
  const tiles = OUTCOME_ORDER.map((c) => {
    const n = byOutcome[c];
    const info = OUTCOME_INFO[c];
    return `<div class="tile" style="border-color:${info.color}; background:${info.bg}">
      <div class="tile-num" style="color:${info.color}">${n.toLocaleString()}</div>
      <div class="tile-pct">${fmtPct(n, total)}</div>
      <div class="tile-label">${esc(info.label)}</div>
    </div>`;
  }).join('\n');
  return `<div class="scorecard">${tiles}</div>`;
}

// WCAG rollup -- straight from the engine's own rulesResults (one composite
// entry per Success Criterion, docs/WCAG_CONFORMANCE.md), not an invented
// grouping. Grouped by conformance level (A / AA / AAA) since that's the
// axis a compliance-minded reader actually cares about.
function renderWcagRollup(rulesResults) {
  if (!Array.isArray(rulesResults) || !rulesResults.length) {
    return '<p class="note">No WCAG composite rollups available for this scan (composite rules were excluded via runOnly/engineOptions).</p>';
  }

  const byLevel = { A: [], AA: [], AAA: [], other: [] };
  for (const r of rulesResults) {
    const mapping = (r.meta && Array.isArray(r.meta.normativeMappings) && r.meta.normativeMappings[0]) || null;
    const level = (mapping && mapping.level) || 'other';
    (byLevel[level] || byLevel.other).push({ rule: r, mapping });
  }

  const sections = ['A', 'AA', 'AAA', 'other']
    .filter((level) => byLevel[level].length)
    .map((level) => {
      const rows = byLevel[level]
        .sort((a, b) => (a.mapping ? a.mapping.requirement : '').localeCompare(b.mapping ? b.mapping.requirement : '', undefined, { numeric: true }))
        .map(({ rule, mapping }) => {
          const info = OUTCOME_INFO[rule.outcome] || OUTCOME_INFO.notApplicable;
          const metrics = (rule.data && rule.data.details && rule.data.details.metrics) || {};
          const checksIds = (rule.data && rule.data.details && rule.data.details.checksIds) || [];
          const chip = `<span class="chip" style="background:${info.bg};color:${info.color}">${esc(info.label)}</span>`;
          const scLabel = mapping ? `WCAG ${esc(mapping.requirement)}` : 'WCAG (unmapped)';
          const metricsLabel = `${metrics.passCount || 0} pass / ${metrics.failCount || 0} fail / ${metrics.cantTellCount || 0} needs review / ${metrics.notApplicableCount || 0} n/a`;
          return `<tr>
            <td class="sc-cell">${scLabel}</td>
            <td>${esc(rule.title || rule.ruleId)}</td>
            <td>${chip}</td>
            <td class="note">${esc(metricsLabel)}</td>
            <td class="note">${esc(checksIds.join(', '))}</td>
          </tr>`;
        })
        .join('\n');

      return `<h3 class="wcag-level-heading">Level ${level === 'other' ? '(unmapped)' : level}</h3>
      <table class="wcag-table">
        <thead><tr><th>SC</th><th>Requirement</th><th>Outcome</th><th>Breakdown</th><th>Contributing rules</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    })
    .join('\n');

  return sections;
}

// Collapse internal whitespace/newlines and cap length for card display --
// the findings table below shows the untruncated value.
const CARD_SNIPPET_MAX = 220;
function truncateForCard(s) {
  const collapsed = String(s || '').replace(/\s+/g, ' ').trim();
  return collapsed.length > CARD_SNIPPET_MAX ? `${collapsed.slice(0, CARD_SNIPPET_MAX)}…` : collapsed;
}

// One card per rule (not per occurrence) -- a rule with many occurrences of
// the same underlying issue is one thing worth a person's attention, not N.
const MAX_CARDS = 24;

function renderCards(checksResults) {
  const withIssues = checksResults.filter((r) => (r.outcome === 'fail' || r.outcome === 'cantTell') && Array.isArray(r.occurrences) && r.occurrences.length > 0);
  if (!withIssues.length) {
    return '<p class="note">No fail/cantTell rules with occurrences on this scan.</p>';
  }

  const sorted = withIssues.slice().sort((a, b) => {
    if (a.outcome !== b.outcome) return a.outcome === 'fail' ? -1 : 1;
    return b.occurrences.length - a.occurrences.length;
  });
  const shown = sorted.slice(0, MAX_CARDS);

  const cards = shown.map((r) => {
    const info = OUTCOME_INFO[r.outcome];
    const occ = r.occurrences[0];
    const wcagChips = ((r.meta && r.meta.normativeMappings) || [])
      .map((m) => `<span class="chip" style="background:${STATUS.neutral.bg};color:${STATUS.neutral.color}">WCAG ${esc(m.requirement)}</span>`)
      .join('');
    const countLabel = r.occurrences.length > 1 ? ` <span class="card-count">× ${r.occurrences.length.toLocaleString()}</span>` : '';

    return `<div class="card">
      <div class="card-head">
        <span class="hero-legend-swatch" style="background:${info.color}">${info.icon}</span>
        <span class="card-title"><strong>${esc(r.ruleId)}</strong> (${esc(info.label)}, ${esc(r.severity)})${countLabel}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">${wcagChips}</div>
        <div class="card-selector"><span class="card-selector-label">Selector:</span> <code>${esc(occ.selector || '(none)')}</code></div>
        <div class="card-snippet">${esc(occ.summary)}${occ.hint ? ` — ${esc(occ.hint)}` : ''}</div>
        ${r.occurrences.length > 1 ? `<p class="card-note">Selector/summary above are from one representative occurrence — ${r.occurrences.length.toLocaleString()} total on this rule.</p>` : ''}
      </div>
    </div>`;
  }).join('\n');

  const overflow = sorted.length > MAX_CARDS
    ? `<p class="note">Showing the ${MAX_CARDS} highest-priority rules of ${sorted.length.toLocaleString()} with issues — see the full technical data below for the rest.</p>`
    : '';

  return `<div class="cards">${cards}</div>${overflow}`;
}

// Flatten every occurrence across every rule into one row per occurrence --
// the searchable/filterable/paginated detail view. Rules with zero
// occurrences (pass/notApplicable) have nothing to show at this granularity.
function flattenOccurrences(checksResults) {
  const rows = [];
  for (const r of checksResults) {
    if (!Array.isArray(r.occurrences)) continue;
    for (const occ of r.occurrences) {
      rows.push({
        ruleId: r.ruleId,
        outcome: r.outcome,
        severity: r.severity,
        selector: occ.selector || '',
        html: occ.html || '',
        summary: occ.summary || '',
        hint: occ.hint || ''
      });
    }
  }
  return rows;
}

function renderHtmlReport(result, options = {}) {
  const checksResults = Array.isArray(result && result.checksResults) ? result.checksResults : [];
  const rulesResults = Array.isArray(result && result.rulesResults) ? result.rulesResults : [];
  const byOutcome = countByOutcome(checksResults);
  const generatedAtLabel = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' });
  const title = (options && options.title) || 'surea11y scan report';

  const defaultOnList = OUTCOME_ORDER.filter((c) => OUTCOME_INFO[c].defaultOn);
  const rows = flattenOccurrences(checksResults);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)} — ${esc(generatedAtLabel)}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0 0 48px; background: #fafafa; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) {
    body { background: #16181c; color: #e6e6e6; }
    .tile, .wcag-table, .findings-table, .hero, .card, details { background: #1f2227 !important; border-color: #3a3d44 !important; }
    .wcag-table th, .findings-table th { background: #262a30 !important; color: #e6e6e6 !important; }
    a { color: #7db6ff; }
    input, select { background: #1f2227; color: #e6e6e6; border-color: #3a3d44; }
    .meta-bar { background: #1f2227 !important; border-color: #3a3d44 !important; }
    .hero-bar { background: #2a2d33; }
    summary { color: #e6e6e6 !important; }
  }
  header { padding: 24px 32px; background: #202531; color: #fff; }
  header h1 { margin: 0 0 4px; font-size: 22px; }
  header .sub { opacity: 0.8; font-size: 13px; }
  .meta-bar { display: flex; flex-wrap: wrap; gap: 24px; padding: 12px 32px; background: #fff; border-bottom: 1px solid #ddd; font-size: 13px; }
  .meta-bar b { display: block; font-size: 15px; }
  main { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
  h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; margin: 32px 0 12px; }
  h3.wcag-level-heading { font-size: 14px; margin: 20px 0 8px; }

  .hero { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px; }
  .hero-headline { font-size: 17px; margin: 0 0 16px; line-height: 1.5; }
  .hero-bar { display: flex; height: 22px; border-radius: 6px; overflow: hidden; background: #eee; }
  .hero-bar-seg { height: 100%; }
  .hero-bar-seg:not(:last-child) { border-right: 2px solid #fff; }
  @media (prefers-color-scheme: dark) { .hero-bar-seg:not(:last-child) { border-right-color: #16181c; } }
  .hero-legend { display: flex; flex-wrap: wrap; gap: 14px 24px; margin-top: 16px; }
  .hero-legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .hero-legend-swatch { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 5px; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .hero-legend-count { opacity: 0.65; font-variant-numeric: tabular-nums; }

  .cards { display: grid; gap: 10px; margin-bottom: 8px; }
  .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 14px; background: #fff; }
  .card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .card-title { font-size: 13.5px; }
  .card-count { font-weight: 700; opacity: 0.65; font-variant-numeric: tabular-nums; }
  .card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
  .card-selector { font-size: 12px; margin-bottom: 6px; word-break: break-all; }
  .card-selector-label { opacity: 0.65; margin-right: 4px; }
  .card-selector code { font-family: ui-monospace, monospace; background: #f0f0f2; border-radius: 4px; padding: 1px 5px; user-select: all; }
  @media (prefers-color-scheme: dark) { .card-selector code { background: #2a2d33 !important; } }
  .card-snippet { font-family: ui-monospace, monospace; font-size: 11.5px; background: #f7f7f8; border-radius: 5px; padding: 6px 8px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
  @media (prefers-color-scheme: dark) { .card-snippet { background: #262a30 !important; } }
  .card-note { font-size: 11px; opacity: 0.6; margin: 6px 0 0; }

  details.tech-details { border: 1px solid #e0e0e0; border-radius: 8px; margin-top: 8px; }
  details.tech-details summary { padding: 14px 18px; cursor: pointer; font-weight: 600; font-size: 14px; color: #333; list-style: none; }
  details.tech-details summary::-webkit-details-marker { display: none; }
  details.tech-details summary::before { content: '▶'; display: inline-block; margin-right: 8px; font-size: 11px; transition: transform 0.15s; }
  details.tech-details[open] summary::before { transform: rotate(90deg); }
  details.tech-details > .tech-body { padding: 0 18px 20px; }

  .scorecard { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
  .tile { border: 1.5px solid; border-radius: 8px; padding: 12px 14px; }
  .tile-num { font-size: 24px; font-weight: 700; line-height: 1.1; }
  .tile-pct { font-size: 12px; opacity: 0.75; }
  .tile-label { font-size: 12.5px; margin-top: 4px; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; font-size: 12.5px; }
  .wcag-table, .findings-table { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
  .wcag-table th, .wcag-table td, .findings-table th, .findings-table td { padding: 5px 8px; border-bottom: 1px solid #eee; text-align: left; }
  .wcag-table th, .findings-table th { background: #f2f2f4; position: sticky; top: 0; font-size: 11px; }
  .sc-cell { font-family: ui-monospace, monospace; font-size: 11.5px; white-space: nowrap; }
  .filters { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; margin-bottom: 12px; }
  .filters label { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; cursor: pointer; user-select: none; }
  .chip { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10.5px; font-weight: 700; white-space: nowrap; }
  .findings-table td.snippet { font-family: ui-monospace, monospace; font-size: 11px; max-width: 320px; overflow-x: auto; white-space: pre; }
  .pager { display: flex; gap: 10px; align-items: center; margin-top: 10px; font-size: 13px; }
  .pager button { padding: 5px 12px; border: 1px solid #ccc; background: #fff; border-radius: 5px; cursor: pointer; }
  .pager button:disabled { opacity: 0.4; cursor: default; }
  .note { font-size: 12.5px; opacity: 0.75; margin-top: 6px; }
</style>
</head>
<body>

<header>
  <h1>${esc(title)}</h1>
  <div class="sub">${esc(result && result.url ? result.url : '(no url)')} — generated ${esc(generatedAtLabel)}</div>
</header>

<div class="meta-bar">
  <div><b>${checksResults.length}</b>rules run</div>
  <div><b>${rows.length}</b>total occurrences</div>
  <div><b>${esc((result && result.engine && result.engine.tag) || '?')}</b>engine</div>
  <div><b>${esc((result && result.engine && result.engine.schemaVersion) || '?')}</b>schema version</div>
</div>

<main>
  ${renderHeroBar(byOutcome)}

  <h2>Worth reviewing</h2>
  ${renderCards(checksResults)}

  <h2>WCAG rollup</h2>
  ${renderWcagRollup(rulesResults)}

  <details class="tech-details">
    <summary>Full technical data — scorecard, searchable occurrence browser</summary>
    <div class="tech-body">
      <h2>Scorecard</h2>
      ${renderScorecard(byOutcome)}

      <h2>Occurrences</h2>
      <div class="filters" id="filters"></div>
      <input type="search" id="search" placeholder="Search rule id / selector / html…" style="margin-bottom:10px; padding:6px 10px; border:1px solid #ccc; border-radius:5px; font-size:13px; width:100%; max-width:480px;">
      <div style="overflow-x:auto;">
        <table class="findings-table" id="findings-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Outcome</th>
              <th>Severity</th>
              <th>Selector</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody id="findings-body"></tbody>
        </table>
      </div>
      <div class="pager">
        <button id="prev-page">&larr; Prev</button>
        <span id="page-info"></span>
        <button id="next-page">Next &rarr;</button>
      </div>
    </div>
  </details>
</main>

<script type="application/json" id="report-data">${jsonForScript(rows)}</script>
<script>
(function () {
  var OUTCOME_INFO = ${jsonForScript(OUTCOME_INFO)};
  var ORDER = ${jsonForScript(OUTCOME_ORDER)};
  var DEFAULT_ON = ${jsonForScript(defaultOnList)};
  var rows = JSON.parse(document.getElementById('report-data').textContent);

  var PAGE_SIZE = 100;
  var page = 0;
  var active = {};
  DEFAULT_ON.forEach(function (c) { active[c] = true; });

  var filtersEl = document.getElementById('filters');
  ORDER.forEach(function (c) {
    var info = OUTCOME_INFO[c];
    var id = 'chk-' + c;
    var label = document.createElement('label');
    var checked = DEFAULT_ON.indexOf(c) !== -1;
    label.innerHTML = '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '> ' +
      '<span class="chip" style="background:' + info.bg + ';color:' + info.color + '">' + c + '</span>';
    filtersEl.appendChild(label);
    label.querySelector('input').addEventListener('change', function (e) {
      active[c] = e.target.checked;
      page = 0;
      render();
    });
  });

  var searchEl = document.getElementById('search');
  var bodyEl = document.getElementById('findings-body');
  var pageInfoEl = document.getElementById('page-info');
  var prevBtn = document.getElementById('prev-page');
  var nextBtn = document.getElementById('next-page');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function matches(r, q) {
    if (!active[r.outcome]) return false;
    if (!q) return true;
    var hay = (r.ruleId + ' ' + r.selector + ' ' + r.html + ' ' + r.summary).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function render() {
    var q = searchEl.value.trim().toLowerCase();
    var filtered = rows.filter(function (r) { return matches(r, q); });
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page >= totalPages) page = totalPages - 1;
    if (page < 0) page = 0;

    var slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    bodyEl.innerHTML = slice.map(function (r) {
      var info = OUTCOME_INFO[r.outcome];
      var chip = '<span class="chip" style="background:' + info.bg + ';color:' + info.color + '">' + r.outcome + '</span>';
      return '<tr>' +
        '<td class="snippet">' + esc(r.ruleId) + '</td>' +
        '<td>' + chip + '</td>' +
        '<td>' + esc(r.severity) + '</td>' +
        '<td class="snippet" title="' + esc(r.html) + '">' + esc(r.selector) + '</td>' +
        '<td class="snippet">' + esc(r.summary) + '</td>' +
        '</tr>';
    }).join('');

    pageInfoEl.textContent = filtered.length === 0
      ? 'No matching occurrences'
      : ('Page ' + (page + 1) + ' / ' + totalPages + '  (' + filtered.length.toLocaleString() + ' matching, ' + rows.length.toLocaleString() + ' total)');
    prevBtn.disabled = page <= 0;
    nextBtn.disabled = page >= totalPages - 1;
  }

  searchEl.addEventListener('input', function () { page = 0; render(); });
  prevBtn.addEventListener('click', function () { page--; render(); });
  nextBtn.addEventListener('click', function () { page++; render(); });

  render();
})();
</script>
</body>
</html>`;
}

module.exports = { renderHtmlReport };
