/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @surea11y/core/pack-docs: the docs core generates for its own rules, for a
 * pack's (`surea11y-pack docs` runs it in the pack's folder):
 *
 * - docs/RULE_CATALOG.md, generated: a row per rule of the pack (its rules,
 *   variants and overrides) from the catalog of a scan with it, the prose of
 *   each rule's source header (@applicability, @expectation, @reports), and
 *   its standard's or checklist's rollups.
 * - docs/RULE_EXAMPLES.md, hand-written, a `## <rule id>` section per rule
 *   with labelled examples (`**Passed**`, `**Failed**`, `**Flagged
 *   (cantTell)**`, `**Not applicable**`, then an html code block). Which rules
 *   have no section is kept in scripts/data/rule-examples-coverage.json, and
 *   the examples that give another outcome than their label, run in Chromium
 *   with the pack, in scripts/data/rule-examples-outcomes.json. Each record
 *   changes only when it is rewritten, so a change shows in review.
 *
 * With `check`, nothing is written: what is stale is returned (the command
 * exits 1), for a pack's CI.
 */

const fs = require('node:fs');
const path = require('node:path');

const { getChecksCatalog } = require('./index.js');
const { checkPack, describePacks, buildBrowserBundle } = require('./pack.js');
const docs = require('./rule-docs.js');

const CORE_DOCS = 'https://github.com/SureA11y/core/blob/main/docs';
const COMMAND = 'npx surea11y-pack docs';

// The ids of the pack's own rules: its rules, variants and overrides.
function packRuleIds(pack) {
  const d = describePacks([pack])[0];
  return new Set([...d.rules, ...d.variants, ...d.overrides]);
}

// Its standard's rollups, or its checklist's items: { id, title, checksIds }.
function packRollups(pack) {
  const list =
    pack.standard && typeof pack.standard.composites === 'function'
      ? pack.standard.composites()
      : pack.rollups || [];
  return list.map((c) => ({
    id: c.id,
    title: c.title || (c.meta && c.meta.title) || c.id,
    checksIds: c.checksIds || []
  }));
}

// Its standard's or checklist's profiles, as the catalog lists them. A
// checklist's profiles run the pack's own rules by its namespace tag.
function packProfiles(pack) {
  const own = pack.standard ? pack.standard.profiles || {} : pack.profiles || {};
  const checklist = !pack.standard;
  const exclude = (p) => {
    const e = p.exclude || {};
    return (e.rules || []).concat((e.criteria || []).map((sc) => `WCAG ${sc}`));
  };
  return Object.entries(own).map(([name, p]) => ({
    name,
    tags:
      checklist && !(p.tags || []).includes(pack.namespace)
        ? (p.tags || []).concat([pack.namespace])
        : (p.tags || []).slice(),
    mapped: p.mappedRules ? p.version : null,
    rules: (p.rules || []).slice(),
    exclude: exclude(p),
    severity: { ...(p.severity || {}) }
  }));
}

// What the catalog calls the pack: its title, its standard's name, or its
// package name.
function packTitle(pack) {
  return pack.title || (pack.standard && pack.standard.standard) || pack.name;
}

function ruleCatalog(pack, { rulesDir, coreDocs = CORE_DOCS, command = COMMAND } = {}) {
  const ids = packRuleIds(pack);
  const prose = rulesDir ? docs.readRuleProse(rulesDir) : new Map();
  const rows = docs.catalogRows(getChecksCatalog({ packs: [pack] }), ids, prose);
  const name = packTitle(pack);
  const title = name === pack.name ? `\`${pack.name}\`` : `${name} (\`${pack.name}\`)`;
  return docs.renderCatalog(rows, [], {
    isCore: false,
    name,
    coreDocs,
    intro: `The rules of ${title}, a pack for \`@surea11y/core\`, which a scan given the pack runs as their tags and the pack's profiles say. Core's rules, and the WCAG rollups, are in core's [\`RULE_CATALOG.md\`](${coreDocs}/RULE_CATALOG.md).`,
    regenerate: `Run \`${command}\` to regenerate this file whenever rules change.`,
    rollups: packRollups(pack),
    profiles: packProfiles(pack)
  });
}

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function writeFiles(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/**
 * Writes (or, with check, checks) a pack's rule docs and records. root is
 * the pack's folder; rulesDir, docsDir and dataDir are relative to it.
 * examples: false leaves out running the examples (it needs Playwright's
 * Chromium). Returns { written, problems }: the files written, and what is
 * stale or wrong, one message each.
 */
async function packDocs(pack, options = {}) {
  const {
    root = process.cwd(),
    rulesDir = 'rules',
    docsDir = 'docs',
    dataDir = path.join('scripts', 'data'),
    check = false,
    examples = true,
    command = COMMAND
  } = options;
  const problems = checkPack(pack);
  if (problems.length) {
    const name = pack && typeof pack.name === 'string' ? pack.name : 'The pack';
    return { written: [], problems: problems.map((p) => `${name}: ${p}`) };
  }

  const at = (...p) => path.join(root, ...p);
  const shown = (file) => path.relative(root, file);
  const written = [];
  const stale = [];
  // Files are written once everything has been worked out, so a step that
  // fails (an example that can't be run) leaves every file as it was.
  const pending = [];
  const writeFile = (file, text) => pending.push([file, text]);

  // The catalog.
  const catalogFile = at(docsDir, 'RULE_CATALOG.md');
  const md = ruleCatalog(pack, { rulesDir: at(rulesDir), command });
  if (!check) {
    writeFile(catalogFile, md);
    written.push(shown(catalogFile));
  } else if (!fs.existsSync(catalogFile) || fs.readFileSync(catalogFile, 'utf8') !== md) {
    stale.push(`${shown(catalogFile)} is stale. Run: ${command}`);
  }

  // Which rules have examples.
  const ids = [...packRuleIds(pack)].sort();
  const examplesFile = at(docsDir, 'RULE_EXAMPLES.md');
  const coverageFile = at(dataDir, 'rule-examples-coverage.json');
  const coverage = docs.examplesCoverage(ids, examplesFile);
  if (!check) {
    writeFile(coverageFile, JSON.stringify(coverage, null, 2) + '\n');
    written.push(shown(coverageFile));
  } else {
    stale.push(...docs.checkSource(root, examplesFile, coverageFile, coverage, command));
  }

  // What each example gives, in Chromium with the pack.
  if (examples) {
    const own = new Set(ids);
    const list = docs.readExamples(examplesFile).filter((ex) => own.has(ex.ruleId));
    const bundle = buildBrowserBundle({ packs: [pack] });
    const errors = [];
    const fresh = await docs.collectDisagreements(
      list,
      bundle,
      { packs: [`${pack.name}@${pack.version}`] },
      { errors }
    );
    if (errors.length) {
      return {
        written: [],
        problems: [
          `${errors.length} example(s) in ${shown(examplesFile)} could not be run, so nothing was written:`,
          ...errors.map((e) => `  ${e.ruleId} [${e.label}] ${e.example}: ${e.message}`)
        ]
      };
    }
    const outcomesFile = at(dataDir, 'rule-examples-outcomes.json');
    if (!check) {
      writeFile(outcomesFile, JSON.stringify({ disagreements: fresh }, null, 2) + '\n');
      written.push(shown(outcomesFile));
    } else {
      const committed = readJson(outcomesFile);
      if (!committed) {
        stale.push(`${shown(outcomesFile)} is missing. Run: ${command}`);
      } else {
        const drift = docs.reportDrift(committed.disagreements, fresh, command);
        if (drift) stale.push(`${shown(outcomesFile)}: ${drift}`);
      }
    }
  }

  for (const [file, text] of pending) writeFiles(file, text);
  return { written, problems: stale };
}

module.exports = { packDocs, ruleCatalog };
