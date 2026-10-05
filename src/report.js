/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Renders one scan result into a single, self-contained HTML report (no
 * external CSS/JS/fonts -- opens straight from disk, no server, no network).
 *
 * Self-contained single file: hero bar + legend, grouped "worth reviewing"
 * cards with an overflow cap, collapsible "full technical data" with a
 * scorecard + searchable/filterable/paginated table, dark-mode CSS.
 */

const { NORMATIVE_STANDARDS, standardOfEntry } = require('./coverage/standards.js');
const { assertScanResult } = require('./scan-result.js');

// Uses the dataviz skill's validated status palette, mapped 1:1 onto this
// engine's own 4 outcomes.
const STATUS = {
  good: { color: '#0ca30c', bg: '#e9f7e9', icon: '✓' },
  serious: { color: '#c1502e', bg: '#fdece5', icon: '⚠' },
  warning: { color: '#8a6400', bg: '#fdf3d9', icon: 'ℹ' },
  neutral: { color: '#5f6368', bg: '#f1f2f3', icon: '–' }
};

// fail first: a QA tester scanning a report wants violations up front,
// not passes.
const OUTCOME_ORDER = ['fail', 'cantTell', 'pass', 'notApplicable'];
const OUTCOME_STATUS = {
  fail: { status: 'serious', defaultOn: true },
  cantTell: { status: 'warning', defaultOn: true },
  pass: { status: 'good', defaultOn: false },
  notApplicable: { status: 'neutral', defaultOn: false }
};

// Every word on the page comes from the engine's dictionaries (report_*
// keys), so a report reads in the language its scan resolved to and a new
// locale needs no change here. Loaded on first use: rendering a saved result
// should not cost a scan's worth of setup until a report is asked for.
let translator = null;
function getTranslator() {
  if (!translator) translator = require('./core.js').__internal;
  return translator;
}

// The page speaks the locale the scan resolved to when the engine carries
// it. A dictionary the caller supplied at scan time is not in the result, so
// such a report falls back to English labels and marks the findings with
// their own language instead.
function createUi(engine) {
  const core = getTranslator();
  const locale = engine && engine.locale;
  const contentLocale =
    locale && typeof locale.resolved === 'string' && locale.resolved ? locale.resolved : 'en';
  const uiLocale = core.resolveLocale(contentLocale).resolved;

  const tr = (key, params) => core.translate(key, '', params || null, uiLocale);

  let numberFormat;
  try {
    numberFormat = new Intl.NumberFormat(uiLocale);
  } catch {
    numberFormat = new Intl.NumberFormat('en-US');
  }
  const num = (n) => numberFormat.format(Number(n) || 0);

  // Escapes the translated sentence, then puts the numbers back in bold.
  // Dictionaries hold plain text; markup never goes through them.
  function trStrong(key, params) {
    const marked = {};
    const values = [];
    for (const name of Object.keys(params)) {
      marked[name] = `\uE000${values.length}\uE000`;
      values.push(params[name]);
    }
    return esc(tr(key, marked)).replace(
      /\uE000(\d+)\uE000/g,
      (m, i) => `<strong>${num(values[Number(i)])}</strong>`
    );
  }

  const outcomeInfo = {};
  for (const code of OUTCOME_ORDER) {
    outcomeInfo[code] = {
      label: tr(`report_outcome_${code}`),
      defaultOn: OUTCOME_STATUS[code].defaultOn,
      ...STATUS[OUTCOME_STATUS[code].status]
    };
  }

  const severity = (s) => {
    const label = typeof s === 'string' ? tr(`report_severity_${s}`) : '';
    return label || String(s || '');
  };

  // The English text a message key renders to, for telling a translated
  // string from one that fell back to English.
  const english = (key, params) => (key ? core.translate(key, '', params || null, 'en') : null);

  return { tr, trStrong, num, outcomeInfo, severity, uiLocale, contentLocale, english };
}

function esc(s) {
  return String(s == null ? '' : s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
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

function getOccurrenceOutcome(ruleResult, occurrence) {
  const occurrenceOutcome =
    occurrence &&
    (occurrence.occurrenceOutcome === 'fail' || occurrence.occurrenceOutcome === 'cantTell'
      ? occurrence.occurrenceOutcome
      : occurrence.outcome === 'fail' || occurrence.outcome === 'cantTell'
        ? occurrence.outcome
        : null);
  if (occurrenceOutcome) return occurrenceOutcome;
  return (
    ruleResult &&
    (ruleResult.outcome === 'fail' || ruleResult.outcome === 'cantTell' ? ruleResult.outcome : null)
  );
}

function getCardOutcome(ruleResult) {
  if (!ruleResult || !Array.isArray(ruleResult.occurrences)) return ruleResult.outcome;
  let hasCantTell = false;
  for (const occ of ruleResult.occurrences) {
    const outcome = getOccurrenceOutcome(ruleResult, occ);
    if (outcome === 'fail') return 'fail';
    if (outcome === 'cantTell') hasCantTell = true;
  }
  return hasCantTell ? 'cantTell' : ruleResult.outcome;
}

// Same test as src/sarif.js: other standards (EN 301 549, say) and WCAG's
// non-normative documents (`type: 'Understanding'`) share `requirement`
// with a Success Criterion, and chipping them as "WCAG" mislabels or repeats it.
function isWcagCriterion(m) {
  return !!(m && m.requirement && (m.standard == null || m.standard === 'WCAG') && !m.type);
}

// What the scan was tested against, and any opt-in rules it added. A result
// from an engine older than the WCAG-version target carries none of these
// fields and gets no chips.
function renderTargetChips(engine, ui) {
  if (!engine) return '';
  const chips = [];
  if (engine.wcagVersion)
    chips.push(
      `<div><b>WCAG ${esc(engine.wcagVersion)}</b>${esc(ui.tr('report_meta_target'))}</div>`
    );
  if (engine.profile)
    chips.push(`<div><b>${esc(engine.profile)}</b>${esc(ui.tr('report_meta_profile'))}</div>`);
  // Rules beyond the targeted standard ran (engineOptions.optInRules).
  if (Array.isArray(engine.optInRules) && engine.optInRules.length)
    chips.push(
      `<div><b>${esc(engine.optInRules.join(', '))}</b>${esc(ui.tr('report_meta_optInRules'))}</div>`
    );
  return chips.join('\n  ');
}

// The conditions the page was rendered under. A layout-dependent finding
// can come and go with the viewport width, so the report says which width
// it describes; colour scheme and loading fonts change contrast and text
// measurements too. Fonts get a chip only while still loading, the case
// that makes results differ between runs. A result from an older engine has
// no engine.environment and gets no chips.
function renderEnvironmentChips(engine, ui) {
  const env = engine && engine.environment;
  if (!env || typeof env !== 'object') return '';
  if (env.layout === false)
    return `<div><b>${esc(ui.tr('report_meta_noLayout'))}</b>${esc(ui.tr('report_meta_layout'))}</div>`;
  const chips = [];
  const vp = env.viewport;
  if (vp && Number.isFinite(vp.width) && Number.isFinite(vp.height)) {
    const dpr = env.devicePixelRatio;
    const scale = Number.isFinite(dpr) && dpr !== 1 ? ` @${dpr}x` : '';
    chips.push(
      `<div><b>${esc(`${vp.width}\u00d7${vp.height}${scale}`)}</b>${esc(ui.tr('report_meta_viewport'))}</div>`
    );
  }
  if (env.colorScheme)
    chips.push(`<div><b>${esc(env.colorScheme)}</b>${esc(ui.tr('report_meta_colorScheme'))}</div>`);
  if (env.fonts === 'loading')
    chips.push(`<div><b>${esc(env.fonts)}</b>${esc(ui.tr('report_meta_fonts'))}</div>`);
  return chips.join('\n  ');
}

// Locale fallback is per-string and silent in the text itself, so a report
// generated in a locale the engine does not carry reads as a normal English
// one. A result from an older engine has no engine.locale and gets no chip.
function renderLocaleChip(engine, ui) {
  const locale = engine && engine.locale;
  if (!locale || typeof locale.resolved !== 'string' || !locale.resolved) return '';

  const fellBack = locale.requested !== locale.resolved;
  const label = esc(
    fellBack
      ? ui.tr('report_meta_localeRequested', { requested: locale.requested })
      : ui.tr('report_meta_locale')
  );

  return `<div><b>${esc(locale.resolved)}</b>${label}</div>`;
}

// Rule titles, summaries and hints arrive in the scan's locale. When the
// page's own labels are in a different language (a caller-supplied
// dictionary the engine does not carry), those parts are marked with their
// language so a screen reader switches voice for them (WCAG 3.1.2).
const LANG_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;
function contentLang(ui) {
  const lang = ui.contentLocale;
  if (!LANG_TAG.test(lang) || lang.toLowerCase() === ui.uiLocale.toLowerCase()) return '';
  return lang;
}

// The language one string is in: the scan's, unless the dictionary had no
// entry for its key and it came out as the English text, which the English
// page around it already covers. '' when no attribute is needed.
function textLang(ui, text, key, params) {
  const lang = contentLang(ui);
  if (!lang || !text) return '';
  return key && ui.english(key, params) === text ? '' : lang;
}

function langAttr(lang) {
  return lang ? ` lang="${esc(lang)}"` : '';
}

// One plain-language headline + one horizontal stacked bar + a legend with
// icon+label+count (status color is never the only signal) -- the first
// thing a reader sees; exhaustive detail lives in the collapsed
// "full technical data" section further down.
function renderHeroBar(byOutcome, ui) {
  const OUTCOME_INFO = ui.outcomeInfo;
  const total = OUTCOME_ORDER.reduce((sum, c) => sum + byOutcome[c], 0) || 1;
  const applicable = byOutcome.pass + byOutcome.fail + byOutcome.cantTell;

  const segments = OUTCOME_ORDER.filter((c) => byOutcome[c] > 0)
    .map((c) => {
      const n = byOutcome[c];
      const pct = (n / total) * 100;
      const info = OUTCOME_INFO[c];
      return `<div class="hero-bar-seg" style="width:${pct}%; background:${info.color}" title="${esc(info.label)}: ${ui.num(n)} (${pct.toFixed(1)}%)"></div>`;
    })
    .join('');

  const legend = OUTCOME_ORDER.map((c) => {
    const n = byOutcome[c];
    const info = OUTCOME_INFO[c];
    return `<div class="hero-legend-item">
        <span class="hero-legend-swatch" style="background:${info.color}">${info.icon}</span>
        <span class="hero-legend-label">${esc(info.label)}</span>
        <span class="hero-legend-count">${ui.num(n)} (${fmtPct(n, total)})</span>
      </div>`;
  }).join('\n');

  let headline;
  if (byOutcome.fail > 0) {
    headline = ui.trStrong(
      byOutcome.fail === 1 ? 'report_hero_failures_one' : 'report_hero_failures_other',
      { passed: byOutcome.pass, applicable, failed: byOutcome.fail }
    );
  } else if (byOutcome.cantTell > 0) {
    headline = ui.trStrong('report_hero_review', {
      passed: byOutcome.pass,
      applicable,
      review: byOutcome.cantTell
    });
  } else if (applicable > 0) {
    headline = ui.trStrong('report_hero_allPassed', { applicable });
  } else {
    headline = esc(ui.tr('report_hero_none'));
  }

  return `<div class="hero">
    <p class="hero-headline">${headline}</p>
    <div class="hero-bar">${segments}</div>
    <div class="hero-legend">${legend}</div>
  </div>`;
}

function renderScorecard(byOutcome, ui) {
  const OUTCOME_INFO = ui.outcomeInfo;
  const total = OUTCOME_ORDER.reduce((sum, c) => sum + byOutcome[c], 0);
  const tiles = OUTCOME_ORDER.map((c) => {
    const n = byOutcome[c];
    const info = OUTCOME_INFO[c];
    return `<div class="tile" style="border-color:${info.color}; background:${info.bg}">
      <div class="tile-num" style="color:${info.color}">${ui.num(n)}</div>
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
function renderWcagRollup(rulesResults, ui) {
  const OUTCOME_INFO = ui.outcomeInfo;
  if (!Array.isArray(rulesResults) || !rulesResults.length) {
    return `<p class="note">${esc(ui.tr('report_rollup_none'))}</p>`;
  }

  const byLevel = { A: [], AA: [], AAA: [], other: [] };
  for (const r of rulesResults) {
    const mapping =
      (r.meta && Array.isArray(r.meta.normativeMappings) && r.meta.normativeMappings[0]) || null;
    const level = (mapping && mapping.level) || 'other';
    (byLevel[level] || byLevel.other).push({ rule: r, mapping });
  }

  const sections = ['A', 'AA', 'AAA', 'other']
    .filter((level) => byLevel[level].length)
    .map((level) => {
      const rows = byLevel[level]
        .sort((a, b) =>
          (a.mapping ? a.mapping.requirement : '').localeCompare(
            b.mapping ? b.mapping.requirement : '',
            undefined,
            { numeric: true }
          )
        )
        .map(({ rule, mapping }) => {
          const info = OUTCOME_INFO[rule.outcome] || OUTCOME_INFO.notApplicable;
          const metrics = (rule.data && rule.data.details && rule.data.details.metrics) || {};
          const checksIds = (rule.data && rule.data.details && rule.data.details.checksIds) || [];
          const chip = `<span class="chip" style="background:${info.bg};color:${info.color}">${esc(info.label)}</span>`;
          const scLabel = mapping
            ? `WCAG ${esc(mapping.requirement)}`
            : esc(ui.tr('report_rollup_unmapped'));
          // One line per registered standard the row carries, in registry
          // order. A requirement numbered the same in two versions (as EN 301
          // 549 clauses are) is listed once.
          const ruleMappings = (rule.meta && rule.meta.normativeMappings) || [];
          const enLabel = NORMATIVE_STANDARDS.map((standard) => {
            const requirements = Array.from(
              new Set(
                ruleMappings
                  .filter((m) => standardOfEntry(m) === standard)
                  .map((m) => m.requirement)
              )
            );
            return requirements.length
              ? `<br><span class="note">${esc(standard.standard)} ${requirements.map(esc).join(', ')}</span>`
              : '';
          }).join('');
          const metricsLabel = ui.tr('report_rollup_breakdown', {
            pass: ui.num(metrics.passCount),
            fail: ui.num(metrics.failCount),
            review: ui.num(metrics.cantTellCount),
            na: ui.num(metrics.notApplicableCount)
          });
          return `<tr>
            <td class="sc-cell">${scLabel}${enLabel}</td>
            <td${langAttr(textLang(ui, rule.title, rule.i18n && rule.i18n.titleKey))}>${esc(rule.title || rule.ruleId)}</td>
            <td>${chip}</td>
            <td class="note">${esc(metricsLabel)}</td>
            <td class="note">${esc(checksIds.join(', '))}</td>
          </tr>`;
        })
        .join('\n');

      const levelHeading =
        level === 'other'
          ? ui.tr('report_rollup_levelUnmapped')
          : ui.tr('report_rollup_level', { level });
      return `<h3 class="wcag-level-heading">${esc(levelHeading)}</h3>
      <table class="wcag-table">
        <thead><tr><th>${esc(ui.tr('report_rollup_col_sc'))}</th><th>${esc(ui.tr('report_rollup_col_requirement'))}</th><th>${esc(ui.tr('report_col_outcome'))}</th><th>${esc(ui.tr('report_rollup_col_breakdown'))}</th><th>${esc(ui.tr('report_rollup_col_contributing'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    })
    .join('\n');

  return sections;
}

// A registered standard's own rollups (one per requirement, say), present only
// when the scan produced them. `standard.report` supplies the note above the
// table and the language of the titles when it is not the scan's.
function renderStandardRollup(standard, results, ui) {
  const OUTCOME_INFO = ui.outcomeInfo;
  const report = standard.report || {};
  const titleLang = report.titleLang ? ` lang="${esc(report.titleLang)}"` : '';
  const byCriterion = (r) =>
    String((r.data && r.data.details && r.data.details.criterion) || r.ruleId || '');
  const rows = results
    .slice()
    .sort((a, b) => byCriterion(a).localeCompare(byCriterion(b), undefined, { numeric: true }))
    .map((rule) => {
      const info = OUTCOME_INFO[rule.outcome] || OUTCOME_INFO.notApplicable;
      const details = (rule.data && rule.data.details) || {};
      const metrics = details.metrics || {};
      const checksIds = details.checksIds || [];
      const tests = Array.from(
        new Set(
          ((rule.meta && rule.meta.normativeMappings) || [])
            .filter((m) => standardOfEntry(m) === standard)
            .map((m) => m.requirement)
        )
      );
      const chip = `<span class="chip" style="background:${info.bg};color:${info.color}">${esc(info.label)}</span>`;
      const metricsLabel = ui.tr('report_rollup_breakdown', {
        pass: ui.num(metrics.passCount),
        fail: ui.num(metrics.failCount),
        review: ui.num(metrics.cantTellCount),
        na: ui.num(metrics.notApplicableCount)
      });
      return `<tr>
            <td class="sc-cell">${esc(standard.standard)} ${esc(byCriterion(rule))}${tests.length ? `<br><span class="note">${tests.map(esc).join(', ')}</span>` : ''}</td>
            <td${titleLang}>${esc(rule.title || rule.ruleId)}</td>
            <td>${chip}</td>
            <td class="note">${esc(metricsLabel)}</td>
            <td class="note">${esc(checksIds.join(', '))}</td>
          </tr>`;
    })
    .join('\n');
  const note = report.noteKey ? `<p class="note">${esc(ui.tr(report.noteKey))}</p>\n      ` : '';
  return `${note}<table class="wcag-table">
        <thead><tr><th>${esc(ui.tr('report_standardRollup_col_criterion'))}</th><th>${esc(ui.tr('report_rollup_col_requirement'))}</th><th>${esc(ui.tr('report_col_outcome'))}</th><th>${esc(ui.tr('report_rollup_col_breakdown'))}</th><th>${esc(ui.tr('report_rollup_col_contributing'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
}

// How close each measuring rule's closest passing element came to its
// threshold (the results' `margin`), for the "Closest to the limit" table.
// The data keeps one decimal for pixels and the ratio unrounded; people get
// whole pixels, "less than 1 px" under one, and ratios to two decimals.
function renderMargins(result, ui) {
  // Loaded with the translator: src/core/ is not published, core.js is.
  const margins = require('./core.js').getMargins(result);
  if (!margins.length) return '';
  const fixed = (n, digits) => {
    try {
      return new Intl.NumberFormat(ui.uiLocale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(n);
    } catch {
      return Number(n).toFixed(digits);
    }
  };
  const amount = (m, n) => (m.unit === 'px' ? `${ui.num(Math.round(n))} px` : `${fixed(n, 2)}:1`);
  const room = (m) => {
    const smallest = m.unit === 'px' ? 1 : 0.01;
    return m.headroom < smallest
      ? ui.tr('report_margins_room_lessThan', {
          amount: m.unit === 'px' ? `${ui.num(1)} px` : fixed(0.01, 2)
        })
      : m.unit === 'px'
        ? amount(m, m.headroom)
        : fixed(Math.floor(m.headroom * 100) / 100, 2);
  };
  const rows = margins
    .map((m) => {
      const threshold = m.unit === 'px' ? `${ui.num(m.threshold)} px` : `${ui.num(m.threshold)}:1`;
      const limit = ui.tr(
        m.limit === 'max' ? 'report_margins_limit_max' : 'report_margins_limit_min',
        {
          threshold
        }
      );
      return `<tr>
            <td><strong>${esc(m.ruleId)}</strong></td>
            <td>${esc(amount(m, m.value))}</td>
            <td>${esc(limit)}</td>
            <td>${esc(room(m))}</td>
            <td>${m.selector ? `<code>${esc(truncateForCard(m.selector))}</code>` : ''}</td>
          </tr>`;
    })
    .join('\n');
  return `<h2>${esc(ui.tr('report_heading_margins'))}</h2>
  <p class="note">${esc(ui.tr('report_margins_intro'))}</p>
  <table class="wcag-table">
        <thead><tr><th>${esc(ui.tr('report_col_rule'))}</th><th>${esc(ui.tr('report_margins_col_closest'))}</th><th>${esc(ui.tr('report_margins_col_limit'))}</th><th>${esc(ui.tr('report_margins_col_room'))}</th><th>${esc(ui.tr('report_margins_col_element'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
}

// Collapse internal whitespace/newlines and cap length for card display --
// the findings table below shows the untruncated selector and summary. The
// hint is left whole: it is the fix advice, and the table does not repeat it.
const CARD_SNIPPET_MAX = 220;
function truncateForCard(s) {
  const collapsed = String(s || '')
    .replace(/\s+/g, ' ')
    .trim();
  return collapsed.length > CARD_SNIPPET_MAX
    ? `${collapsed.slice(0, CARD_SNIPPET_MAX)}…`
    : collapsed;
}

// One card per rule (not per occurrence) -- a rule with many occurrences of
// the same underlying issue is one thing worth a person's attention, not N.
const MAX_CARDS = 24;

function renderCards(checksResults, ui) {
  const OUTCOME_INFO = ui.outcomeInfo;
  const withIssues = checksResults.filter(
    (r) =>
      Array.isArray(r.occurrences) &&
      r.occurrences.some((occ) => {
        const outcome = getOccurrenceOutcome(r, occ);
        return outcome === 'fail' || outcome === 'cantTell';
      })
  );
  if (!withIssues.length) {
    return `<p class="note">${esc(ui.tr('report_cards_none'))}</p>`;
  }

  const sorted = withIssues.slice().sort((a, b) => {
    const aOutcome = getCardOutcome(a);
    const bOutcome = getCardOutcome(b);
    if (aOutcome !== bOutcome) return aOutcome === 'fail' ? -1 : 1;
    return b.occurrences.length - a.occurrences.length;
  });
  const shown = sorted.slice(0, MAX_CARDS);

  const cards = shown
    .map((r) => {
      const cardOutcome = getCardOutcome(r);
      const info = OUTCOME_INFO[cardOutcome] || OUTCOME_INFO.notApplicable;
      const occurrenceCounts = { fail: 0, cantTell: 0 };
      for (const occ of r.occurrences) {
        const outcome = getOccurrenceOutcome(r, occ);
        if (outcome === 'fail' || outcome === 'cantTell') occurrenceCounts[outcome] += 1;
      }
      const representative =
        r.occurrences.find((occ) => getOccurrenceOutcome(r, occ) === cardOutcome) ||
        r.occurrences[0];
      const occI18n = representative.i18n || {};
      const wcagChips = ((r.meta && r.meta.normativeMappings) || [])
        .filter(isWcagCriterion)
        .map(
          (m) =>
            `<span class="chip" style="background:${STATUS.neutral.bg};color:${STATUS.neutral.color}">WCAG ${esc(m.requirement)}</span>`
        )
        .join('');
      const hasMixedOutcomes = occurrenceCounts.fail > 0 && occurrenceCounts.cantTell > 0;
      const countLabel =
        r.occurrences.length > 1
          ? ` <span class="card-count">× ${ui.num(r.occurrences.length)}${hasMixedOutcomes ? ` ${esc(ui.tr('report_card_mixed', { fail: ui.num(occurrenceCounts.fail), review: ui.num(occurrenceCounts.cantTell) }))}` : ''}</span>`
          : '';

      return `<div class="card">
      <div class="card-head">
        <span class="hero-legend-swatch" style="background:${info.color}">${info.icon}</span>
        <span class="card-title"><strong>${esc(r.ruleId)}</strong> ${esc(ui.tr('report_card_status', { outcome: info.label, severity: ui.severity(r.severity) }))}${countLabel}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">${wcagChips}</div>
        <div class="card-selector"><span class="card-selector-label">${esc(ui.tr('report_card_selector'))}</span> <code>${esc(representative.selector ? truncateForCard(representative.selector) : ui.tr('report_card_noSelector'))}</code></div>
        <div class="card-snippet">${snippetPart(ui, truncateForCard(representative.summary), representative.summary, occI18n.summaryKey, occI18n.params)}${representative.hint ? ` — ${snippetPart(ui, representative.hint, representative.hint, occI18n.hintKey, occI18n.params)}` : ''}</div>
        ${r.occurrences.length > 1 ? `<p class="card-note">${esc(ui.tr('report_card_representative', { count: ui.num(r.occurrences.length) }))}</p>` : ''}
      </div>
    </div>`;
    })
    .join('\n');

  const overflow =
    sorted.length > MAX_CARDS
      ? `<p class="note">${esc(ui.tr('report_cards_overflow', { shown: ui.num(MAX_CARDS), total: ui.num(sorted.length) }))}</p>`
      : '';

  return `<div class="cards">${cards}</div>${overflow}`;
}

// A summary or hint for a card, wrapped in its language when that is not the
// page's. `full` is the untruncated text the key rendered to.
function snippetPart(ui, shown, full, key, params) {
  const lang = textLang(ui, full, key, params);
  return lang ? `<span lang="${esc(lang)}">${esc(shown)}</span>` : esc(shown);
}

// Flatten every occurrence across every rule into one row per occurrence --
// the searchable/filterable/paginated detail view. Rules with zero
// occurrences (pass/notApplicable) have nothing to show at this granularity.
function flattenOccurrences(checksResults, ui) {
  const rows = [];
  for (const r of checksResults) {
    if (!Array.isArray(r.occurrences)) continue;
    for (const occ of r.occurrences) {
      const occurrenceOutcome = getOccurrenceOutcome(r, occ);
      rows.push({
        ruleId: r.ruleId,
        outcome: occurrenceOutcome || r.outcome,
        severity: r.severity,
        severityLabel: ui.severity(r.severity),
        selector: occ.selector || '',
        html: occ.html || '',
        summary: occ.summary || '',
        summaryLang: textLang(
          ui,
          occ.summary,
          occ.i18n && occ.i18n.summaryKey,
          occ.i18n && occ.i18n.params
        ),
        hint: occ.hint || ''
      });
    }
  }
  return rows;
}

function renderHtmlReport(result, options = {}) {
  assertScanResult(result, 'renderHtmlReport');
  const checksResults = Array.isArray(result && result.checksResults) ? result.checksResults : [];
  const allRollups = Array.isArray(result && result.rulesResults) ? result.rulesResults : [];
  // A rollup a registered standard defines for itself carries that standard's
  // name in meta.standard and gets a section of its own after the WCAG one.
  const ownStandard = (r) =>
    (r && r.meta && NORMATIVE_STANDARDS.find((s) => s.standard === r.meta.standard)) || null;
  const rulesResults = allRollups.filter((r) => !ownStandard(r));
  const standardRollups = NORMATIVE_STANDARDS.map((standard) => ({
    standard,
    results: allRollups.filter((r) => ownStandard(r) === standard)
  })).filter((s) => s.results.length);
  const byOutcome = countByOutcome(checksResults);
  const engine = result && result.engine;
  const ui = createUi(engine);
  const OUTCOME_INFO = ui.outcomeInfo;
  // The scan's own timestamp when it has one (engineOptions.timestamp), so
  // the same result always renders the same page; the time of rendering
  // only for a result without one. In UTC either way, so the page does not
  // depend on the machine's time zone.
  const stamped =
    result && typeof result.timestamp === 'string' ? new Date(result.timestamp) : null;
  const when = stamped && !Number.isNaN(stamped.getTime()) ? stamped : new Date();
  const dateFormat = { dateStyle: 'medium', timeStyle: 'long', timeZone: 'UTC' };
  let generatedAtLabel;
  try {
    generatedAtLabel = when.toLocaleString(ui.uiLocale, dateFormat);
  } catch {
    generatedAtLabel = when.toLocaleString('en-US', dateFormat);
  }
  const title = (options && options.title) || ui.tr('report_title_default');

  const defaultOnList = OUTCOME_ORDER.filter((c) => OUTCOME_INFO[c].defaultOn);
  const rows = flattenOccurrences(checksResults, ui);
  const pageLang = LANG_TAG.test(ui.uiLocale) ? ui.uiLocale : 'en';
  // Strings the in-page script needs; it cannot call the translator.
  const clientText = {
    none: ui.tr('report_pager_none'),
    info: ui.tr('report_pager_info')
  };

  return `<!doctype html>
<html lang="${esc(pageLang)}">
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
  <div class="sub">${esc(result && result.url ? result.url : ui.tr('report_noUrl'))} — ${esc(ui.tr('report_generated', { date: generatedAtLabel }))}</div>
</header>

<div class="meta-bar">
  <div><b>${ui.num(checksResults.length)}</b>${esc(ui.tr('report_meta_rulesRun'))}</div>
  <div><b>${ui.num(rows.length)}</b>${esc(ui.tr('report_meta_totalOccurrences'))}</div>
  <div><b>${esc((engine && engine.tag) || '?')}</b>${esc(ui.tr('report_meta_engine'))}</div>
  <div><b>${esc((engine && engine.schemaVersion) || '?')}</b>${esc(ui.tr('report_meta_schemaVersion'))}</div>
  ${renderTargetChips(engine, ui)}
  ${renderEnvironmentChips(engine, ui)}
  ${renderLocaleChip(engine, ui)}
</div>

<main>
  ${renderHeroBar(byOutcome, ui)}

  <h2>${esc(ui.tr('report_heading_worthReviewing'))}</h2>
  ${renderCards(checksResults, ui)}
  ${renderMargins(result, ui)}

  <h2>${esc(ui.tr('report_heading_wcagRollup'))}</h2>
  ${renderWcagRollup(rulesResults, ui)}
${standardRollups
  .map(
    ({ standard, results }) => `
  <h2>${esc(ui.tr('report_heading_standardRollup', { standard: standard.standard }))}</h2>
  ${renderStandardRollup(standard, results, ui)}
`
  )
  .join('')}
  <details class="tech-details">
    <summary>${esc(ui.tr('report_techDetails'))}</summary>
    <div class="tech-body">
      <h2>${esc(ui.tr('report_heading_scorecard'))}</h2>
      ${renderScorecard(byOutcome, ui)}

      <h2>${esc(ui.tr('report_heading_occurrences'))}</h2>
      <div class="filters" id="filters"></div>
      <input type="search" id="search" aria-label="${esc(ui.tr('report_search_placeholder'))}" placeholder="${esc(ui.tr('report_search_placeholder'))}" style="margin-bottom:10px; padding:6px 10px; border:1px solid #ccc; border-radius:5px; font-size:13px; width:100%; max-width:480px;">
      <div style="overflow-x:auto;">
        <table class="findings-table" id="findings-table">
          <thead>
            <tr>
              <th>${esc(ui.tr('report_col_rule'))}</th>
              <th>${esc(ui.tr('report_col_outcome'))}</th>
              <th>${esc(ui.tr('report_col_severity'))}</th>
              <th>${esc(ui.tr('report_col_selector'))}</th>
              <th>${esc(ui.tr('report_col_summary'))}</th>
            </tr>
          </thead>
          <tbody id="findings-body"></tbody>
        </table>
      </div>
      <div class="pager">
        <button id="prev-page">&larr; ${esc(ui.tr('report_pager_prev'))}</button>
        <span id="page-info"></span>
        <button id="next-page">${esc(ui.tr('report_pager_next'))} &rarr;</button>
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
  var TEXT = ${jsonForScript(clientText)};
  var numberFormat = new Intl.NumberFormat(${jsonForScript(ui.uiLocale)});
  function fill(template, values) {
    return template.replace(/\\{\\{(\\w+)\\}\\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(values, k) ? String(values[k]) : m;
    });
  }
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
        '<td>' + esc(r.severityLabel) + '</td>' +
        '<td class="snippet" title="' + esc(r.html) + '">' + esc(r.selector) + '</td>' +
        '<td class="snippet"' + (r.summaryLang ? ' lang="' + esc(r.summaryLang) + '"' : '') + '>' + esc(r.summary) + '</td>' +
        '</tr>';
    }).join('');

    pageInfoEl.textContent = filtered.length === 0
      ? TEXT.none
      : fill(TEXT.info, {
          page: numberFormat.format(page + 1),
          pages: numberFormat.format(totalPages),
          matching: numberFormat.format(filtered.length),
          total: numberFormat.format(rows.length)
        });
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
