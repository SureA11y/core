'use strict';

/**
 * Generate a centralized index of scenario fixtures (tests/fixtures/*.html)
 * cross-referenced against the rule catalog and the test files that consume
 * each fixture.
 *
 * Usage:
 *   node scripts/generate-fixture-index.js
 *   node scripts/generate-fixture-index.js --checksDir src/checks --fixturesDir tests/fixtures --testsDir tests/engine-checks --out tests/fixtures/INDEX.md --json tests/fixtures/index.json
 *
 * Output:
 * - Markdown index (tests/fixtures/INDEX.md): one row per rule, whether it
 *   has a scenario fixture, the fixture's relative path, and pass/fail/
 *   other case counts parsed from the fixture's case-title markers.
 * - JSON (tests/fixtures/index.json): same data, machine-readable, so
 *   external tooling can enumerate and load every fixture page directly.
 * - HTML index (tests/fixtures/index.html): a real, self-contained page
 *   (no external CSS/JS) with a clickable link to every fixture, using
 *   bare relative filenames — open it directly via file://, or point a
 *   browser-driving tool/local static server at tests/fixtures/ and load
 *   index.html as the entry point, then follow links to each fixture page.
 *
 * Convention this script assumes (see docs/RULE_AUTHORING.md):
 * - One fixture per rule: tests/fixtures/<slug>-all-scenarios.html
 * - Each fixture case is a `<div class="case" id="case_NN">` wrapping a
 *   `.case-title` starting with "NN — PASS:", "NN — FAIL:",
 *   "NN — CANTTELL:", or "NN — NEUTRAL"/"NN — INELIGIBLE" (anything else
 *   is counted as "other").
 * - Each rule's test file declares `const RULE_ID = '...'` and reads its
 *   fixture via a path containing `fixtures/<file>.html`.
 */

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
    const args = {
        checksDir: 'src/checks',
        fixturesDir: 'tests/fixtures',
        testsDir: 'tests/engine-checks',
        out: 'tests/fixtures/INDEX.md',
        json: 'tests/fixtures/index.json',
        html: 'tests/fixtures/index.html'
    };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--checksDir') args.checksDir = argv[++i];
        else if (a === '--fixturesDir') args.fixturesDir = argv[++i];
        else if (a === '--testsDir') args.testsDir = argv[++i];
        else if (a === '--out') args.out = argv[++i];
        else if (a === '--json') args.json = argv[++i];
        else if (a === '--html') args.html = argv[++i];
    }
    return args;
}

function findRepoRoot(startDir) {
    let dir = path.resolve(startDir);
    for (;;) {
        if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) return path.resolve(startDir);
        dir = parent;
    }
}

function listFilesRecursive(dirAbs, filterFn) {
    if (!fs.existsSync(dirAbs)) return [];
    const out = [];
    for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
        const full = path.join(dirAbs, ent.name);
        if (ent.isDirectory()) out.push(...listFilesRecursive(full, filterFn));
        else if (ent.isFile() && filterFn(ent.name)) out.push(full);
    }
    return out;
}

function isRuleFileName(fileName) {
    if (fileName === 'index.js' || fileName === 'index.cjs' || fileName === 'index.mjs') return false;
    if (fileName.endsWith('.test.js')) return false;
    return fileName.endsWith('.js');
}

function isTestFileName(fileName) {
    return fileName.endsWith('.test.js');
}

function safeRequire(file) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(file);
}

/** Load the rule catalog: ruleId (prefixed) -> { title, type, file } */
function loadRuleCatalog(repoRoot, checksDirArg) {
    const checksDirAbs = path.isAbsolute(checksDirArg) ? checksDirArg : path.resolve(repoRoot, checksDirArg);
    const files = listFilesRecursive(checksDirAbs, isRuleFileName);

    const rules = new Map(); // ruleId -> {title, type, file}
    for (const file of files) {
        let mod;
        try {
            mod = safeRequire(file);
        } catch {
            continue;
        }
        const meta = mod && mod.meta ? mod.meta : null;
        const id = mod && mod.id ? String(mod.id) : null;
        if (!id || !meta) continue;
        rules.set(id, {
            title: meta.title || null,
            type: meta.type || null,
            wcagSc: Array.isArray(meta.wcagSc) ? meta.wcagSc : [],
            file: path.relative(repoRoot, file)
        });
    }
    return rules;
}

/** Parse a fixture HTML file for numbered cases and their PASS/FAIL/... markers. */
function parseFixtureCases(fixtureAbsPath) {
    let html;
    try {
        html = fs.readFileSync(fixtureAbsPath, 'utf8');
    } catch {
        return null;
    }

    // Matches e.g. `01 — PASS: role=tab, ...` inside a .case-title element.
    const caseTitleRe = /class="case-title"[^>]*>\s*(\d+)\s*[—-]+\s*([A-Z][A-Z_]*)/g;
    const cases = [];
    let m;
    while ((m = caseTitleRe.exec(html)) !== null) {
        cases.push({ n: m[1], marker: m[2] });
    }

    const counts = { PASS: 0, FAIL: 0, CANTTELL: 0, OTHER: 0 };
    for (const c of cases) {
        if (c.marker === 'PASS') counts.PASS += 1;
        else if (c.marker === 'FAIL') counts.FAIL += 1;
        else if (c.marker === 'CANTTELL') counts.CANTTELL += 1;
        else counts.OTHER += 1;
    }

    return { totalCases: cases.length, counts };
}

/** Scan test files for RULE_ID + a referenced fixtures/*.html path. */
function scanTestFiles(repoRoot, testsDirArg) {
    const testsDirAbs = path.isAbsolute(testsDirArg) ? testsDirArg : path.resolve(repoRoot, testsDirArg);
    const files = listFilesRecursive(testsDirAbs, isTestFileName);

    // ruleId -> { testFile, fixtureFile (basename or null) }
    const byRuleId = new Map();

    const ruleIdRe = /const\s+RULE_ID\s*=\s*['"]([^'"]+)['"]/;
    const fixtureRefRe = /fixtures['"]\s*,\s*['"]([\w.\-]+\.html)['"]/;
    const fixtureRefInlineRe = /fixtures\/([\w.\-]+\.html)/;

    for (const file of files) {
        let src;
        try {
            src = fs.readFileSync(file, 'utf8');
        } catch {
            continue;
        }
        const idMatch = ruleIdRe.exec(src);
        if (!idMatch) continue;
        const ruleId = idMatch[1];

        let fixtureFile = null;
        const fm = fixtureRefRe.exec(src) || fixtureRefInlineRe.exec(src);
        if (fm) fixtureFile = fm[1];

        const rel = path.relative(repoRoot, file);
        if (!byRuleId.has(ruleId)) {
            byRuleId.set(ruleId, { testFile: rel, fixtureFile });
        } else if (fixtureFile && !byRuleId.get(ruleId).fixtureFile) {
            // Prefer the entry that actually references a fixture, if an
            // earlier same-ruleId test file (e.g. a legacy duplicate) didn't.
            byRuleId.set(ruleId, { testFile: rel, fixtureFile });
        }
    }
    return byRuleId;
}

function escapeHtml(s) {
    return String(s || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

/** Self-contained HTML index: bare relative links to sibling fixture files. */
function renderHtmlIndex(rows, now) {
    const withFixture = rows.filter((r) => r.hasFixture);
    const withoutFixture = rows.filter((r) => !r.hasFixture);

    const bodyRows = withFixture.map((r) => {
        const c = r.caseCounts || { PASS: 0, FAIL: 0, CANTTELL: 0, OTHER: 0 };
        const basename = r.fixtureFile ? r.fixtureFile.split('/').pop() : '';
        const ruleId = escapeHtml(r.ruleId);
        const title = escapeHtml(r.title || '');
        const type = escapeHtml(r.type || '');
        return `<tr data-search="${ruleId.toLowerCase()} ${title.toLowerCase()}">
      <td><a href="${escapeHtml(basename)}" target="_blank" rel="noopener">${ruleId}</a></td>
      <td class="muted">${type}</td>
      <td>${title}</td>
      <td class="num">${r.totalCases}</td>
      <td class="num pass">${c.PASS || ''}</td>
      <td class="num fail">${c.FAIL || ''}</td>
      <td class="num canttell">${c.CANTTELL || ''}</td>
      <td class="num">${c.OTHER || ''}</td>
    </tr>`;
    }).join('\n');

    const missingSection = withoutFixture.length ? `
  <h2>Rules without a fixture (${withoutFixture.length})</h2>
  <ul>
    ${withoutFixture.map((r) => `<li>${escapeHtml(r.ruleId)} — <code>${escapeHtml(r.ruleFile)}</code></li>`).join('\n    ')}
  </ul>` : '';

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>surea11y Fixture Index</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.4; margin: 24px; max-width: 1100px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { font-size: 12px; opacity: 0.75; margin: 0 0 20px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin: 16px 0; flex-wrap: wrap; }
  input[type="search"] { font-size: 14px; padding: 6px 10px; border-radius: 6px; border: 1px solid #8888; min-width: 260px; background: transparent; color: inherit; }
  .count { font-size: 13px; opacity: 0.75; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border: 1px solid #8884; padding: 6px 10px; text-align: left; }
  th { position: sticky; top: 0; background: Canvas; cursor: default; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.muted { opacity: 0.7; }
  td.pass { color: #1a7f37; }
  td.fail { color: #cf222e; }
  td.canttell { color: #9a6700; }
  tr[hidden] { display: none; }
  a { color: #0969da; }
  code { font-size: 12px; }
</style>
</head>
<body>
  <h1>surea11y Fixture Index</h1>
  <p class="meta">Generated: ${now} &middot; ${withFixture.length}/${rows.length} rules have a fixture &middot; regenerate with <code>node scripts/generate-fixture-index.js</code></p>

  <div class="toolbar">
    <input type="search" id="filter" placeholder="Filter by rule id or title…" autocomplete="off">
    <span class="count" id="count"></span>
  </div>

  <table id="fixtureTable">
    <thead>
      <tr>
        <th>Rule ID (opens fixture)</th>
        <th>Type</th>
        <th>Title</th>
        <th>Cases</th>
        <th>PASS</th>
        <th>FAIL</th>
        <th>CANTTELL</th>
        <th>OTHER</th>
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>
${missingSection}

<script>
(function () {
  var input = document.getElementById('filter');
  var rows = Array.prototype.slice.call(document.querySelectorAll('#fixtureTable tbody tr'));
  var count = document.getElementById('count');
  function apply() {
    var q = input.value.trim().toLowerCase();
    var visible = 0;
    rows.forEach(function (tr) {
      var match = !q || tr.getAttribute('data-search').indexOf(q) !== -1;
      if (match) { tr.removeAttribute('hidden'); visible++; }
      else { tr.setAttribute('hidden', ''); }
    });
    count.textContent = visible + ' / ' + rows.length + ' shown';
  }
  input.addEventListener('input', apply);
  apply();
})();
</script>
</body>
</html>
`;
}

function main() {
    const args = parseArgs(process.argv);
    const repoRoot = findRepoRoot(process.cwd());

    const rules = loadRuleCatalog(repoRoot, args.checksDir);
    const testInfo = scanTestFiles(repoRoot, args.testsDir);
    const fixturesDirAbs = path.isAbsolute(args.fixturesDir) ? args.fixturesDir : path.resolve(repoRoot, args.fixturesDir);

    const rows = [];
    for (const [ruleId, meta] of rules) {
        const t = testInfo.get(ruleId) || null;
        let fixtureRel = null;
        let caseInfo = null;

        if (t && t.fixtureFile) {
            const fixtureAbs = path.join(fixturesDirAbs, t.fixtureFile);
            if (fs.existsSync(fixtureAbs)) {
                fixtureRel = path.relative(repoRoot, fixtureAbs);
                caseInfo = parseFixtureCases(fixtureAbs);
            }
        }

        rows.push({
            ruleId,
            title: meta.title,
            type: meta.type,
            wcagSc: meta.wcagSc,
            ruleFile: meta.file,
            testFile: t ? t.testFile : null,
            hasFixture: !!fixtureRel,
            fixtureFile: fixtureRel,
            totalCases: caseInfo ? caseInfo.totalCases : 0,
            caseCounts: caseInfo ? caseInfo.counts : null
        });
    }

    rows.sort((a, b) => a.ruleId.localeCompare(b.ruleId));

    const withFixture = rows.filter((r) => r.hasFixture);
    const withoutFixture = rows.filter((r) => !r.hasFixture);

    const now = new Date().toISOString();
    let md = `# Fixture Index\n\nGenerated: ${now}\n\n`;
    md += `Every implemented rule should have a \`tests/fixtures/<slug>-all-scenarios.html\` scenario page (numbered \`case_NN\` blocks, each marked PASS/FAIL/CANTTELL in its \`.case-title\`) and a "fixture coverage" test in its \`tests/engine-checks/**/<rule>.test.js\` asserting the exact expected ids. See \`docs/RULE_AUTHORING.md\`.\n\n`;
    md += `## Summary\n\n`;
    md += `Total rules: **${rows.length}**. With fixture: **${withFixture.length}**. Without fixture: **${withoutFixture.length}**.\n\n`;

    md += `## Rules WITHOUT a fixture (${withoutFixture.length})\n\n`;
    if (withoutFixture.length) {
        md += `| Rule ID | Type | Title | Rule file | Test file |\n|---|---|---|---|---|\n`;
        for (const r of withoutFixture) {
            // escapeHtml (already used for the HTML index below) also covers
            // the markdown table's HTML-tag-in-title risk here — several
            // real rule titles contain literal <area>/<canvas>/<th>/etc.
            // (see docs/RULE_CATALOG.md's generator, which had the exact
            // same gap: pipe-only escaping, no </> escaping).
            md += `| ${r.ruleId} | ${r.type || ''} | ${escapeHtml(r.title || '').replaceAll('|', '\\|')} | ${r.ruleFile} | ${r.testFile || '—'} |\n`;
        }
        md += `\n`;
    } else {
        md += `None — every rule has a fixture.\n\n`;
    }

    md += `## Rules WITH a fixture (${withFixture.length})\n\n`;
    md += `| Rule ID | Type | Fixture | Cases | PASS | FAIL | CANTTELL | OTHER |\n|---|---|---|---:|---:|---:|---:|---:|\n`;
    for (const r of withFixture) {
        const c = r.caseCounts || { PASS: 0, FAIL: 0, CANTTELL: 0, OTHER: 0 };
        md += `| ${r.ruleId} | ${r.type || ''} | \`${r.fixtureFile}\` | ${r.totalCases} | ${c.PASS} | ${c.FAIL} | ${c.CANTTELL} | ${c.OTHER} |\n`;
    }
    md += `\n`;

    fs.mkdirSync(path.dirname(path.resolve(repoRoot, args.out)), { recursive: true });
    fs.writeFileSync(path.resolve(repoRoot, args.out), md, 'utf8');
    fs.writeFileSync(
        path.resolve(repoRoot, args.json),
        JSON.stringify({ generatedAt: now, summary: { total: rows.length, withFixture: withFixture.length, withoutFixture: withoutFixture.length }, rows }, null, 2),
        'utf8'
    );

    const htmlIndex = renderHtmlIndex(rows, now);
    fs.mkdirSync(path.dirname(path.resolve(repoRoot, args.html)), { recursive: true });
    fs.writeFileSync(path.resolve(repoRoot, args.html), htmlIndex, 'utf8');

    // eslint-disable-next-line no-console
    console.log(`[fixture-index] wrote ${args.out}, ${args.json}, ${args.html} — ${withFixture.length}/${rows.length} rules have a fixture`);
}

main();