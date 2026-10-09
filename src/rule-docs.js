/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The rule docs core generates for its rules, for any set of rules: a pack's
 * as well as core's (scripts/generate-rule-catalog.js, generate-rule-
 * examples-coverage.js and generate-rule-examples-outcomes.js for core;
 * `surea11y-pack docs`, src/pack-docs.js, for a pack).
 *
 * - The rule catalog (RULE_CATALOG.md): a row per rule from the engine's own
 *   catalog, with the prose of each rule's source header (@applicability,
 *   @expectation, @reports).
 * - The examples (RULE_EXAMPLES.md), hand-written: which rules have none,
 *   and which examples give another outcome than their label says, each kept
 *   as a record that can only change on purpose.
 */

const fs = require('node:fs');
const path = require('node:path');
const { WCAG_CRITERIA } = require('./coverage/wcag-criteria.js');

// --- the rule catalog ---------------------------------------------------------

function levelFromTags(tags) {
  const t = Array.isArray(tags) ? tags : [];
  // A rule's level tag carries a version prefix matching the SC it belongs to
  // (wcag2* for WCAG 2.0 baseline, wcag21*/wcag22* for SCs introduced in 2.1/2.2 --
  // see src/coverage/wcag-version-map.js) -- never more than one prefix per rule,
  // so checking all three is safe and matches dom-runner.js's own synonym handling.
  if (t.includes('wcag2aaa') || t.includes('wcag21aaa') || t.includes('wcag22aaa')) return 'AAA';
  if (t.includes('wcag2aa') || t.includes('wcag21aa') || t.includes('wcag22aa')) return 'AA';
  if (t.includes('wcag2a') || t.includes('wcag21a') || t.includes('wcag22a')) return 'A';
  return '';
}

// Each criterion's own level, in the order of the WCAG SC column, so a rule
// mapped to 2.4.7 (AA) and 4.1.2 (A) reads "AA, A", not just its highest
// level. One level for all of them is written once. A criterion the table
// does not have takes the rule's level tag.
function levelsOf(wcagSc, tags) {
  const scs = Array.isArray(wcagSc) ? wcagSc : [];
  if (!scs.length) return levelFromTags(tags);
  const levels = scs.map((sc) => {
    const c = WCAG_CRITERIA.find((x) => x.sc === String(sc).trim());
    const l = c && (c.levels['2.2'] || c.levels['2.1'] || c.levels['2.0']);
    return l || levelFromTags(tags) || '—';
  });
  return new Set(levels).size === 1 ? levels[0] : levels.join(', ');
}

// Several rule titles and their prose legitimately contain literal HTML
// element names (<area>, <canvas>, <th>, <caption>, etc.), and left
// unescaped, a markdown-to-HTML renderer (GitHub, VS Code's preview, any
// HTML-aware viewer) parses them as real tags, not text. <th>/<caption> are
// the worst case: real table-structural elements nested inside a <td>, which
// can visibly corrupt the surrounding row.
// Outside code spans only: inside backticks markdown shows `<dt>` as it is,
// and would show an escape as the literal text `&lt;dt&gt;`.
function escapeAngles(s) {
  return String(s == null ? '' : s)
    .split(/(`[^`\n]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('');
}

// Same, plus the `|` cell delimiter, for text going into a markdown table.
// A backslash is escaped first, so one already before a `|` cannot undo it.
function escapePipes(s) {
  return escapeAngles(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

function listRuleFiles(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const full = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) out.push(...listRuleFiles(full));
    else if (ent.isFile() && ent.name.endsWith('.js') && !ent.name.endsWith('.test.js'))
      out.push(full);
  }
  return out;
}

// Captures a tag's body, whether it starts on the tag line or the line after,
// up to the next tag or the end of the comment. Anchored at the start of a
// comment line, so an "@expectation" mentioned mid-sentence is not mistaken
// for the tag itself.
function jsdocTag(source, tag) {
  const start = new RegExp(`^[ \\t]*\\*[ \\t]*@${tag}\\b[ \\t]*(.*)$`, 'm').exec(source);
  if (!start) return '';

  const lines = [start[1]];

  for (const line of source
    .slice(start.index + start[0].length)
    .split('\n')
    .slice(1)) {
    // A tag starts at the comment's own column (`* @tag`); a wrapped line of
    // prose is indented past it, and may start with `@` (`@implementation-
    // notes` named mid-sentence) without ending the tag.
    if (/^[ \t]*\*[ \t]?@\w/.test(line) || /\*\//.test(line)) break;
    lines.push(line.replace(/^[ \t]*\*[ \t]?/, ''));
  }

  return reflow(lines);
}

// Rule prose is hard-wrapped to fit the source file, so continuation lines are
// joined back into the paragraph or list item they belong to. A line indented
// past the bullet above it continues that item; one that is not ends the list.
function reflow(lines) {
  const body = lines.filter((l) => l.trim());
  if (!body.length) return '';

  const indentOf = (l) => l.match(/^ */)[0].length;
  const isBullet = (l) => /^ *- /.test(l);

  const bullets = body.filter(isBullet);
  const bulletBase = bullets.length ? Math.min(...bullets.map(indentOf)) : 0;

  const items = [];
  let openItem = -1;

  for (const line of body) {
    const indent = indentOf(line);
    const text = line.trim();

    if (isBullet(line)) {
      items.push({ text: ' '.repeat(Math.max(0, indent - bulletBase)) + text, bullet: true });
      openItem = indent;
    } else if (openItem >= 0 && indent > openItem) {
      items[items.length - 1].text += ' ' + text;
    } else if (openItem >= 0) {
      items.push({ text, bullet: false });
      openItem = -1;
    } else if (items.length) {
      items[items.length - 1].text += ' ' + text;
    } else {
      items.push({ text, bullet: false });
    }
  }

  // Blank lines everywhere except between the items of one list, which stays
  // tight.
  const out = [];
  for (let i = 0; i < items.length; i++) {
    if (i && (!items[i].bullet || !items[i - 1].bullet)) out.push('');
    out.push(items[i].text);
  }

  return out.join('\n');
}

// The per-rule prose (@applicability/@expectation/@reports) lives only in each rule
// module's header comment. normalizeRuleMeta never copies it into meta, so
// the compiled catalog reports both as empty strings. Read it from source,
// keyed by the id the module actually exports.
function readRuleProse(rulesDir) {
  const prose = new Map();

  for (const file of listRuleFiles(rulesDir)) {
    let mod;
    try {
      mod = require(file);
    } catch {
      continue;
    }
    // A rule, or a variant of one (its own header documents it).
    const isRule = mod && (typeof mod.runInPage === 'function' || typeof mod.from === 'string');
    if (!isRule || typeof mod.id !== 'string') continue;

    const source = fs.readFileSync(file, 'utf8');
    prose.set(mod.id, {
      applicability: jsdocTag(source, 'applicability'),
      expectation: jsdocTag(source, 'expectation'),
      reports: jsdocTag(source, 'reports')
    });
  }

  return prose;
}

// One catalog's rows: the catalog entries (getChecksCatalog()) of the rules
// it holds, with the prose of their source headers, sorted by id.
function catalogRows(catalog, ids, prose) {
  return catalog
    .filter((r) => ids.has(r.ruleId))
    .map((r) => ({
      ruleId: r.ruleId,
      title: r.title,
      description: r.description || '',
      type: r.type,
      wcagSc: Array.isArray(r.wcagSc) ? r.wcagSc.join(', ') : '',
      level: levelsOf(r.wcagSc, r.tags),
      confidence: r.defaultConfidence,
      severity: r.defaultSeverity,
      applicability: (prose.get(r.ruleId) || {}).applicability || '',
      expectation: (prose.get(r.ruleId) || {}).expectation || '',
      reports: (prose.get(r.ruleId) || {}).reports || '',
      margin: r.margin || null
    }))
    .sort((a, b) => a.ruleId.localeCompare(b.ruleId));
}

const REGENERATE =
  'Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change.';

// One catalog: the rules in rows; composites, core's only. coreDocs is the
// path (or URL) from the catalog's folder to core's docs, for the links. A
// pack's catalog gives its own intro, the command that regenerates it, and
// its standard's or checklist's rollups ({ id, title, checksIds }).
function renderCatalog(
  rows,
  composites,
  { isCore, name, coreDocs, intro: introText, regenerate = REGENERATE, rollups = [], profiles = [] }
) {
  const automatic = rows.filter((r) => r.type === 'automatic');
  const manual = rows.filter((r) => r.type === 'manual');
  const withSc = rows.filter((r) => r.wcagSc);
  const withProse = rows.filter((r) => r.applicability || r.expectation);
  const proseNote =
    withProse.length === rows.length
      ? 'what it applies to and what it expects'
      : `and, for the ${withProse.length} rules whose source documents them, what it applies to and what it expects`;

  function table(list) {
    const lines = [
      '| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |',
      '|---|---|---|---|---|---|'
    ];
    for (const r of list) {
      lines.push(
        `| [\`${r.ruleId}\`](#${r.ruleId}) | ${escapePipes(r.title)} | ${r.wcagSc || '—'} | ${r.level || '—'} | ${r.confidence} | ${r.severity} |`
      );
    }
    return lines.join('\n');
  }

  // A label reads better on its own line when the prose runs to more than one
  // paragraph or carries a list, even a list of one item.
  function proseBlock(label, text) {
    if (!text) return '';
    const body = escapeAngles(text);
    return body.includes('\n') || body.startsWith('- ')
      ? `**${label}**\n\n${body}`
      : `**${label}** ${body}`;
  }

  // A rule that declares meta.margin reports how close its closest
  // measurement came to the threshold (OUTPUT_SCHEMA.md, check result).
  function marginLine(margin) {
    if (!margin) return '';
    const limit = margin.limit === 'min' ? 'must reach' : 'must stay under';
    return `**Margin.** \`${margin.measure}\`, in ${margin.unit === 'px' ? 'CSS pixels' : 'a ratio'}: the value ${limit} the threshold, and the result's \`margin\` names the element that came closest while meeting it.`;
  }

  function reference(r) {
    const sc = r.wcagSc ? `WCAG ${r.wcagSc} (${r.level || '—'})` : 'no formal WCAG SC mapping';

    const parts = [
      `**${escapeAngles(r.title)}**`,
      `${r.type} · ${sc} · confidence ${r.confidence} · default severity ${r.severity}`,
      escapeAngles(r.description),
      proseBlock('Applies to.', r.applicability),
      proseBlock('Expectation.', r.expectation),
      proseBlock('What a finding reports.', r.reports),
      marginLine(r.margin)
    ].filter(Boolean);

    return `### \`${r.ruleId}\`\n\n${parts.join('\n\n')}`;
  }

  const compositeLines = composites
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (c) =>
        `| \`${c.id}\` | ${escapePipes(c.meta && c.meta.title)} | ${escapePipes((c.meta && c.meta.description) || '')} | ${((c.meta && c.meta.wcagSc) || []).join(', ') || '—'} | ${(c.meta && c.meta.level) || '—'} | ${c.checksIds.length} |`
    );

  const intro = isCore
    ? ''
    : introText != null
      ? `${introText}\n\n`
      : `The rules of the ${name} profile, which a scan runs under its profile or when asked for by tag. Core's rules, and the WCAG rollups, are in core's [\`RULE_CATALOG.md\`](${coreDocs}/RULE_CATALOG.md).\n\n`;

  // A pack's profiles: { name, tags, mapped (the standard version whose
  // mapped rules it runs, or null), rules, exclude, severity }.
  const ids = (list) => (list.length ? list.map((x) => `\`${x}\``).join(', ') : '—');
  const profileSection = profiles.length
    ? `## Profiles (${profiles.length})

What a scan runs under each profile (\`engineOptions.profile\`): the rules its tags select, those its standard maps for its version, and those it names, less those it leaves out. A severity column gives a rule another severity under the profile.

| Profile | Tags | Mapped rules | Rules by id | Leaves out | Severity |
|---|---|---|---|---|---|
${profiles
  .map(
    (p) =>
      `| \`${p.name}\` | ${ids(p.tags)} | ${p.mapped ? `version ${p.mapped}` : '—'} | ${ids(p.rules)} | ${ids(p.exclude)} | ${
        Object.keys(p.severity).length
          ? Object.entries(p.severity)
              .map(([id, level]) => `\`${id}\`: ${level}`)
              .join(', ')
          : '—'
      } |`
  )
  .join('\n')}

`
    : '';

  const compositeSection = isCore
    ? `## Composite (WCAG-SC rollup) rules (${composites.length})

Composite rules aren't individually authored. They're generated rollups over the atomic rules above, one per WCAG Success Criterion with automatable coverage. See [\`WCAG_CONFORMANCE.md\`](${coreDocs}/WCAG_CONFORMANCE.md) for rollup semantics.

| Composite ID | Title | Description | WCAG SC | Level | # atomic rules rolled up |
|---|---|---|---|---|---|
${compositeLines.join('\n')}

`
    : rollups.length
      ? `## Rollups (${rollups.length})

Each groups rules into one result, as a WCAG rollup does; the standard's own report sections show them.

| Rollup ID | Title | Rules |
|---|---|---|
${rollups
  .slice()
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(
    (c) =>
      `| \`${c.id}\` | ${escapePipes(c.title)} | ${c.checksIds.map((id) => `\`${id}\``).join(', ')} |`
  )
  .join('\n')}

`
      : '';

  return `# Rule catalog${isCore ? '' : `: ${name}`}

${intro}Generated from the compiled engine's own catalog (\`getChecksCatalog()\`/\`getRulesCatalog()\`) and each rule's source header. ${regenerate} Do not hand-edit.

**${rows.length} rules total: ${automatic.length} automatic (decide deterministically; can return \`fail\`${isCore ? ' when they check a WCAG requirement' : ''}), ${manual.length} manual (a person judges what they find; never \`fail\`, and \`pass\` only when nothing needs judging). ${withSc.length} carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, ${proseNote}.

A rule with a **Margin** line measures a value against a threshold, and its check result's \`margin\` says how close the closest element came while still meeting it (see [\`OUTPUT_SCHEMA.md\`](${coreDocs}/OUTPUT_SCHEMA.md#a-check-result-checksresultsi)). Unlike the fields below, it is a stable contract.

Under **What a finding reports**, a rule lists the fields its findings carry in \`data.details\` besides \`reasonCode\`, and what each one means. They help to read and reproduce a finding, but apart from \`reasonCode\` they are not a stable contract (see [\`OUTPUT_SCHEMA.md\`](${coreDocs}/OUTPUT_SCHEMA.md#an-occurrence-occurrencesi)): a field may be renamed or dropped in a minor release, so do not build on them.

See [\`OUTPUT_SCHEMA.md\`](${coreDocs}/OUTPUT_SCHEMA.md) for what \`type\`/\`confidence\`/\`severity\` mean on a scan result, and [\`WCAG_CONFORMANCE.md\`](${coreDocs}/WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim.${isCore ? " For WCAG-facet-level coverage-gap tracking (which parts of an SC are and aren't automatable yet), see `coverage/coverage-report.md` instead: that one is organized by facet, this one by rule." : ''}

## Automatic rules (${automatic.length}), can return \`fail\`

${table(automatic)}

## Manual rules (${manual.length}), never \`fail\`

${table(manual)}

${profileSection}${compositeSection}## Rule reference

Every atomic rule, alphabetically. "Applies to" is the rule's precondition (when it returns \`notApplicable\`), and "Expectation" is the condition it decides once it does apply.

${rows.map(reference).join('\n\n')}
`;
}

// --- the examples: which rules have a section ------------------------------------

function readDocumentedRuleIds(examplesFile) {
  if (!fs.existsSync(examplesFile)) return new Set();
  const source = fs.readFileSync(examplesFile, 'utf8');
  const ids = new Set();
  const re = /^## (\S+)$/gm;
  let m;
  while ((m = re.exec(source)) !== null) ids.add(m[1]);
  return ids;
}

function describeList(label, ids) {
  const lines = [`${ids.length} ${label}:`];
  for (const id of ids) lines.push(`  ${id}`);
  return lines;
}

// The rules (ids, in catalog order) that RULE_EXAMPLES.md has no section
// for, and the sections that name no rule.
function examplesCoverage(ids, examplesFile) {
  const documented = readDocumentedRuleIds(examplesFile);
  const list = [...ids];
  const missing = list.filter((id) => !documented.has(id));
  const stale = [...documented].filter((id) => !list.includes(id)).sort();
  return { missing, stale };
}

// One source's gaps, and whether its baseline records them: lines describing
// any drift, empty when it is current. command is the one that rewrites the
// baseline.
function checkSource(
  repoRoot,
  examplesFile,
  outPath,
  fresh,
  command = 'npm run rule-examples:coverage'
) {
  const shownDoc = path.relative(repoRoot, examplesFile);
  const shownOut = path.relative(repoRoot, outPath);
  if (!fs.existsSync(outPath)) {
    return [`${shownOut} is missing -- run \`${command}\``];
  }
  const committed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const { missing, stale } = fresh;

  const newlyMissing = missing.filter((id) => !committed.missing.includes(id));
  const resolvedMissing = committed.missing.filter((id) => !missing.includes(id));
  const newlyStale = stale.filter((id) => !committed.stale.includes(id));
  const resolvedStale = committed.stale.filter((id) => !stale.includes(id));

  const lines = [];
  if (newlyMissing.length)
    lines.push(...describeList(`rule(s) have no ${shownDoc} section`, newlyMissing));
  if (resolvedMissing.length)
    lines.push(...describeList('rule(s) recorded as missing now have a section', resolvedMissing));
  if (newlyStale.length)
    lines.push(...describeList(`${shownDoc} section(s) that don't match its rule ids`, newlyStale));
  if (resolvedStale.length)
    lines.push(...describeList('recorded stale section(s) that are gone', resolvedStale));
  return lines;
}

// --- the examples: what each gives ------------------------------------------------

const LABELS = {
  Passed: 'pass',
  Failed: 'fail',
  'Flagged (cantTell)': 'cantTell',
  'Not applicable': 'notApplicable'
};
const MAX_SNIPPET = 100;

// Every example of a RULE_EXAMPLES.md: { ruleId, label, expected, html }.
// An unknown label is an example too, with expected null, so it is reported.
function readExamples(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  const sections = fs.readFileSync(file, 'utf8').split(/^## /m).slice(1);
  for (const section of sections) {
    const ruleId = section.split('\n')[0].trim();
    const re = /^\*\*([^*]+)\*\*\s*\n```html\n([\s\S]*?)```/gm;
    let m;
    while ((m = re.exec(section)) !== null) {
      const label = m[1].trim();
      const outcome = label.replace(/\s*\(in a browser\)$/, '');
      out.push({ ruleId, label, expected: LABELS[outcome] || null, html: m[2] });
    }
  }
  return out;
}

function toPage(snippet) {
  if (/<html[\s>]/i.test(snippet)) return snippet;
  const head = (snippet.match(/<head[\s>][\s\S]*?<\/head>/i) || [''])[0];
  let rest = head ? snippet.replace(head, '') : snippet;
  const headInner = head.replace(/^<head[^>]*>|<\/head>$/gi, '');
  const leading = (rest.match(
    /^\s*(?:<(title|style)[\s\S]*?<\/\1>\s*|<(?:meta|link)\b[^>]*>\s*)+/i
  ) || [''])[0];
  rest = rest.slice(leading.length);
  const hasTitle = /<title[\s>]/i.test(headInner + leading);
  const body = /<body[\s>]/i.test(rest) ? rest : `<body>${rest}</body>`;
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    (hasTitle ? '' : '<title>Example page</title>') +
    headInner +
    leading +
    `</head>${body}</html>`
  );
}

function snippetLabel(html) {
  const one = html.replace(/\s+/g, ' ').trim();
  return one.length > MAX_SNIPPET ? one.slice(0, MAX_SNIPPET) + '…' : one;
}

// Runs each example in Chromium with the browser bundle (and whatever else it
// needs, a pack's script) and the rule alone selected. engineOptions are
// added to the scan's (a pack's names, under packs).
async function collectDisagreements(examples, bundle, engineOptions = {}) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const out = [];
  try {
    for (const ex of examples) {
      let engine;
      if (!ex.expected) {
        engine = 'unknown label';
      } else {
        const page = await context.newPage();
        try {
          await page.setContent(toPage(ex.html));
          await page.addScriptTag({ content: bundle });
          engine = await page.evaluate(
            ({ id, options }) => {
              const r = window.a11ycore.runa11yCoreInPage(
                location.href,
                null,
                { ...options, rules: { include: id } },
                null
              );
              const c = r.checksResults.find((x) => x.ruleId === id);
              return c ? c.outcome : 'absent';
            },
            { id: ex.ruleId, options: engineOptions }
          );
        } finally {
          await page.close();
        }
      }
      if (engine !== ex.expected) {
        out.push({
          ruleId: ex.ruleId,
          label: ex.label,
          engine,
          example: snippetLabel(ex.html)
        });
      }
    }
  } finally {
    await browser.close();
  }
  return out;
}

function keyOf(e) {
  return `${e.ruleId} [${e.label}] ${e.example}`;
}

// command is the one that rewrites the record.
function reportDrift(committed, fresh, command = 'npm run rule-examples:outcomes') {
  const before = new Set(committed.map(keyOf));
  const after = new Map(fresh.map((e) => [keyOf(e), e]));
  const lines = [];
  const added = fresh.filter((e) => !before.has(keyOf(e)));
  const resolved = committed.filter((e) => !after.has(keyOf(e)));
  const changed = committed.filter((e) => {
    const now = after.get(keyOf(e));
    return now && now.engine !== e.engine;
  });
  if (added.length) {
    lines.push(`${added.length} example(s) now give another outcome than their label:`);
    for (const e of added) lines.push(`  + ${keyOf(e)}: engine reports ${e.engine}`);
    lines.push('  Fix the example or its label, or the rule, whichever is wrong.');
  }
  if (resolved.length) {
    lines.push(`${resolved.length} recorded disagreement(s) no longer occur:`);
    for (const e of resolved) lines.push(`  - ${keyOf(e)}`);
  }
  if (changed.length) {
    lines.push(`${changed.length} recorded disagreement(s) changed:`);
    for (const e of changed) lines.push(`  ~ ${keyOf(e)}: now ${after.get(keyOf(e)).engine}`);
  }
  if (lines.length) lines.push(`Run \`${command}\` to rewrite the record.`);
  return lines.join('\n');
}

module.exports = {
  escapeAngles,
  escapePipes,
  jsdocTag,
  levelsOf,
  readRuleProse,
  catalogRows,
  renderCatalog,
  readDocumentedRuleIds,
  examplesCoverage,
  checkSource,
  readExamples,
  toPage,
  collectDisagreements,
  reportDrift
};
