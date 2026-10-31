/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Renders procedures (docs/PROCEDURES.md) as a document a person reads or
 * works through: what listProcedures, procedureChecklist or proceduresFor
 * gives, as one self-contained HTML page (no external CSS, script, font or
 * network) or as Markdown.
 *
 * - A list is a reference: every requirement in the standard's groups, each
 *   facet with its procedure, what passes and what fails, the tools it needs
 *   and the rules that test it.
 * - A checklist is a worksheet: each procedure once, and, in HTML, a result
 *   and notes per item that the page keeps in the browser and downloads as
 *   JSON or CSV, with each requirement's result rolled up from its items.
 *
 * The page's own words are the procedures dictionaries' render_* keys, in
 * the locale the procedures were read in. Text only English has (facet
 * labels, criteria's titles, a pack's own procedures, a general procedure
 * not yet translated) is marked lang="en" on a page in another language, as
 * WCAG 3.1.2 asks. The same input always gives the same page: nothing in it
 * depends on the time or the machine.
 *
 * No file system and no engine: it runs in Node and in a browser bundle,
 * with the dictionaries passed in, as proceduresFrom does.
 */

const { esc, withoutControls } = require('./html-text.js');
const { reader } = require('./procedures-text.js');
const { ownRulesOf, prefixOfKey, withPackReview } = require('./pack-review.js');
const RULES = require('./procedures/rules.json');

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const AUTOMATION = ['full', 'partial', 'manual'];
const OUTCOMES = ['open', 'pass', 'fail', 'notApplicable'];

// What the input is: a checklist, a list, or one requirement (made a list of
// one). Anything else is a mistake in the call.
function kindOf(input) {
  if (isObject(input) && Array.isArray(input.items)) return 'checklist';
  if (isObject(input) && Array.isArray(input.requirements)) return 'list';
  if (isObject(input) && Array.isArray(input.facets)) return 'requirement';
  return null;
}

// The page's words, from the dictionaries: render_* keys with {{name}}
// filled in. A key no dictionary has reads as itself, which a test keeps
// from happening.
function wordsOf(read) {
  return (key, params) => {
    let text = read.text(key);
    if (text === null) return key;
    for (const [name, value] of Object.entries(params || {})) {
      text = text.split(`{{${name}}}`).join(String(value));
    }
    return text;
  };
}

// The rules' prefixes, core's and the packs', for the keys of their steps.
function prefixesOf(packs) {
  const out = {};
  for (const [id, rule] of Object.entries(RULES)) if (rule && rule.prefix) out[id] = rule.prefix;
  for (const pack of Array.isArray(packs) ? packs : []) {
    for (const rule of ownRulesOf(pack)) {
      const meta = isObject(rule.meta) ? rule.meta : {};
      const prefix = prefixOfKey(isObject(meta.i18n) ? meta.i18n.titleKey : null);
      if (prefix) out[rule.id] = prefix;
    }
  }
  return out;
}

// The language a pack's standard titles its requirements in (its
// report.titleLang), where the packs are given; null otherwise.
function titleLangOf(input, packs) {
  for (const pack of Array.isArray(packs) ? packs : []) {
    const st = isObject(pack) && isObject(pack.standard) ? pack.standard : null;
    if (!st || (st.key !== input.key && st.standard !== input.standard)) continue;
    const lang = isObject(st.report) ? st.report.titleLang : null;
    return typeof lang === 'string' && lang ? lang : null;
  }
  return null;
}

// An id for the page: letters, digits, '-' and '_', unique in it.
function idMaker() {
  const used = new Set();
  return (prefix, value) => {
    const base = `${prefix}-${String(value).replace(/[^A-Za-z0-9_-]+/g, '-')}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
}

// Everything a page needs to know, from the input and the options, for both
// formats: its words and title, where each text comes from, and the
// requirements or items in their groups.
function model(dictionaries, input, options) {
  const kind = kindOf(input);
  if (!kind) {
    throw new TypeError(
      'renderProcedures: pass what listProcedures, procedureChecklist or proceduresFor gives'
    );
  }
  const data =
    kind === 'requirement'
      ? {
          standard: input.standard,
          ...(input.key ? { key: input.key } : {}),
          version: input.version || null,
          locale: null,
          scope: null,
          requirements: [input],
          groups: []
        }
      : input;
  const read = reader(withPackReview(dictionaries, options.packs), options.locale || data.locale);
  const t = wordsOf(read);
  const lang = read.localeOf('render_title_list') || 'en';
  const prefixes = prefixesOf(options.packs);
  const wcagData = data.standard === 'wcag';
  const best = data.standard === 'best-practice';
  const titleLang = wcagData || best ? 'en' : titleLangOf(data, options.packs);

  const standardName = wcagData
    ? ['WCAG', data.version].filter(Boolean).join(' ')
    : best
      ? t('render_standard_bestPractice')
      : [data.standard, data.version].filter(Boolean).join(' ');
  // One requirement is named with its standard: "WCAG 1.4.12 Text Spacing".
  const single = kind === 'requirement' ? input : null;
  const requirementName = single
    ? best
      ? standardName
      : [wcagData ? 'WCAG' : data.standard, single.id, single.title].filter(Boolean).join(' ')
    : null;
  const title =
    typeof options.title === 'string' && options.title.trim()
      ? options.title.trim()
      : single
        ? t('render_title_requirement', { requirement: requirementName })
        : t(kind === 'checklist' ? 'render_title_checklist' : 'render_title_list', {
            standard: standardName
          });

  // The language of a general procedure's text: the dictionary it was read
  // from for core's, English for a pack's own or a replacement.
  const procedureLang = (criterion, facet, packOwn) => {
    if (packOwn) return 'en';
    const stem = best ? `best-practice_${facet}_` : `wcag_${criterion}_${facet}_`;
    return read.localeOf(`${stem}step1`) || 'en';
  };
  const variantLang = (v) => {
    const prefix = prefixes[v.ruleId];
    return (prefix && read.localeOf(`${prefix}_review_${v.reasonCode}_step1`)) || 'en';
  };
  const toolsOf = (tools) =>
    (Array.isArray(tools) ? tools : []).map((tool) => ({
      label: tool.label,
      lang: read.localeOf(`tool_${tool.id}`) || 'en'
    }));

  const scope = isObject(data.scope) ? data.scope : {};
  const scopeLines = [];
  if (Array.isArray(scope.levels) && scope.levels.length) {
    scopeLines.push(t('render_scope_levels', { levels: scope.levels.join(', ') }));
  }
  if (Array.isArray(scope.tools)) {
    const labels = scope.tools.map((id) => read.text(`tool_${id}`) || id);
    scopeLines.push(t('render_scope_tools', { tools: labels.join(', ') }));
  }
  if (Array.isArray(scope.automation)) {
    const labels = scope.automation
      .filter((a) => AUTOMATION.includes(a))
      .map((a) => t(`render_automation_${a}`));
    scopeLines.push(t('render_scope_automation', { automation: labels.join(', ') }));
  }
  if (Array.isArray(scope.rules)) {
    scopeLines.push(t('render_scope_rules', { rules: scope.rules.join(', ') }));
  }

  return {
    kind,
    data,
    t,
    lang,
    title,
    standardName,
    titleLang,
    wcagData,
    best,
    procedureLang,
    variantLang,
    toolsOf,
    scopeLines
  };
}

// The groups, each with what belongs in it (`place(group)` gives that), and
// a last one for what no group holds, so nothing is left out.
function placed(groups, ids, otherTitle) {
  const seen = new Set();
  const walk = (list) =>
    (Array.isArray(list) ? list : []).map((g) => {
      const own = (Array.isArray(g.requirements) ? g.requirements : []).filter((id) =>
        ids.includes(id)
      );
      own.forEach((id) => seen.add(id));
      return { id: String(g.id), title: g.title, own, groups: walk(g.groups) };
    });
  const tree = walk(groups);
  const rest = ids.filter((id) => !seen.has(id));
  if (rest.length) {
    if (tree.length)
      tree.push({ id: 'other', title: otherTitle, own: rest, groups: [], other: true });
    else return [{ id: null, title: null, own: rest, groups: [] }];
  }
  return tree;
}

// ---------------------------------------------------------------- HTML --

const STYLE = `
  :root { color-scheme: light dark; --fg: #1a1a1a; --muted: #555b63; --bg: #fafafa; --card: #fff; --line: #dcdfe3; --soft: #f2f3f5; --accent: #1a5fb4; }
  @media (prefers-color-scheme: dark) {
    :root { --fg: #e6e6e6; --muted: #b0b4ba; --bg: #16181c; --card: #1f2227; --line: #3a3d44; --soft: #262a30; --accent: #7db6ff; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0 0 48px; font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: var(--bg); color: var(--fg); }
  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .skip { position: absolute; left: 8px; top: -60px; padding: 8px 12px; background: var(--card); color: var(--fg); border: 2px solid var(--accent); border-radius: 6px; z-index: 2; }
  .skip:focus { top: 8px; }
  .vh { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  header.page { padding: 24px 32px; background: #202531; color: #fff; }
  header.page h1 { margin: 0 0 6px; font-size: 24px; line-height: 1.3; }
  header.page p, header.page ul { margin: 4px 0 0; color: #e8eaed; font-size: 14px; }
  header.page ul { padding-left: 20px; }
  .layout { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
  nav.toc { margin: 24px 0; padding: 16px 20px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
  nav.toc h2 { margin: 0 0 8px; font-size: 16px; }
  nav.toc ol { margin: 0; padding-left: 0; list-style: none; }
  nav.toc ol ol { padding-left: 20px; }
  nav.toc li { margin: 2px 0; }
  main h2, main h3, main h4, main h5, main h6 { line-height: 1.35; }
  section.group > h2 { font-size: 21px; margin: 36px 0 12px; padding-bottom: 6px; border-bottom: 2px solid var(--line); }
  section.group section.group > :is(h3, h4) { font-size: 17px; margin: 24px 0 10px; }
  .num { font-variant-numeric: tabular-nums; }
  .req, .item { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px 20px; margin: 12px 0; }
  .req > :is(h2, h3, h4, h5, h6), .item > :is(h2, h3, h4, h5, h6) { font-size: 17px; margin: 0 0 8px; }
  .meta { margin: 0 0 10px; color: var(--muted); font-size: 13.5px; }
  .meta span + span::before { content: " · "; }
  .facet { border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px; }
  .facet > :is(h3, h4, h5, h6) { font-size: 15.5px; margin: 0 0 6px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; padding: 0; list-style: none; font-size: 12.5px; }
  .badge { display: inline-block; padding: 2px 9px; border-radius: 999px; border: 1px solid var(--line); background: var(--soft); }
  .badge.auto-full { background: #e9f7e9; color: #0b5d0b; border-color: #9fd09f; }
  .badge.auto-partial { background: #fdf3d9; color: #6b4d00; border-color: #e5c66b; }
  .badge.auto-manual { background: #eaf1fb; color: #174a8b; border-color: #a9c4ea; }
  .badge.level { font-weight: 600; }
  ol.steps { margin: 6px 0 10px; padding-left: 24px; }
  ol.steps li { margin: 4px 0; }
  dl.verdict { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 8px 0; }
  dl.verdict dt { font-weight: 600; }
  dl.verdict dd { margin: 0; }
  .rules, .covers, .note { font-size: 13.5px; color: var(--muted); margin: 6px 0 0; }
  .rules code, .covers code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; background: var(--soft); padding: 1px 5px; border-radius: 4px; color: var(--fg); }
  details.variants { margin-top: 10px; font-size: 14px; }
  details.variants summary { cursor: pointer; color: var(--accent); }
  details.variants .variant { margin: 8px 0 0 4px; padding-left: 12px; border-left: 3px solid var(--line); }
  .results { margin: 24px 0; padding: 14px 20px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
  details.technical { margin-top: 8px; font-size: 13.5px; color: var(--muted); }
  details.technical summary { cursor: pointer; color: var(--accent); }
  .results h2 { margin: 0 0 4px; font-size: 16px; }
  .results p { margin: 2px 0; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  button { font: inherit; font-size: 14px; padding: 6px 14px; border-radius: 6px; border: 1px solid var(--line); background: var(--soft); color: var(--fg); cursor: pointer; }
  button[data-armed] { border-color: #b0441f; color: #b0441f; }
  fieldset.record { margin: 12px 0 0; padding: 10px 14px; border: 1px solid var(--line); border-radius: 8px; }
  fieldset.record legend { font-weight: 600; padding: 0 4px; }
  .choices { display: flex; flex-wrap: wrap; gap: 6px 18px; }
  .choices label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
  .choices input { width: 18px; height: 18px; margin: 0; }
  fieldset.record label.notes { display: block; margin: 10px 0 4px; font-weight: 600; }
  textarea { width: 100%; min-height: 3.2em; font: inherit; padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--card); color: var(--fg); }
  .item[data-outcome="pass"] { border-left: 6px solid #0b7d0b; }
  .item[data-outcome="fail"] { border-left: 6px solid #b0441f; }
  .item[data-outcome="notApplicable"] { border-left: 6px solid #5f6368; }
  .empty { font-style: italic; }
  @media (forced-colors: active) {
    .badge, .req, .item, nav.toc, .results, fieldset.record { border: 1px solid CanvasText; }
    .item[data-outcome] { border-left-width: 6px; }
  }
  @media print {
    body { background: #fff; color: #000; font-size: 11pt; }
    .skip, nav.toc, .actions, .results .note { display: none; }
    header.page { background: none; color: #000; padding: 0 0 12px; border-bottom: 2px solid #000; }
    header.page p, header.page ul { color: #000; }
    .layout { padding: 0; max-width: none; }
    details.technical { display: none; }
    .req, .item { break-inside: avoid; border-color: #999; }
    details.variants { display: none; }
    textarea { border: 1px solid #999; min-height: 2.4em; }
  }
  @media (max-width: 640px) {
    header.page, .layout { padding-left: 16px; padding-right: 16px; }
    dl.verdict { grid-template-columns: 1fr; }
  }
`;

// The in-page script of a worksheet: each item's result and notes, kept in
// the browser (localStorage, where it is allowed), counted, and downloaded
// as JSON or CSV with each requirement's result rolled up from its items: it
// fails where an item fails, is open where one is still open, does not apply
// where none applies, and passes otherwise.
const SCRIPT = `
(function () {
  var root = document.querySelector('[data-record]');
  if (!root) return;
  var storeKey = 'surea11y-procedures:' + root.getAttribute('data-record');
  var text = JSON.parse(document.getElementById('record-text').textContent);
  var items = Array.prototype.slice.call(document.querySelectorAll('.item[data-key]'));
  var store = {};
  try { store = JSON.parse(window.localStorage.getItem(storeKey) || '{}') || {}; } catch (e) { store = {}; }
  function save() { try { window.localStorage.setItem(storeKey, JSON.stringify(store)); } catch (e) {} }
  function fill(template, values) {
    return template.replace(/\\{\\{(\\w+)\\}\\}/g, function (m, name) { return values[name] != null ? values[name] : m; });
  }
  function stateOf(item) {
    var checked = item.querySelector('input[type=radio]:checked');
    var notes = item.querySelector('textarea');
    return { outcome: checked ? checked.value : 'open', notes: notes ? notes.value : '' };
  }
  var status = document.getElementById('record-progress');
  function update() {
    var n = { open: 0, pass: 0, fail: 0, notApplicable: 0 };
    items.forEach(function (item) {
      var s = stateOf(item);
      n[s.outcome] = (n[s.outcome] || 0) + 1;
      if (s.outcome === 'open') item.removeAttribute('data-outcome');
      else item.setAttribute('data-outcome', s.outcome);
    });
    status.textContent = fill(text.progress, {
      done: items.length - n.open, total: items.length, pass: n.pass, fail: n.fail, notApplicable: n.notApplicable
    });
  }
  items.forEach(function (item) {
    var key = item.getAttribute('data-key');
    var saved = store[key];
    if (saved) {
      var radio = item.querySelector('input[type=radio][value="' + saved.outcome + '"]');
      if (radio) radio.checked = true;
      var notes = item.querySelector('textarea');
      if (notes && typeof saved.notes === 'string') notes.value = saved.notes;
    }
    function changed() {
      var s = stateOf(item);
      if (s.outcome === 'open' && !s.notes) delete store[key]; else store[key] = s;
      save();
      update();
    }
    item.addEventListener('change', changed);
    item.addEventListener('input', changed);
  });
  function results() {
    var rows = items.map(function (item) {
      var s = stateOf(item);
      return {
        key: item.getAttribute('data-key'),
        facet: item.getAttribute('data-facet'),
        label: item.getAttribute('data-label'),
        requirements: JSON.parse(item.getAttribute('data-requirements')),
        outcome: s.outcome,
        notes: s.notes
      };
    });
    var order = [];
    var by = {};
    rows.forEach(function (row) {
      row.requirements.forEach(function (id) {
        if (!by[id]) { by[id] = []; order.push(id); }
        by[id].push(row.outcome);
      });
    });
    var requirements = order.map(function (id) {
      var o = by[id];
      var outcome = o.indexOf('fail') >= 0 ? 'fail' : o.indexOf('open') >= 0 ? 'open'
        : o.every(function (x) { return x === 'notApplicable'; }) ? 'notApplicable' : 'pass';
      return { id: id, outcome: outcome };
    });
    return {
      title: text.title, standard: text.standard, key: text.key, version: text.version,
      exportedAt: new Date().toISOString(), items: rows, requirements: requirements
    };
  }
  function download(name, type, body) {
    var url = URL.createObjectURL(new Blob([body], { type: type }));
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
  var base = text.file;
  document.getElementById('record-json').addEventListener('click', function () {
    download(base + '.json', 'application/json', JSON.stringify(results(), null, 2) + '\\n');
  });
  document.getElementById('record-csv').addEventListener('click', function () {
    var r = results();
    var lines = [['key', 'facet', 'label', 'requirements', 'outcome', 'notes'].map(csvCell).join(',')];
    r.items.forEach(function (i) {
      lines.push([i.key, i.facet, i.label, i.requirements.join(' '), i.outcome, i.notes].map(csvCell).join(','));
    });
    download(base + '.csv', 'text/csv', '\\ufeff' + lines.join('\\r\\n') + '\\r\\n');
  });
  var clear = document.getElementById('record-clear');
  var clearLabel = clear.textContent;
  function disarm() { clear.removeAttribute('data-armed'); clear.textContent = clearLabel; }
  clear.addEventListener('click', function () {
    if (!clear.hasAttribute('data-armed')) {
      clear.setAttribute('data-armed', '');
      clear.textContent = text.clearConfirm;
      return;
    }
    store = {};
    save();
    items.forEach(function (item) {
      var open = item.querySelector('input[type=radio][value=open]');
      if (open) open.checked = true;
      var notes = item.querySelector('textarea');
      if (notes) notes.value = '';
    });
    disarm();
    update();
  });
  clear.addEventListener('blur', disarm);
  update();
})();
`;

function renderHtml(m, options) {
  const { t, data, kind } = m;
  const pageLang = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/.test(m.lang) ? m.lang : 'en';
  const langAttr = (lang) => (lang && lang !== pageLang ? ` lang="${esc(lang)}"` : '');
  const id = idMaker();
  const record = kind === 'checklist' && options.record !== false && !options.fragment;
  const variants = options.variants === true;
  const heading = (level) => `h${Math.min(6, Math.max(2, level))}`;

  const toolsBadges = (tools) => {
    const list = m.toolsOf(tools);
    const items = list.length
      ? list.map((x) => `<span${langAttr(x.lang)}>${esc(x.label)}</span>`).join(', ')
      : esc(t('render_tools_browser'));
    return `<li class="badge">${esc(t('render_tools', { tools: '\uE000' })).replace('\uE000', items)}</li>`;
  };
  const automationBadge = (a) =>
    AUTOMATION.includes(a)
      ? `<li class="badge auto-${a}">${esc(t(`render_automation_${a}`))}</li>`
      : '';
  const codeList = (ids) => ids.map((r) => `<code>${esc(r)}</code>`).join(', ');
  const labelled = (key, inner) => esc(t(key, { value: '\uE000' })).replace('\uE000', inner);

  const procedureHtml = (procedure, lang) =>
    procedure
      ? `<ol class="steps"${langAttr(lang)}>${procedure.steps
          .map((s) => `<li>${esc(s)}</li>`)
          .join('')}</ol>
<dl class="verdict"><dt>${esc(t('render_passWhen'))}</dt><dd${langAttr(lang)}>${esc(
          procedure.passWhen
        )}</dd><dt>${esc(t('render_failWhen'))}</dt><dd${langAttr(lang)}>${esc(
          procedure.failWhen
        )}</dd></dl>`
      : `<p class="empty">${esc(t('render_noProcedure'))}</p>`;

  const variantsHtml = (facet) => {
    if (!variants || !Array.isArray(facet.variants) || !facet.variants.length) return '';
    const parts = facet.variants.map((v) => {
      const lang = m.variantLang(v);
      return `<div class="variant"><p><code>${esc(v.ruleId)}</code>, <code>${esc(
        v.reasonCode
      )}</code></p>${procedureHtml(v, lang)}</div>`;
    });
    return `<details class="variants"><summary>${esc(
      t('render_variants', { count: facet.variants.length })
    )}</summary>${parts.join('')}</details>`;
  };

  // A requirement of a list, with its facets: a technology facet is named
  // under the facet whose procedure assesses it.
  const requirementHtml = (r, level) => {
    const hid = id('req', r.id);
    const own = !m.wcagData && !m.best && !r.wcag;
    const meta = [];
    if (r.level) meta.push(`<span>${esc(t('render_level', { level: r.level }))}</span>`);
    if (r.wcag) meta.push(`<span>${esc(t('render_restates', { criterion: r.wcag }))}</span>`);
    if (Array.isArray(r.relatesTo) && r.relatesTo.length) {
      meta.push(`<span>${esc(t('render_relatesTo', { criteria: r.relatesTo.join(', ') }))}</span>`);
    }
    const facets = r.facets
      .filter((f) => !f.coveredBy || !r.facets.some((x) => x.id === f.coveredBy))
      .map((f) => {
        const fid = id('facet', `${r.id}-${f.id}`);
        const covered = r.facets.filter((x) => x.coveredBy === f.id);
        const lang = m.procedureLang(r.wcag || r.id, f.id, own || !!f.procedureFrom);
        const extra = [];
        if (f.procedureFrom) {
          extra.push(
            `<p class="note">${esc(t('render_procedureFrom', { pack: f.procedureFrom }))}</p>`
          );
        }
        const rules = f.rules
          .concat(covered.flatMap((x) => x.rules))
          .filter((x, i, a) => a.indexOf(x) === i);
        if (rules.length)
          extra.push(`<p class="rules">${labelled('render_rules', codeList(rules))}</p>`);
        if (covered.length) {
          extra.push(
            `<div class="covers"><p>${esc(t('render_covers'))}</p><ul${langAttr('en')}>${covered
              .map((x) => `<li>${esc(x.label)}</li>`)
              .join('')}</ul></div>`
          );
        }
        return `<section class="facet" aria-labelledby="${fid}">
<${heading(level + 1)} id="${fid}"${langAttr('en')}>${esc(f.label)}</${heading(level + 1)}>
<ul class="badges">${automationBadge(f.automation)}${f.procedure ? toolsBadges(f.tools) : ''}</ul>
${procedureHtml(f.procedure, lang)}
${extra.join('\n')}${variantsHtml(f)}
</section>`;
      });
    return `<article class="req" id="${id('r', r.id)}" aria-labelledby="${hid}">
<${heading(level)} id="${hid}"><span class="num">${esc(r.id)}</span> ${
      r.title ? `<span${langAttr(m.titleLang)}>${esc(r.title)}</span>` : ''
    }</${heading(level)}>
${meta.length ? `<p class="meta">${meta.join('')}</p>` : ''}
${facets.join('\n')}
</article>`;
  };

  let n = 0;
  // An item of a checklist, with its result and notes in a worksheet.
  const itemHtml = (item, level) => {
    n += 1;
    const hid = id('item', item.key);
    const own = !item.wcag && !m.best;
    const lang = m.procedureLang(item.wcag, item.facet, own || !!item.procedureFrom);
    const meta = [
      `<span>${esc(t('render_serves', { requirements: item.requirements.join(', ') }))}</span>`
    ];
    const extra = [];
    if (item.procedureFrom) {
      extra.push(
        `<p class="note">${esc(t('render_procedureFrom', { pack: item.procedureFrom }))}</p>`
      );
    }
    // The rules and facets behind an item are for whoever joins it to a
    // scan, not for the person doing the check: closed until asked for.
    const technical = [];
    if (item.rules.length) {
      technical.push(`<p class="rules">${labelled('render_rules', codeList(item.rules))}</p>`);
    }
    if (item.covers.length) {
      technical.push(
        `<p class="covers">${labelled('render_coversIds', codeList(item.covers))}</p>`
      );
    }
    if (technical.length) {
      extra.push(
        `<details class="technical"><summary>${esc(t('render_technical'))}</summary>${technical.join('')}</details>`
      );
    }
    const recordHtml = record
      ? `<fieldset class="record"><legend>${esc(t('render_result'))}<span class="vh">: </span><span class="vh"${langAttr(
          'en'
        )}>${esc(item.label)}</span></legend>
<div class="choices">${OUTCOMES.map(
          (o) =>
            `<label><input type="radio" name="o-${n}" value="${o}"${o === 'open' ? ' checked' : ''}> ${esc(
              t(`render_outcome_${o}`)
            )}</label>`
        ).join('')}</div>
<label class="notes" for="notes-${n}">${esc(t('render_notes'))}<span class="vh">: </span><span class="vh"${langAttr(
          'en'
        )}>${esc(item.label)}</span></label>
<textarea id="notes-${n}" rows="2"></textarea>
</fieldset>`
      : '';
    return `<article class="item" id="${id('i', item.key)}" aria-labelledby="${hid}" data-key="${esc(
      item.key
    )}" data-facet="${esc(item.facet)}" data-label="${esc(item.label)}" data-requirements="${esc(
      JSON.stringify(item.requirements)
    )}">
<${heading(level)} id="${hid}"${langAttr('en')}>${esc(item.label)}</${heading(level)}>
<p class="meta">${meta.join('')}</p>
<ul class="badges">${automationBadge(item.automation)}${toolsBadges(item.tools)}</ul>
${procedureHtml(item.procedure, lang)}
${extra.join('\n')}
${recordHtml}
</article>`;
  };

  // What a group holds: a list's requirements, or a checklist's items whose
  // first requirement it holds.
  const units = kind === 'checklist' ? data.items : data.requirements;
  const unitIds =
    kind === 'checklist' ? units.map((i) => i.requirements[0]) : units.map((r) => r.id);
  const tree = placed(data.groups, [...new Set(unitIds)], t('render_other'));
  const unitsOf = (ids) =>
    kind === 'checklist'
      ? units.filter((i) => ids.includes(i.requirements[0]))
      : units.filter((r) => ids.includes(r.id));
  const renderUnit = (u, level) =>
    kind === 'checklist' ? itemHtml(u, level) : requirementHtml(u, level);

  // Each group's heading id, given once, for its section and the contents.
  const named = (groups) =>
    groups.map((g) => ({ ...g, hid: id('g', g.id || 'all'), groups: named(g.groups) }));
  const groups = named(tree);
  const groupHtml = (g, level) => {
    const gid = g.hid;
    const inner = unitsOf(g.own)
      .map((u) => renderUnit(u, level + 1))
      .concat(g.groups.map((x) => groupHtml(x, level + 1)))
      .join('\n');
    return `<section class="group" aria-labelledby="${gid}">
<${heading(level)} id="${gid}">${g.other ? '' : `<span class="num">${esc(g.id)}</span> `}<span${
      g.other ? '' : langAttr(m.titleLang)
    }>${esc(g.title)}</span></${heading(level)}>
${inner}
</section>`;
  };
  const tocOf = (list) =>
    `<ol>${list
      .map(
        (g) =>
          `<li><a href="#${g.hid}">${g.other ? '' : `${esc(g.id)} `}<span${
            g.other ? '' : langAttr(m.titleLang)
          }>${esc(g.title)}</span></a>${g.groups.length ? tocOf(g.groups) : ''}</li>`
      )
      .join('')}</ol>`;

  // Without groups, the requirements or items follow one another, with no
  // contents to list.
  const flat = groups.length === 1 && groups[0].id === null;
  const body = !units.length
    ? `<p class="empty">${esc(t('render_empty'))}</p>`
    : flat
      ? unitsOf(groups[0].own)
          .map((u) => renderUnit(u, 2))
          .join('\n')
      : groups.map((g) => groupHtml(g, 2)).join('\n');
  const toc =
    units.length && !flat
      ? `<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">${esc(
          t('render_contents')
        )}</h2>${tocOf(groups)}</nav>`
      : '';

  const summary =
    kind === 'checklist'
      ? t('render_summary_checklist', {
          items: data.items.length,
          requirements: new Set(data.items.flatMap((i) => i.requirements)).size
        })
      : t('render_summary_list', {
          requirements: data.requirements.length,
          procedures: data.requirements.reduce(
            (sum, r) => sum + r.facets.filter((f) => f.procedure).length,
            0
          )
        });
  const headerHtml = `<header class="page">
<h1>${esc(m.title)}</h1>
<p>${esc(summary)}</p>
${m.scopeLines.length ? `<ul>${m.scopeLines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
</header>`;

  const recordKey = [data.key || data.standard, data.version, m.title].join('|');
  const resultsHtml = record
    ? `<section class="results" aria-labelledby="results-h" data-record="${esc(recordKey)}">
<h2 id="results-h">${esc(t('render_results'))}</h2>
<p id="record-progress" role="status">${esc(
        t('render_progress', {
          done: 0,
          total: data.items.length,
          pass: 0,
          fail: 0,
          notApplicable: 0
        })
      )}</p>
<p class="note">${esc(t('render_saved'))}</p>
<noscript><p class="note">${esc(t('render_noscript'))}</p></noscript>
<div class="actions"><button type="button" id="record-json">${esc(
        t('render_export_json')
      )}</button><button type="button" id="record-csv">${esc(
        t('render_export_csv')
      )}</button><button type="button" id="record-clear">${esc(t('render_clear'))}</button></div>
</section>`
    : '';

  // A fragment goes in someone else's page, which has its own main region.
  const [open, close] = options.fragment
    ? ['<div class="procedures-main">', '</div>']
    : ['<main id="main" tabindex="-1">', '</main>'];
  const content = `${headerHtml}
<div class="layout">
${toc}
${open}
${resultsHtml}
${body}
${close}
</div>`;

  if (options.fragment) {
    return `<div class="surea11y-procedures" lang="${esc(pageLang)}">
${content}
</div>
`;
  }

  const fileName =
    `${data.key || data.standard}-${data.version || 'procedures'}`.replace(
      /[^A-Za-z0-9._-]+/g,
      '-'
    ) + (kind === 'checklist' ? '-results' : '');
  const recordText = record
    ? `<script type="application/json" id="record-text">${JSON.stringify({
        progress: t('render_progress'),
        clearConfirm: t('render_clear_confirm'),
        title: m.title,
        standard: data.standard,
        key: data.key || null,
        version: data.version || null,
        file: fileName
      }).replace(/</g, '\\u003c')}</script>
<script>${SCRIPT}</script>`
    : '';

  return `<!doctype html>
<html lang="${esc(pageLang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="@surea11y/core">
<title>${esc(m.title)}</title>
<style>${STYLE}</style>
</head>
<body>
<a class="skip" href="#main">${esc(t('render_skip'))}</a>
${content}
${recordText}
</body>
</html>
`;
}

// ------------------------------------------------------------ Markdown --

// Text for Markdown: the characters that would start markup escaped, and the
// ones a page leaves out left out, so a pack's text shows as written.
function md(s) {
  return withoutControls(String(s == null ? '' : s))
    .replace(/\r?\n/g, ' ')
    .replace(/[\\`*_[\]<>|#]/g, '\\$&');
}

function renderMarkdown(m, options) {
  const { t, data, kind } = m;
  const variants = options.variants === true;
  const h = (level, text) => `${'#'.repeat(Math.min(6, level))} ${text}`;
  const out = [h(1, md(m.title)), ''];
  const summary =
    kind === 'checklist'
      ? t('render_summary_checklist', {
          items: data.items.length,
          requirements: new Set(data.items.flatMap((i) => i.requirements)).size
        })
      : t('render_summary_list', {
          requirements: data.requirements.length,
          procedures: data.requirements.reduce(
            (sum, r) => sum + r.facets.filter((f) => f.procedure).length,
            0
          )
        });
  out.push(md(summary), '');
  if (m.scopeLines.length) out.push(...m.scopeLines.map((l) => `- ${md(l)}`), '');

  const tools = (list) => {
    const labels = m.toolsOf(list).map((x) => x.label);
    return t('render_tools', {
      tools: labels.length ? labels.join(', ') : t('render_tools_browser')
    });
  };
  const steps = (procedure, indent) => {
    if (!procedure) return [`${indent}*${md(t('render_noProcedure'))}*`, ''];
    return [
      ...procedure.steps.map((s, i) => `${indent}${i + 1}. ${md(s)}`),
      '',
      `${indent}**${md(t('render_passWhen'))}:** ${md(procedure.passWhen)}`,
      '',
      `${indent}**${md(t('render_failWhen'))}:** ${md(procedure.failWhen)}`,
      ''
    ];
  };
  const code = (ids) => ids.map((x) => `\`${String(x).replace(/`/g, '')}\``).join(', ');
  // A sentence of the page's words around Markdown of our own.
  const around = (key, inner) => md(t(key, { value: '\uE000' })).replace('\uE000', inner);

  const requirementMd = (r, level) => {
    const lines = [h(level, `${md(r.id)}${r.title ? ` ${md(r.title)}` : ''}`), ''];
    const meta = [];
    if (r.level) meta.push(t('render_level', { level: r.level }));
    if (r.wcag) meta.push(t('render_restates', { criterion: r.wcag }));
    if (Array.isArray(r.relatesTo) && r.relatesTo.length) {
      meta.push(t('render_relatesTo', { criteria: r.relatesTo.join(', ') }));
    }
    if (meta.length) lines.push(`*${meta.map(md).join(' · ')}*`, '');
    for (const f of r.facets) {
      if (f.coveredBy && r.facets.some((x) => x.id === f.coveredBy)) continue;
      const covered = r.facets.filter((x) => x.coveredBy === f.id);
      lines.push(h(level + 1, md(f.label)), '');
      const badges = [
        AUTOMATION.includes(f.automation) ? t(`render_automation_${f.automation}`) : null
      ];
      if (f.procedure) badges.push(tools(f.tools));
      if (f.procedureFrom) badges.push(t('render_procedureFrom', { pack: f.procedureFrom }));
      lines.push(`*${badges.filter(Boolean).map(md).join(' · ')}*`, '');
      lines.push(...steps(f.procedure, ''));
      const rules = f.rules
        .concat(covered.flatMap((x) => x.rules))
        .filter((x, i, a) => a.indexOf(x) === i);
      if (rules.length) lines.push(around('render_rules', code(rules)), '');
      if (covered.length) {
        lines.push(md(t('render_covers')), '', ...covered.map((x) => `- ${md(x.label)}`), '');
      }
      if (variants && Array.isArray(f.variants) && f.variants.length) {
        lines.push(`**${md(t('render_variants', { count: f.variants.length }))}**`, '');
        for (const v of f.variants) {
          lines.push(`- ${code([v.ruleId, v.reasonCode])}`, '', ...steps(v, '  '));
        }
      }
    }
    return lines;
  };

  const itemMd = (item) => {
    const badges = [
      t('render_serves', { requirements: item.requirements.join(', ') }),
      AUTOMATION.includes(item.automation) ? t(`render_automation_${item.automation}`) : null,
      tools(item.tools),
      item.procedureFrom ? t('render_procedureFrom', { pack: item.procedureFrom }) : null
    ];
    const lines = [
      `- [ ] **${md(item.label)}**`,
      '',
      `  *${badges.filter(Boolean).map(md).join(' · ')}*`,
      ''
    ];
    lines.push(...steps(item.procedure, '  '));
    if (item.rules.length) lines.push(`  ${around('render_rules', code(item.rules))}`, '');
    if (item.covers.length) lines.push(`  ${around('render_coversIds', code(item.covers))}`, '');
    return lines;
  };

  const units = kind === 'checklist' ? data.items : data.requirements;
  const unitIds =
    kind === 'checklist' ? units.map((i) => i.requirements[0]) : units.map((r) => r.id);
  const tree = placed(data.groups, [...new Set(unitIds)], t('render_other'));
  const unitsOf = (ids) =>
    kind === 'checklist'
      ? units.filter((i) => ids.includes(i.requirements[0]))
      : units.filter((r) => ids.includes(r.id));
  const unitMd = (u, level) => (kind === 'checklist' ? itemMd(u) : requirementMd(u, level));
  const groupMd = (g, level) => {
    const lines = [];
    if (g.id !== null)
      lines.push(h(level, g.other ? md(g.title) : `${md(g.id)} ${md(g.title)}`), '');
    for (const u of unitsOf(g.own)) lines.push(...unitMd(u, g.id !== null ? level + 1 : level));
    for (const x of g.groups) lines.push(...groupMd(x, level + 1));
    return lines;
  };
  if (!units.length) out.push(`*${md(t('render_empty'))}*`, '');
  else for (const g of tree) out.push(...groupMd(g, 2));
  while (out.length && out[out.length - 1] === '') out.pop();
  return `${out.join('\n')}\n`;
}

/**
 * Procedures as a document (docs/PROCEDURES.md#rendering-them): what
 * listProceduresFrom, procedureChecklistFrom or proceduresFrom gives, as an
 * HTML page (options.format 'html', the default) or Markdown ('markdown'),
 * its words read from the dictionaries given, in options.locale or the
 * locale the procedures were read in. options.title replaces the default
 * title; options.variants: true adds, under each facet of a list, the steps
 * a scan's undecided finding gives; a checklist page records results unless
 * options.record is false; options.fragment: true gives the page's content
 * alone, with no document, style or script, to put in a page of one's own;
 * options.packs, the packs the procedures were read with, marks the
 * language of their text. Throws a TypeError for any other input or format.
 */
function renderProceduresFrom(dictionaries, input, options) {
  const opts = isObject(options) ? options : {};
  const format = opts.format === undefined ? 'html' : opts.format;
  if (format !== 'html' && format !== 'markdown') {
    throw new TypeError(
      `renderProcedures: format must be 'html' or 'markdown', not ${JSON.stringify(format)}`
    );
  }
  const m = model(dictionaries, input, opts);
  return format === 'markdown' ? renderMarkdown(m, opts) : renderHtml(m, opts);
}

module.exports = { renderProceduresFrom };
