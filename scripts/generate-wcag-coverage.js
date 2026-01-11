'use strict';

/**
 * Generate a WCAG Success Criteria coverage report from rule metadata
 * with contextualization via "facets" (non-normative test objectives).
 *
 * Usage:
 *   node scripts/generate-wcag-coverage.js
 *   node scripts/generate-wcag-coverage.js --rulesDir src/rules --out coverage/coverage-report.md --json coverage/coverage-report.json --facets src/coverage/wcag-facets.js
 *
 * Output:
 * - Markdown report (grouped by SC, with facet coverage when available)
 * - JSON (rows + facet summaries + summary coverage by WCAG level/version tags)
 *
 * Notes:
 * - Facet mapping is read from rule metadata:
 *     meta.coverage.facetsBySc[sc] = ['facet-id', ...]
 * - FACETS definitions are loaded from the facets file and used to compute per-SC facet coverage.
 *
 * WCAG level/version coverage:
 * - This script also summarizes rule coverage using the reference engine-style WCAG tags:
 *     wcag2a / wcag2aa / wcag2aaa
 *     wcag21a / wcag21aa / wcag21aaa
 *     wcag22a / wcag22aa / wcag22aaa
 * - "Cumulative" semantics are used for level summaries:
 *     AA counts as A+AA, AAA counts as A+AA+AAA
 *   (This matches common expectation in tools like the reference engine.)
 */

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const args = {
    rulesDir: null, // auto-detect
    out: 'coverage/coverage-report.md',
    json: 'coverage/coverage-report.json',
    facets: null // auto-detect
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--rulesDir') args.rulesDir = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--json') args.json = argv[++i];
    else if (a === '--facets') args.facets = argv[++i];
  }
  return args;
}

function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(startDir);
    dir = parent;
  }
}

function resolveRulesDir(repoRoot, rulesDirArg) {
  if (rulesDirArg) {
    return path.isAbsolute(rulesDirArg)
      ? rulesDirArg
      : path.resolve(repoRoot, rulesDirArg);
  }

  const candidates = [
    path.join(repoRoot, 'src', 'rules'),
    path.join(repoRoot, 'rules')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return candidate;
  }

  return path.join(repoRoot, 'rules');
}

function resolveFacetsFile(repoRoot, facetsArg) {
  if (facetsArg) {
    return path.isAbsolute(facetsArg)
      ? facetsArg
      : path.resolve(repoRoot, facetsArg);
  }

  const candidates = [
    path.join(repoRoot, 'src', 'coverage', 'wcag-facets.js'),
    path.join(repoRoot, 'src', 'wcag-facets.js'),
    path.join(repoRoot, 'wcag-facets.js')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function isRuleFileName(fileName) {
  if (fileName === 'index.js' || fileName === 'index.cjs' || fileName === 'index.mjs') return false;
  if (fileName.endsWith('.test.js') || fileName.endsWith('.test.cjs') || fileName.endsWith('.test.mjs')) return false;
  return fileName.endsWith('.js') || fileName.endsWith('.cjs') || fileName.endsWith('.mjs');
}

function listRuleFilesRecursive(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) out.push(...listRuleFilesRecursive(full));
    else if (ent.isFile() && isRuleFileName(ent.name)) out.push(full);
  }
  return out;
}

function safeRequire(file) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(file);
}

function normalizeSc(sc) {
  return String(sc || '').trim();
}

function getFacetIdsForScFromRow(row, sc) {
  const cov = row && row.coverage ? row.coverage : null;
  const bySc = cov && cov.facetsBySc ? cov.facetsBySc : null;
  const facetIds = bySc && bySc[sc] ? bySc[sc] : [];
  return Array.isArray(facetIds) ? facetIds.filter(Boolean) : [];
}

function getMissingFacetRulesForSc(sc, rowsForSc) {
  const missing = [];
  for (const r of rowsForSc) {
    if (!r || r.error) continue;
    // For SC sections only (not "(unmapped)"), a row here implies wcagSc includes sc
    const facetIds = getFacetIdsForScFromRow(r, sc);
    if (!facetIds.length) {
      if (r.ruleId && !missing.includes(r.ruleId)) missing.push(r.ruleId);
    }
  }
  return missing;
}

function summarizeFacetCoverage(sc, facetDefs, rowsForSc) {
  if (!facetDefs || !Array.isArray(facetDefs.facets)) return null;

  const facets = facetDefs.facets.map((f) => ({
    id: f.id,
    label: f.label,
    automation: f.automation,
    coveredBy: []
  }));

  const byFacet = new Map(facets.map((f) => [f.id, f]));

  for (const r of rowsForSc) {
    const facetIds = getFacetIdsForScFromRow(r, sc);
    for (const facetId of facetIds) {
      const facet = byFacet.get(facetId);
      if (!facet) continue;
      if (!facet.coveredBy.includes(r.ruleId)) facet.coveredBy.push(r.ruleId);
    }
  }

  const covered = facets.filter((f) => f.coveredBy.length > 0).length;
  const total = facets.length;

  const automationCounts = facets.reduce((acc, f) => {
    const key = f.automation || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const uncoveredFacets = facets.filter((f) => f.coveredBy.length === 0).map((f) => f.id);

  const missingFacetRules = getMissingFacetRulesForSc(sc, rowsForSc);

  return {
    sc,
    title: facetDefs.title || null,
    totalFacets: total,
    coveredFacets: covered,
    uncoveredFacets,
    automationCounts,
    missingFacetRules,
    facets
  };
}

function formatAutomationMix(automationCounts) {
  const parts = [];
  const full = automationCounts && automationCounts.full ? automationCounts.full : 0;
  const partial = automationCounts && automationCounts.partial ? automationCounts.partial : 0;
  const manual = automationCounts && automationCounts.manual ? automationCounts.manual : 0;
  const unknown = automationCounts && automationCounts.unknown ? automationCounts.unknown : 0;

  parts.push(`full ${full}`);
  parts.push(`partial ${partial}`);
  parts.push(`manual ${manual}`);
  if (unknown) parts.push(`unknown ${unknown}`);

  return parts.join(', ');
}

/* =========================
 * WCAG tag helpers
 * ========================= */

/**
 * Parse the reference engine-style WCAG tags.
 * Examples:
 *   wcag2a, wcag2aa, wcag2aaa
 *   wcag21a, wcag21aa, wcag21aaa
 *   wcag22a, wcag22aa, wcag22aaa
 *
 * @returns {{ version: '2.0'|'2.1'|'2.2', level: 'A'|'AA'|'AAA' } | null}
 */
function parseWcagTag(tag) {
  const t = String(tag || '').trim().toLowerCase();
  if (!t) return null;
  const m = /^wcag(2|21|22)(a{1,3})$/.exec(t);
  if (!m) return null;

  const verRaw = m[1];
  const levelRaw = m[2]; // 'a' | 'aa' | 'aaa'

  const version = verRaw === '2' ? '2.0' : (verRaw === '21' ? '2.1' : '2.2');
  const level = levelRaw.length === 1 ? 'A' : (levelRaw.length === 2 ? 'AA' : 'AAA');
  return { version, level };
}

function uniqueStrings(list) {
  const out = [];
  const seen = new Set();
  for (const v of Array.isArray(list) ? list : []) {
    const s = String(v || '').trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * Extract WCAG version/level signals from a rule's tags.
 * Returns both the raw parsed entries and "cumulative" level sets.
 */
function extractWcagSignalsFromTags(tags) {
  const parsed = [];
  for (const t of uniqueStrings(tags)) {
    const p = parseWcagTag(t);
    if (p) parsed.push({ tag: t, version: p.version, level: p.level });
  }

  const byVersion = new Map(); // version -> Set(levels cumulative)
  const addCumulative = (version, level) => {
    if (!byVersion.has(version)) byVersion.set(version, new Set());
    const set = byVersion.get(version);
    if (level === 'A') set.add('A');
    else if (level === 'AA') { set.add('A'); set.add('AA'); }
    else if (level === 'AAA') { set.add('A'); set.add('AA'); set.add('AAA'); }
  };

  for (const p of parsed) addCumulative(p.version, p.level);

  const versions = Array.from(byVersion.keys()).sort();
  const cumulativeLevelsByVersion = {};
  for (const v of versions) cumulativeLevelsByVersion[v] = Array.from(byVersion.get(v).values()).sort();

  // Version-agnostic cumulative levels:
  const any = new Set();
  for (const v of versions) {
    for (const lvl of byVersion.get(v).values()) any.add(lvl);
  }
  const cumulativeLevelsAny = Array.from(any.values()).sort();

  return {
    parsed, // [{tag,version,level}]
    versions,
    cumulativeLevelsByVersion,
    cumulativeLevelsAny
  };
}

function initCoverageCounters() {
  const versions = ['2.0', '2.1', '2.2'];
  const levels = ['A', 'AA', 'AAA'];
  const out = {
    byVersion: {},
    anyVersion: { A: 0, AA: 0, AAA: 0 },
    rawTagCounts: {} // tag -> count
  };

  for (const v of versions) {
    out.byVersion[v] = { A: 0, AA: 0, AAA: 0 };
  }
  for (const lvl of levels) {
    out.anyVersion[lvl] = 0;
  }
  return out;
}

function incrementCoverageCounters(counters, signals, ruleId) {
  // ruleId unused for now, but kept for potential "coveredBy" expansions later
  if (!counters || !signals) return;

  // raw tags
  for (const p of signals.parsed || []) {
    const k = String(p.tag);
    counters.rawTagCounts[k] = (counters.rawTagCounts[k] || 0) + 1;
  }

  // cumulative per version
  for (const version of Object.keys(signals.cumulativeLevelsByVersion || {})) {
    const levels = signals.cumulativeLevelsByVersion[version] || [];
    for (const lvl of levels) {
      if (!counters.byVersion[version]) counters.byVersion[version] = { A: 0, AA: 0, AAA: 0 };
      counters.byVersion[version][lvl] = (counters.byVersion[version][lvl] || 0) + 1;
    }
  }

  // cumulative any-version
  for (const lvl of signals.cumulativeLevelsAny || []) {
    counters.anyVersion[lvl] = (counters.anyVersion[lvl] || 0) + 1;
  }
}

function renderCoverageTableMarkdown(title, rows) {
  let md = `### ${title}\n\n`;
  md += `| Scope | A | AA | AAA |\n|---|---:|---:|---:|\n`;
  for (const r of rows) {
    md += `| ${r.label} | ${r.A} | ${r.AA} | ${r.AAA} |\n`;
  }
  md += `\n`;
  return md;
}

function main() {
  const args = parseArgs(process.argv);

  const repoRoot = findRepoRoot(process.cwd());
  const absRulesDir = resolveRulesDir(repoRoot, args.rulesDir);

  const facetsFile = resolveFacetsFile(repoRoot, args.facets);
  let facetMap = null;

  if (facetsFile) {
    try {
      const mod = safeRequire(facetsFile);
      facetMap = mod && mod.FACETS ? mod.FACETS : null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[wcag-coverage] Failed to load facets file:', facetsFile, e.message);
    }
  }

  const files = listRuleFilesRecursive(absRulesDir);

  const rows = [];
  for (const file of files) {
    let mod;
    try {
      mod = safeRequire(file);
    } catch (e) {
      rows.push({
        file: path.relative(repoRoot, file),
        ruleId: null,
        wcagSc: [],
        type: null,
        title: null,
        tags: [],
        wcagTagSignals: null,
        error: String(e && e.message ? e.message : e),
        coverage: null
      });
      continue;
    }

    const id = mod && mod.id ? String(mod.id) : null;
    const meta = mod && mod.meta ? mod.meta : null;

    // Use meta.ruleId when present; otherwise fall back to rule module id.
    const ruleId =
      (meta && typeof meta.ruleId === 'string' && meta.ruleId.trim())
        ? meta.ruleId.trim()
        : (id ? id : null);

    const scs = (meta && Array.isArray(meta.wcagSc) ? meta.wcagSc : [])
      .map(normalizeSc)
      .filter(Boolean);

    const tags = uniqueStrings(meta && Array.isArray(meta.tags) ? meta.tags : []);
    const wcagTagSignals = extractWcagSignalsFromTags(tags);

    rows.push({
      file: path.relative(repoRoot, file),
      ruleId,
      wcagSc: scs,
      type: meta && meta.type ? String(meta.type) : null,
      title: meta && meta.title ? String(meta.title) : null,
      tags,
      wcagTagSignals,
      error: null,
      coverage: meta && meta.coverage ? meta.coverage : null
    });
  }

  // Group by SC
  const bySc = new Map();
  for (const r of rows) {
    const scList = (r.wcagSc && r.wcagSc.length) ? r.wcagSc : ['(unmapped)'];
    for (const sc of scList) {
      if (!bySc.has(sc)) bySc.set(sc, []);
      bySc.get(sc).push(r);
    }
  }

  // Coverage summary by WCAG tags (level/version)
  const coverageCounters = initCoverageCounters();
  const totalRules = rows.filter((r) => r && !r.error && r.ruleId).length;

  for (const r of rows) {
    if (!r || r.error || !r.ruleId) continue;
    incrementCoverageCounters(coverageCounters, r.wcagTagSignals || null, r.ruleId);
  }

  // Build Markdown
  const now = new Date().toISOString();
  const displayRulesDir = path.relative(repoRoot, absRulesDir) || '.';
  const displayFacets = facetsFile ? (path.relative(repoRoot, facetsFile) || facetsFile) : null;

  let md = `# WCAG Coverage Report\n\nGenerated: ${now}\n\nRules directory: \`${displayRulesDir}\`\n`;
  if (displayFacets) md += `Facets: \`${displayFacets}\`\n`;
  md += `\n`;

  md += `## Summary\n\n`;
  md += `Total rules (loaded without error): **${totalRules}**\n\n`;

  // Version-agnostic cumulative summary
  md += renderCoverageTableMarkdown('Coverage by WCAG Level (Version-agnostic, cumulative)', [
    {
      label: 'Any WCAG version',
      A: coverageCounters.anyVersion.A || 0,
      AA: coverageCounters.anyVersion.AA || 0,
      AAA: coverageCounters.anyVersion.AAA || 0
    }
  ]);

  // Per-version cumulative summary
  md += renderCoverageTableMarkdown('Coverage by WCAG Level (Per version, cumulative)', [
    { label: 'WCAG 2.0', A: coverageCounters.byVersion['2.0'].A || 0, AA: coverageCounters.byVersion['2.0'].AA || 0, AAA: coverageCounters.byVersion['2.0'].AAA || 0 },
    { label: 'WCAG 2.1', A: coverageCounters.byVersion['2.1'].A || 0, AA: coverageCounters.byVersion['2.1'].AA || 0, AAA: coverageCounters.byVersion['2.1'].AAA || 0 },
    { label: 'WCAG 2.2', A: coverageCounters.byVersion['2.2'].A || 0, AA: coverageCounters.byVersion['2.2'].AA || 0, AAA: coverageCounters.byVersion['2.2'].AAA || 0 }
  ]);

  // Tag totals (raw) for transparency/debugging
  const rawTags = Object.keys(coverageCounters.rawTagCounts || {}).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  if (rawTags.length) {
    md += `### Raw WCAG tag counts (non-cumulative)\n\n`;
    md += `| Tag | Rules |\n|---|---:|\n`;
    for (const t of rawTags) {
      md += `| ${t} | ${coverageCounters.rawTagCounts[t]} |\n`;
    }
    md += `\n`;
  } else {
    md += `### Raw WCAG tag counts (non-cumulative)\n\nNo WCAG tags found in rule metadata.\n\n`;
  }

  const scKeys = Array.from(bySc.keys()).sort((a, b) => {
    if (a === '(unmapped)') return 1;
    if (b === '(unmapped)') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const facetSummaries = [];

  for (const sc of scKeys) {
    const rowsForSc = bySc.get(sc);

    md += `## ${sc}\n\n`;

    // For SC sections (not "(unmapped)"), compute missing facet mapping regardless of facet model.
    const missingFacetRules = (sc !== '(unmapped)') ? getMissingFacetRulesForSc(sc, rowsForSc) : [];

    // Facet summary section
    const facetsForSc = facetMap && facetMap[sc] ? facetMap[sc] : null;
    const summary = summarizeFacetCoverage(sc, facetsForSc, rowsForSc);

    if (summary) {
      facetSummaries.push(summary);

      md += `Facet coverage: **${summary.coveredFacets}/${summary.totalFacets}** facets covered.\n`;
      md += `Automation mix: **${formatAutomationMix(summary.automationCounts)}**.\n`;

      if (summary.missingFacetRules.length) {
        md += `Rules missing facet mapping for this SC: ${summary.missingFacetRules.join(', ')}\n`;
      }

      md += `\n| Facet | Automation | Covered by |\n|---|---|---|\n`;
      for (const f of summary.facets) {
        const coveredBy = f.coveredBy.length ? f.coveredBy.join(', ') : '—';
        md += `| ${f.id} | ${f.automation} | ${coveredBy} |\n`;
      }

      if (summary.uncoveredFacets.length) {
        md += `\nUncovered facets: ${summary.uncoveredFacets.join(', ')}\n`;
      }
      md += `\n`;
    } else if (sc !== '(unmapped)') {
      md += `No facet model defined for this SC yet.\n`;
      if (missingFacetRules.length) {
        md += `Rules missing facet mapping for this SC: ${missingFacetRules.join(', ')}\n`;
      }
      md += `\n`;
    }

    md += `| Rule ID | Type | Title | File | Facet | Notes |\n|---|---|---|---|---|---|\n`;
    for (const r of rowsForSc) {
      const notes = r.error ? `ERROR: ${String(r.error).replaceAll('|', '\\|')}` : '';
      const facetIds = getFacetIdsForScFromRow(r, sc);
      const facetText = facetIds.length ? facetIds.join(', ') : '';
      md += `| ${r.ruleId || ''} | ${r.type || ''} | ${(r.title || '').replaceAll('|', '\\|')} | ${r.file} | ${facetText} | ${notes} |\n`;
    }
    md += `\n`;
  }

  fs.mkdirSync(path.dirname(path.resolve(repoRoot, args.out)), { recursive: true });
  fs.writeFileSync(path.resolve(repoRoot, args.out), md, 'utf8');
  fs.writeFileSync(
    path.resolve(repoRoot, args.json),
    JSON.stringify(
      {
        rulesDir: displayRulesDir,
        facetsFile: displayFacets,
        generatedAt: now,
        summary: {
          totalRules,
          wcagTagCoverage: coverageCounters
        },
        rows,
        facetSummaries
      },
      null,
      2
    ),
    'utf8'
  );

  // eslint-disable-next-line no-console
  console.log(`[wcag-coverage] wrote ${args.out} and ${args.json}`);
}

main();
