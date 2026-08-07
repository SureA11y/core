'use strict';

/**
 * a11yCore automatic rule validator (contract + safety + i18n + determinism)
 *
 * Usage:
 *   node validate-rule.js path/to/rule.js
 *
 * Intended to be placed at:
 *   scripts/validate-rule.js
 *
 * This validator is repo-faithful:
 * - validates rule module exports + meta contract
 * - validates runInPage serialization safety (no outer-scope refs)
 * - runs rule through engine (runOnly) on probe HTML
 * - asserts allowed outcomes + occurrence invariants
 * - checks determinism (deep equality over JSON-clone)
 * - verifies required i18n keys exist in src/i18n/en*.js
 * - enforces expected tag conventions (atomic + type + wcag sc tags)
 *
 * - Rule validation policy:
 *
 * - automatic checks:
 * -   - meta.type === 'automatic'
 * -   - normativeMappings MUST be non-empty
 * -   - outcomes: pass | fail | notApplicable
 *
 * - manual checks:
 * -   - meta.type === 'manual'
 * -   - normativeMappings MUST be []
 * -   - outcomes: cantTell | notApplicable
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Adjust these imports to match your repo layout if needed
const { runa11yCoreOnHtml } = require('../tests/helpers/runDomRulesOnHtml.js');
const { assertRule } = require('../tests/helpers/assertRule.js');
const { versionTagPrefixForScs } = require('../src/coverage/wcag-version-map.js');

function loadWcagFacetsRegistry(repoRoot) {
  const p = path.join(repoRoot, 'src', 'coverage', 'wcag-facets.js');
  assert.ok(fs.existsSync(p), `Expected WCAG facets registry at ${p}`);

  const mod = require(p);
  const FACETS = mod && (mod.FACETS || (mod.default && mod.default.FACETS));
  assert.ok(FACETS && typeof FACETS === 'object', `wcag-facets.js must export { FACETS }: ${p}`);

  const byId = new Map();
  const all = [];

  for (const [sc, bucket] of Object.entries(FACETS)) {
    assert.ok(bucket && typeof bucket === 'object', `FACETS["${sc}"] must be an object (${p})`);
    assert.ok(isNonEmptyString(bucket.title), `FACETS["${sc}"].title must be non-empty (${p})`);
    assert.ok(Array.isArray(bucket.facets), `FACETS["${sc}"].facets must be an array (${p})`);

    const seenInThisSc = new Set();
    for (const f of bucket.facets) {
      assert.ok(f && typeof f === 'object', `Facet entries must be objects (${p})`);
      assert.ok(isNonEmptyString(f.id), `Facet.id must be non-empty (${p})`);
      assert.ok(isNonEmptyString(f.label), `Facet.label must be non-empty (${p})`);
      assert.ok(isNonEmptyString(f.automation), `Facet.automation must be non-empty (${p})`);

      // Uniqueness within this SC's own facets array only. The same facet id
      // legitimately repeats ACROSS different SCs when one rule/facet genuinely
      // satisfies multiple SCs at once (e.g. scrollable-region-focusable-evidence
      // under both 2.1.1 and 2.1.3, mirroring the rule's own dual-mapped
      // coverage.facetsBySc) — that's intentional dual-mapping, not a data bug.
      assert.ok(
        !seenInThisSc.has(f.id),
        `Duplicate facet id "${f.id}" listed twice within SC ${sc} in ${p}`
      );
      seenInThisSc.add(f.id);

      if (!byId.has(f.id)) byId.set(f.id, { ...f, sc });
      all.push({ ...f, sc });
    }
  }

  return { FACETS, byId, all, path: p };
}

function validateFacetLabelsNoHtmlEscaping(allFacets, registryPath) {
  const bad = ['&lt;', '&gt;', '&quot;', '&#34;', '&#39;', '&apos;'];
  for (const f of allFacets) {
    for (const token of bad) {
      assert.ok(
        !f.label.includes(token),
        `Facet label appears HTML-escaped (${token}). Use literal characters instead. Facet: ${f.id} (SC ${f.sc}) in ${registryPath}`
      );
    }
  }
}

function validateRuleFacetsExistInRegistry(meta, facetsById, registryPath, rulePath) {
  for (const sc of meta.wcagSc) {
    const facets = meta.coverage.facetsBySc[sc] || [];
    for (const facetId of facets) {
      assert.ok(
        facetsById.has(facetId),
        `Rule (${rulePath}) references unknown facet id "${facetId}" for SC ${sc}. Add it to ${registryPath} or fix typo.`
      );
    }
  }
}

function validateRuleDoesNotUseMacroFacets(meta, facetsById, registryPath, rulePath) {
  if (meta.type !== 'automatic') return; // allow manual checks
  for (const sc of meta.wcagSc) {
    const usedFacets = meta.coverage.facetsBySc[sc] || [];
    for (const facetId of usedFacets) {
      const facet = facetsById.get(facetId);
      if (!facet) continue; // already validated elsewhere

      if (facet.macro === true) {
        assert.fail(
          `Rule (${rulePath}) references macro facet "${facetId}" for SC ${sc}.\n` +
            `Macro facets are coverage-level only and MUST NOT be referenced from rule meta.\n` +
            `Facet registry: ${registryPath}`
        );
      }
    }
  }
}

function isNonEmptyString(x) {
  return typeof x === 'string' && x.trim().length > 0;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function deepCloneJson(x) {
  return JSON.parse(JSON.stringify(x));
}

function normalizeScTag(sc) {
  // e.g. "1.1.1" -> "wcag111"
  return `wcag${String(sc).replace(/\./g, '')}`;
}

function expectedLevelTagFromMappings(mappings, informativeReferences, wcagSc) {
  // Observed tags in this repo follow wcag2a / wcag2aa / wcag2aaa for WCAG-2.0-baseline
  // SCs, and wcag21a/wcag21aa/wcag21aaa or wcag22a/wcag22aa/wcag22aaa (never a plain
  // wcag2* alongside) for SCs introduced in WCAG 2.1/2.2 -- see
  // src/coverage/wcag-version-map.js, the canonical source for which SCs are which.
  // Automatic checks: derive from normativeMappings.conformanceLevel.
  // Manual checks: normativeMappings is empty by design; derive from informativeReferences if present, else default to level A.
  const list =
    Array.isArray(mappings) && mappings.length > 0
      ? mappings
      : Array.isArray(informativeReferences)
        ? informativeReferences
        : [];

  const levels = new Set(
    list.map((m) => String((m && m.conformanceLevel) || '').toUpperCase()).filter(Boolean)
  );
  const prefix = versionTagPrefixForScs(wcagSc);
  if (levels.has('AAA')) return `${prefix}aaa`;
  if (levels.has('AA')) return `${prefix}aa`;
  // Default (also matches the majority of existing tags)
  return `${prefix}a`;
}

function loadEnDictionary(repoRoot) {
  const dir = path.join(repoRoot, 'src', 'i18n');
  assert.ok(fs.existsSync(dir), `Expected i18n directory at ${dir}`);

  // Be tolerant: user mentioned en.s (likely typo); we accept en.js, en*.js
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^en.*\.js$/i.test(f))
    .sort();
  assert.ok(files.length > 0, `No English dictionary found in ${dir} (expected en*.js)`);

  // Prefer en.js if present, otherwise first en*.js.
  const preferred = files.includes('en.js') ? 'en.js' : files[0];
  const enPath = path.join(dir, preferred);

  // Require as CommonJS; if your dictionaries are ESM, switch to dynamic import.
  // In this repo, they are CommonJS-compatible.
  const mod = require(enPath);
  const dict = mod && (mod.default || mod);
  assert.ok(
    dict && typeof dict === 'object',
    `English dictionary must export an object: ${enPath}`
  );

  return { dict, enPath };
}

function validateI18nKeyExists(dict, key, context) {
  assert.ok(isNonEmptyString(key), `${context}: i18n key must be non-empty string`);
  assert.ok(hasOwn(dict, key), `${context}: i18n key not found in English dictionary: ${key}`);
  assert.ok(
    typeof dict[key] === 'string',
    `${context}: English dictionary value must be a string for key: ${key}`
  );
}

function extractI18nKeysFromSource(runFilePath) {
  // Conservative extraction: find string literals assigned to *Key properties.
  // This catches the real-world pattern used in your rule family:
  //   titleKey: '...'
  //   descriptionKey: '...'
  //   summaryKey: '...'
  //   hintKey: '...'
  const src = fs.readFileSync(runFilePath, 'utf8');
  const keys = new Set();

  const re = /\b(?:titleKey|descriptionKey|summaryKey|hintKey)\s*:\s*(['"])(.*?)\1/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[2]) keys.add(m[2]);
  }
  return { keys: Array.from(keys), src };
}

function validateMeta(meta) {
  const required = [
    'title',
    'description',
    'i18n',
    'helpUrl',
    'tags',
    'wcagSc',
    'normativeMappings',
    'defaultSeverity',
    'category',
    'type',
    'defaultConfidence',
    'coverage'
  ];
  for (const k of required) {
    assert.ok(hasOwn(meta, k), `meta missing required key: ${k}`);
  }

  assert.ok(isNonEmptyString(meta.title), 'meta.title must be non-empty string');
  assert.ok(isNonEmptyString(meta.description), 'meta.description must be non-empty string');

  assert.ok(meta.i18n && typeof meta.i18n === 'object', 'meta.i18n must be object');
  assert.ok(isNonEmptyString(meta.i18n.titleKey), 'meta.i18n.titleKey must be non-empty string');
  assert.ok(
    isNonEmptyString(meta.i18n.descriptionKey),
    'meta.i18n.descriptionKey must be non-empty string'
  );

  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0, 'meta.tags must be non-empty array');

  // wcagSc: automatic checks are always WCAG-normative and must declare at least one SC.
  // Manual checks come in two shapes: a pure "Best Practice" advisory rule with NO WCAG SC
  // at all (wcagSc: [], normativeMappings: [], coverage: {} -- Tier 1b, see ROADMAP.md), or a
  // WCAG-SC-tied quality/manual-review rule (wcagSc non-empty, e.g. the *-quality-manual
  // family) that otherwise follows the same shape as an automatic rule's mappings.
  assert.ok(Array.isArray(meta.wcagSc), 'meta.wcagSc must be an array');
  if (meta.type === 'automatic') {
    assert.ok(meta.wcagSc.length > 0, 'meta.wcagSc must be non-empty array for automatic checks');
  }

  assert.ok(Array.isArray(meta.normativeMappings), 'meta.normativeMappings must be an array');

  if (meta.type === 'automatic' || meta.type === 'manual') {
    if (meta.type === 'automatic') {
      assert.ok(
        meta.normativeMappings.length > 0,
        'meta.normativeMappings must be non-empty array for automatic checks'
      );
    }
    // wcagSc and normativeMappings must be consistently empty or both populated -- a
    // Tier 1b advisory rule declares neither; every other rule (automatic, or a manual
    // quality-review rule) declares both, aligned 1:1 below.
    assert.ok(
      (meta.wcagSc.length === 0) === (meta.normativeMappings.length === 0),
      'meta.wcagSc and meta.normativeMappings must be consistently empty or both non-empty'
    );
    for (const mm of meta.normativeMappings) {
      assert.ok(mm && typeof mm === 'object', 'normativeMappings entries must be objects');
      for (const kk of ['standard', 'version', 'requirement', 'title', 'conformanceLevel']) {
        assert.ok(isNonEmptyString(mm[kk]), `normativeMappings entry missing/empty: ${kk}`);
      }
    }
    // Ensure mappings align with wcagSc
    for (const sc of meta.wcagSc) {
      assert.ok(
        meta.normativeMappings.some((mm) => mm.requirement === sc),
        `meta.normativeMappings must include requirement matching wcagSc: ${sc}`
      );
    }
  } else {
    assert.fail(`meta.type must be "automatic" or "manual" (got: ${meta.type})`);
  }

  // coverage facets (only applies to SC-tied rules; a Tier 1b wcagSc:[] rule has none --
  // its coverage is legitimately {}, since coverage.facetsBySc is WCAG-SC-keyed only)
  assert.ok(meta.coverage && typeof meta.coverage === 'object', 'meta.coverage must be object');
  if (meta.wcagSc.length > 0) {
    assert.ok(
      meta.coverage.facetsBySc && typeof meta.coverage.facetsBySc === 'object',
      'meta.coverage.facetsBySc must be object'
    );
    for (const sc of meta.wcagSc) {
      const facets = meta.coverage.facetsBySc[sc];
      assert.ok(
        Array.isArray(facets) && facets.length > 0,
        `coverage.facetsBySc must include non-empty facets array for SC ${sc}`
      );
    }
  }
}

function validateTags(meta) {
  const tags = new Set(meta.tags.map(String));

  // Required repo conventions
  assert.ok(tags.has('atomic'), 'meta.tags must include "atomic"');
  assert.ok(tags.has(meta.type), `meta.tags must include "${meta.type}"`);

  if (meta.wcagSc.length === 0) {
    // Tier 1b: a pure "Best Practice" advisory rule with no WCAG SC at all carries
    // 'best-practice' instead of any wcag2*/wcag21*/wcag22* level tag.
    assert.ok(
      tags.has('best-practice'),
      'meta.tags must include "best-practice" for a rule with no wcagSc (Tier 1b advisory)'
    );
    return;
  }

  // WCAG level tag derived from mappings (automatic) or informative refs (manual) or default.
  const expectedLevel = expectedLevelTagFromMappings(
    meta.normativeMappings,
    meta.informativeReferences,
    meta.wcagSc
  );
  assert.ok(
    tags.has(expectedLevel),
    `meta.tags must include conformance level tag "${expectedLevel}" derived from mappings/references`
  );

  // SC tags derived from wcagSc (applies to both automatic and manual)
  for (const sc of meta.wcagSc) {
    const scTag = normalizeScTag(sc);
    assert.ok(
      tags.has(scTag),
      `meta.tags must include SC tag "${scTag}" derived from wcagSc (${sc})`
    );
  }
}

function validateRunInPageSerialization(runInPage) {
  assert.equal(typeof runInPage, 'function', 'runInPage must be a function');

  const src = Function.prototype.toString.call(runInPage);

  // IMPORTANT: Avoid false positives for common DOM usage like:
  //   el.id, getAttribute("id"), html snippets containing `id="..."`, etc.
  //
  // Strategy:
  // 1) Strip comments
  // 2) Strip string/template literals (replace their contents with blanks)
  // 3) Then scan for forbidden identifiers as standalone tokens (not property access)
  function stripCommentsAndStrings(code) {
    let out = code;

    // Remove block comments /* ... */
    out = out.replace(/\/\*[\s\S]*?\*\//g, ' ');
    // Remove line comments // ...
    out = out.replace(/(^|[^:])\/\/.*$/gm, '$1 ');

    // Remove template literals `...` (best-effort; does not evaluate ${} content)
    out = out.replace(/`(?:\\[\s\S]|[^`\\])*`/g, ' ` ` ');

    // Remove single-quoted strings '...'
    out = out.replace(/'(?:\\.|[^'\\])*'/g, " ' ' ");

    // Remove double-quoted strings "..."
    out = out.replace(/"(?:\\.|[^"\\])*"/g, ' " " ');

    return out;
  }

  const scan = stripCommentsAndStrings(src);

  // Forbidden patterns (standalone identifiers, not property access)
  // - meta: would indicate outer-scope meta reference
  // - id: would indicate outer-scope id reference
  //
  // We intentionally allow `.id` property access, strings containing "id", and
  // `id: ...`/`meta: ...` used as an object-literal property KEY (a common,
  // safe pattern for reporting e.g. `data: { details: { id: refId } }`) — a
  // property key is never evaluated as an outer-scope variable reference,
  // unlike a bare `id`/`meta` token or the `{ id }` shorthand (still caught,
  // since it isn't followed by a colon).
  const forbidden = [
    { re: /(?<![.\w$])meta(?![\w$])(?!\s*:)/g, name: 'meta' },
    { re: /(?<![.\w$])id(?![\w$])(?!\s*:)/g, name: 'id' },
    { re: /\brequire\s*\(/g, name: 'require(' },
    { re: /\bimport\b/g, name: 'import' }
  ];

  for (const { re, name } of forbidden) {
    assert.ok(!re.test(scan), `runInPage source appears to reference forbidden token: ${name}`);
  }
}

function validateOccurrencesShape(ruleResult) {
  const occs = ruleResult.occurrences || [];
  for (const o of occs) {
    assert.ok(typeof o === 'object' && o, 'occurrence must be object');
    assert.ok(typeof o.html === 'string', 'occurrence.html must be string');
    assert.ok(typeof o.summary === 'string', 'occurrence.summary must be string');
    assert.ok(typeof o.hint === 'string', 'occurrence.hint must be string');

    if (o.i18n != null) {
      assert.ok(typeof o.i18n === 'object', 'occurrence.i18n must be object or null');
      assert.ok(
        isNonEmptyString(o.i18n.summaryKey),
        'occurrence.i18n.summaryKey must be non-empty'
      );
      assert.ok(isNonEmptyString(o.i18n.hintKey), 'occurrence.i18n.hintKey must be non-empty');
      if (o.i18n.params != null) {
        assert.ok(
          typeof o.i18n.params === 'object',
          'occurrence.i18n.params must be object when present'
        );
      }
    }

    assert.ok(o.data && typeof o.data === 'object', 'occurrence.data must exist');
    // data.visibilityFilter is documented as optional (docs/OUTPUT_SCHEMA.md: "Present on
    // most occurrences" -- not a universal requirement, e.g. rules with no single
    // accessibility-tree-eligibility-relevant target element legitimately omit it).
    // Validate its shape only when the rule actually provided one.
    if (o.data.visibilityFilter != null) {
      const vf = o.data.visibilityFilter;
      assert.ok(
        typeof vf === 'object',
        'occurrence.data.visibilityFilter must be object when present'
      );
      assert.ok('targetSet' in vf, 'visibilityFilter.targetSet required');
      assert.ok('accEligible' in vf, 'visibilityFilter.accEligible required');
      assert.ok('reasons' in vf, 'visibilityFilter.reasons required');
    }
  }
}

function validateOutcomeOccurrenceInvariants(ruleResult, isAutomatic) {
  const occCount = (ruleResult.occurrences || []).length;

  if (isAutomatic) {
    const ok = new Set(['pass', 'fail', 'notApplicable']);
    assert.ok(
      ok.has(ruleResult.outcome),
      `automatic rule outcome must be one of ${Array.from(ok).join(', ')}`
    );

    if (ruleResult.outcome === 'fail') {
      assert.ok(occCount >= 1, 'fail outcome must include >= 1 occurrence');
    } else {
      // In this ruleset, pass and notApplicable are expected to carry no occurrences
      assert.ok(occCount === 0, `${ruleResult.outcome} outcome must include 0 occurrences`);
    }
  } else {
    const ok = new Set(['cantTell', 'notApplicable']);
    assert.ok(
      ok.has(ruleResult.outcome),
      `manual rule outcome must be one of ${Array.from(ok).join(', ')}`
    );

    if (ruleResult.outcome === 'cantTell') {
      assert.ok(occCount >= 1, 'cantTell outcome must include >= 1 occurrence');
    } else {
      assert.ok(occCount === 0, 'notApplicable outcome must include 0 occurrences');
    }
  }
}

function validateDeterminism(runFn, ruleIdForFocus) {
  function sanitizeEngineOutput(x) {
    const y = deepCloneJson(x);

    // Engine-level dynamic fields
    if (y && typeof y === 'object') {
      if ('timestamp' in y) delete y.timestamp;
      if ('durationMs' in y) delete y.durationMs;
      if ('duration' in y) delete y.duration;
      if ('timings' in y) delete y.timings;
    }

    // Focus determinism on a single rule when requested to avoid unrelated rule noise.
    if (ruleIdForFocus) {
      const r = getRuleResultFromEngineOutput(y, ruleIdForFocus);
      return r ? deepCloneJson(r) : null;
    }

    return y;
  }

  const r1 = sanitizeEngineOutput(runFn());
  const r2 = sanitizeEngineOutput(runFn());

  assert.deepStrictEqual(
    r1,
    r2,
    'engine output must be deterministic (deepStrictEqual after sanitizing expected dynamic fields like timestamp)'
  );
}

function getRuleResultFromEngineOutput(engineOutput, ruleId) {
  if (!engineOutput) return null;

  // Your engine outputs results in these arrays:
  // - rulesResults: automatic + manual rule results
  // - checksResults: (sometimes) check-like results
  const arrays = [
    engineOutput.rulesResults,
    engineOutput.checksResults,
    engineOutput.rules, // legacy / other shapes
    engineOutput.results, // generic
    engineOutput.ruleResults // generic
  ];

  for (const arr of arrays) {
    if (Array.isArray(arr)) {
      const found = arr.find((r) => r && (r.ruleId === ruleId || r.id === ruleId));
      if (found) return found;
    }
  }

  // Map-style containers (just in case)
  const maps = [engineOutput.byRuleId, engineOutput.resultsByRuleId, engineOutput.ruleResultsById];
  for (const m of maps) {
    if (m && typeof m === 'object' && m[ruleId]) return m[ruleId];
  }

  return null;
}

function main() {
  const rulePathArg = process.argv[2];
  if (!rulePathArg) {
    console.error('Usage: node validate-rule.js path/to/rule.js');
    process.exit(2);
  }

  const ruleAbsPath = path.resolve(rulePathArg);
  const repoRoot = process.cwd();

  // Load module
  const mod = require(ruleAbsPath);

  // Exports
  assert.ok(mod && typeof mod === 'object', 'rule module must export an object');
  for (const k of ['id', 'meta', 'runInPage']) {
    assert.ok(hasOwn(mod, k), `module missing export: ${k}`);
  }

  const keys = Object.keys(mod).sort();
  assert.deepStrictEqual(
    keys,
    ['id', 'meta', 'runInPage'],
    `module must export exactly id, meta, runInPage (got: ${keys.join(', ')})`
  );

  // id
  assert.ok(isNonEmptyString(mod.id), 'id must be non-empty string');
  assert.ok(mod.id.startsWith(''), 'id must start with ');

  // meta + tags
  validateMeta(mod.meta);

  // Facet registry checks (coverage contract)
  const {
    byId: facetById,
    all: allFacets,
    path: facetRegistryPath
  } = loadWcagFacetsRegistry(repoRoot);

  validateFacetLabelsNoHtmlEscaping(allFacets, facetRegistryPath);
  validateRuleFacetsExistInRegistry(mod.meta, facetById, facetRegistryPath, ruleAbsPath);
  validateRuleDoesNotUseMacroFacets(mod.meta, facetById, facetRegistryPath, ruleAbsPath);

  const isAutomatic = mod.meta.type === 'automatic';
  const isManual = mod.meta.type === 'manual';
  assert.ok(isAutomatic || isManual, 'meta.type must be "automatic" or "manual"');

  validateTags(mod.meta);

  // runInPage serialization safety
  validateRunInPageSerialization(mod.runInPage);

  // i18n dictionary loading
  const { dict: enDict, enPath } = loadEnDictionary(repoRoot);

  // Validate meta i18n keys exist
  validateI18nKeyExists(enDict, mod.meta.i18n.titleKey, 'meta.i18n.titleKey');
  validateI18nKeyExists(enDict, mod.meta.i18n.descriptionKey, 'meta.i18n.descriptionKey');

  // Validate i18n keys referenced in source (static extraction)
  const { keys: staticKeys } = extractI18nKeysFromSource(ruleAbsPath);
  for (const k of staticKeys) {
    validateI18nKeyExists(enDict, k, 'static i18n key');
  }

  // Runtime validation via engine
  const RULE_ID = mod.id;
  console.log('RULE_ID:', RULE_ID);

  // Probe HTML inputs (rule-specific checks should still exist; this is a safety harness)
  const htmlNoTargets = '<!doctype html><html><body><p>none</p></body></html>';

  // A generic probe that tends to provide at least one element for image-related checks.
  // For non-image checks, you should still rely on the rule’s dedicated .test.js, but this should not throw.
  const htmlProbe =
    '<!doctype html><html><body>' +
    '<img id="probe_img_ok" src="x.png" alt="ok">' +
    '<img id="probe_img_missing" src="x.png">' +
    '<map name="m"><area id="probe_area" href="#x"></area></map>' +
    '<input id="probe_input_image" type="image" src="x.png">' +
    '<canvas id="probe_canvas"></canvas>' +
    '<object id="probe_object" data="x.swf"></object>' +
    '<embed id="probe_embed" src="x.swf">' +
    '<svg id="probe_svg" xmlns="http://www.w3.org/2000/svg"></svg>' +
    '<video id="probe_video" poster="x.png"></video>' +
    '</body></html>';

  const runOn = (html) => runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // No-throws + determinism
  validateDeterminism(() => runOn(htmlNoTargets), RULE_ID);
  validateDeterminism(() => runOn(htmlProbe), RULE_ID);

  // Extract rule result and validate shape + outcome invariants
  const out = runOn(htmlProbe);
  const ruleRes = getRuleResultFromEngineOutput(out, RULE_ID);
  assert.ok(ruleRes, `engine output must include rule result for ${RULE_ID}`);

  validateOccurrencesShape(ruleRes);
  validateOutcomeOccurrenceInvariants(ruleRes, isAutomatic);

  // Validate runtime occurrence i18n keys exist in en dict (for occurrences produced by the probe)
  for (const o of ruleRes.occurrences || []) {
    if (o && o.i18n) {
      validateI18nKeyExists(enDict, o.i18n.summaryKey, 'occurrence.i18n.summaryKey');
      validateI18nKeyExists(enDict, o.i18n.hintKey, 'occurrence.i18n.hintKey');
    }
  }

  console.log(`✅ Rule validated: ${RULE_ID}`);
  console.log(`   English dictionary: ${enPath}`);
}

main();
