'use strict';

/**
 * What a profile may use from core, as tests/profile-boundary.test.js checks
 * it. profiles/README.md ("What a profile may use") explains each part.
 *
 * A profile is built into the engine today, but nothing in it should depend
 * on core's internals, so that it can be read, reviewed and versioned on its
 * own, and published as a package of its own later. What it may reach is what
 * core already publishes: the custom-rule contract for its rules
 * (docs/API_STABILITY.md), the package's entry points for its tests and
 * scripts, and the registry entry shape for its index.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');

// What a profile's index.js may export.
const PROFILE_EXPORTS = ['standard', 'rulesDir', 'i18nDir'];

// The `ctx` fields a rule may read, as docs/RULE_AUTHORING.md section 8.2
// lists them.
const RULE_CONTEXT = [
  'document',
  'window',
  'root',
  'rule',
  'config',
  'standard',
  'helpers',
  'engineOptions',
  'inputs',
  'contextSelector'
];

// The core files a profile's own files (its entry and tables) may require:
// WCAG's criteria per version (@surea11y/core/wcag), which a standard built on
// WCAG reads its criteria from, and the mapping of a standard linked to rules
// requirement by requirement (@surea11y/core/profile-kit). Neither loads
// engine code, so the engine can load the profile without a cycle.
const PROFILE_FILE_MODULES = ['src/wcag.js', 'src/profile-kit.js'];

// The core files a profile's tests and scripts may require, relative to the
// repository: the package's entry points (package.json "main" and "exports"),
// WCAG's criteria per version among them, which a standard's tables are
// checked against. Plus anything under tests/helpers/, the shared test
// harness.
const CORE_MODULES = [
  'src/index.js',
  'src/core.js',
  'src/baseline.js',
  'src/report.js',
  'src/sarif.js',
  'src/junit.js',
  'src/earl.js',
  'src/en301549.js',
  'src/wcag.js',
  'src/profile-kit.js'
];
const CORE_MODULE_DIRS = ['tests/helpers/'];

// The helpers docs/RULE_HELPERS.md documents, the ones a custom rule may call
// under semver: { flat, contrast, aria }, each a Set of names. A heading
// marked "(internal)" and section 8 ("Not for rule use") are left out.
function documentedHelpers(docPath = path.join(ROOT_DIR, 'docs', 'RULE_HELPERS.md')) {
  const doc = fs.readFileSync(docPath, 'utf8');
  const s7 = doc.indexOf('\n## 7)');
  const s8 = doc.indexOf('\n## 8)');
  const flat = new Set();
  for (const m of doc.slice(0, s7).matchAll(/^### (.*)$/gm)) {
    if (/\(internal\)/.test(m[1])) continue;
    for (const n of m[1].matchAll(/`([A-Za-z_]\w*)\(/g)) flat.add(n[1]);
  }
  const namespace = (name) => {
    const start = doc.indexOf(`### \`helpers.${name}.*\``, s7);
    if (start < 0) return new Set();
    const next = doc.indexOf('\n### ', start + 1);
    const end = next > 0 && next < s8 ? next : s8;
    return new Set([...doc.slice(start, end).matchAll(/`([A-Za-z_]\w*)`/g)].map((m) => m[1]));
  };
  return { flat, contrast: namespace('contrast'), aria: namespace('aria') };
}

// The helpers a rule's source calls or reads: { flat, contrast, aria }. It
// follows `const c = helpers.contrast` to the calls made through `c`, and
// destructuring from `helpers`.
function helpersUsedBy(source) {
  const used = { flat: new Set(), contrast: new Set(), aria: new Set() };
  for (const m of source.matchAll(/\bhelpers\.(contrast|aria)\.(\w+)/g)) used[m[1]].add(m[2]);
  for (const m of source.matchAll(/\bhelpers\.(\w+)/g)) {
    if (m[1] !== 'contrast' && m[1] !== 'aria') used.flat.add(m[1]);
  }
  for (const m of source.matchAll(
    /\b(?:const|let|var)\s+(\w+)\s*=\s*helpers\.(contrast|aria)\b/g
  )) {
    for (const call of source.matchAll(new RegExp(`\\b${m[1]}\\.(\\w+)\\s*\\(`, 'g'))) {
      used[m[2]].add(call[1]);
    }
  }
  for (const m of source.matchAll(
    /\b(?:const|let|var)\s*\{([^{}]*)\}\s*=\s*helpers(?:\.(contrast|aria))?\s*[;\n]/g
  )) {
    for (const name of m[1]
      .split(',')
      .map((n) => n.split(':')[0].trim())
      .filter(Boolean)) {
      used[m[2] || 'flat'].add(name);
    }
  }
  return used;
}

// The `ctx` fields a rule's source reads, from `ctx.x` and from
// `const { x, y } = ctx`.
function contextUsedBy(source) {
  const used = new Set();
  for (const m of source.matchAll(/\bctx\.(\w+)/g)) used.add(m[1]);
  for (const m of source.matchAll(/\{([^{}]*)\}\s*=\s*ctx\b/g)) {
    for (const name of m[1]
      .split(',')
      .map((n) => n.split(':')[0].trim())
      .filter(Boolean)) {
      used.add(name);
    }
  }
  return used;
}

// Every require() of a string literal in a source, as written.
function requiresOf(source) {
  return [...source.matchAll(/\brequire\(\s*(['"`])([^'"`]+)\1\s*\)/g)].map((m) => m[2]);
}

module.exports = {
  PROFILE_EXPORTS,
  RULE_CONTEXT,
  PROFILE_FILE_MODULES,
  CORE_MODULES,
  CORE_MODULE_DIRS,
  documentedHelpers,
  helpersUsedBy,
  contextUsedBy,
  requiresOf
};
