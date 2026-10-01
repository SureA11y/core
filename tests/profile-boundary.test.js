'use strict';

/**
 * Each profile under profiles/ uses only what core publishes for profiles
 * (scripts/lib/profile-contract.js, explained in profiles/README.md), and
 * core reaches a profile only through profiles/index.js. Breaking either
 * makes a profile depend on core's internals, or core on a profile's, which
 * is what keeps a profile separable.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { builtinModules } = require('node:module');

const PROFILES = require('../profiles');
const {
  PROFILE_EXPORTS,
  RULE_CONTEXT,
  PROFILE_FILE_MODULES,
  CORE_MODULES,
  CORE_MODULE_DIRS,
  documentedHelpers,
  helpersUsedBy,
  contextUsedBy,
  requiresOf
} = require('../scripts/lib/profile-contract');

const ROOT = path.join(__dirname, '..');
const PROFILES_DIR = path.join(ROOT, 'profiles');
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    .filter((f) => f.endsWith('.js'))
    .sort();
}

const isBuiltin = (spec) => spec.startsWith('node:') || builtinModules.includes(spec);
const isPackage = (spec) => !spec.startsWith('.') && !path.isAbsolute(spec);

// The resolved file a relative require names, with or without its extension.
function resolveSpec(from, spec) {
  const abs = path.resolve(path.dirname(from), spec);
  for (const candidate of [abs, `${abs}.js`, path.join(abs, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return abs;
}

const PROFILE_FOLDERS = fs
  .readdirSync(PROFILES_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(PROFILES_DIR, e.name, 'index.js')))
  .map((e) => e.name)
  .sort();

test('profiles/index.js lists every profile folder, once', () => {
  const listed = PROFILE_FOLDERS.filter((name) =>
    PROFILES.includes(require(path.join(PROFILES_DIR, name)))
  );
  assert.deepEqual(listed, PROFILE_FOLDERS, 'a profile folder is missing from profiles/index.js');
  assert.equal(new Set(PROFILES).size, PROFILES.length, 'a profile is listed twice');
  assert.equal(PROFILES.length, PROFILE_FOLDERS.length);
});

test('the documented helpers are read from docs/RULE_HELPERS.md', () => {
  const { flat, contrast, aria } = documentedHelpers();
  for (const name of ['queryAll', 'queryAllSmart', 'reportOccurrence', 'resolveTieredOutcome']) {
    assert.ok(flat.has(name), name);
  }
  assert.ok(contrast.has('contrastRatio') && aria.has('isKnownRole'));
  assert.ok(!flat.has('hasTruncatedAncestorWalk'), 'internal helpers are left out');
});

for (const name of PROFILE_FOLDERS) {
  const dir = path.join(PROFILES_DIR, name);
  const profile = require(dir);
  const inProfile = (file) => file === dir || file.startsWith(dir + path.sep);
  const ruleFiles = profile.rulesDir ? walk(profile.rulesDir) : [];

  test(`${name}: index.js exports only ${PROFILE_EXPORTS.join(', ')}, folders inside the profile`, () => {
    assert.deepEqual(
      Object.keys(profile).filter((k) => !PROFILE_EXPORTS.includes(k)),
      [],
      'unknown exports'
    );
    assert.ok(profile.standard && typeof profile.standard === 'object', 'standard is required');
    for (const key of ['rulesDir', 'i18nDir']) {
      if (profile[key] !== undefined) assert.ok(inProfile(profile[key]), `${key} is outside`);
    }
  });

  test(`${name}: its own files require only each other, WCAG's criteria and Node built-ins`, () => {
    // The files the engine loads at run time: the entry and its tables.
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.js'))
      .map((f) => path.join(dir, f));
    const allowed = new Set(PROFILE_FILE_MODULES.map((m) => path.join(ROOT, m)));
    const outside = files.flatMap((file) =>
      requiresOf(fs.readFileSync(file, 'utf8'))
        .filter((spec) => !isBuiltin(spec))
        .filter(
          (spec) =>
            isPackage(spec) ||
            (!inProfile(resolveSpec(file, spec)) && !allowed.has(resolveSpec(file, spec)))
        )
        .map((spec) => `${rel(file)}: ${spec}`)
    );
    assert.deepEqual(outside, []);
  });

  test(`${name}: its rules require nothing`, () => {
    // runInPage is serialized into the page, so a rule is self-contained.
    const found = ruleFiles.flatMap((file) =>
      requiresOf(fs.readFileSync(file, 'utf8')).map((spec) => `${rel(file)}: ${spec}`)
    );
    assert.deepEqual(found, []);
  });

  test(`${name}: its rules read only the rule context core documents`, () => {
    const found = ruleFiles.flatMap((file) =>
      [...contextUsedBy(fs.readFileSync(file, 'utf8'))]
        .filter((field) => !RULE_CONTEXT.includes(field))
        .map((field) => `${rel(file)}: ctx.${field}`)
    );
    assert.deepEqual(found, []);
  });

  test(`${name}: its rules call only the helpers docs/RULE_HELPERS.md documents`, () => {
    const documented = documentedHelpers();
    const found = ruleFiles.flatMap((file) => {
      const used = helpersUsedBy(fs.readFileSync(file, 'utf8'));
      return [
        ...[...used.flat]
          .filter((n) => !documented.flat.has(n) && n !== 'contrast' && n !== 'aria')
          .map((n) => `helpers.${n}`),
        ...[...used.contrast]
          .filter((n) => !documented.contrast.has(n) && n !== 'sharedCache')
          .map((n) => `helpers.contrast.${n}`),
        ...[...used.aria].filter((n) => !documented.aria.has(n)).map((n) => `helpers.aria.${n}`)
      ].map((h) => `${rel(file)}: ${h}`);
    });
    assert.deepEqual(found, []);
  });

  test(`${name}: every rule carries the standard's rule tag, so no WCAG scan runs it`, () => {
    const tag = profile.standard.ruleTag;
    if (!ruleFiles.length) return;
    assert.ok(tag, 'a profile with rules needs a ruleTag');
    const untagged = ruleFiles
      .map((file) => [file, require(file)])
      .filter(([, mod]) => !((mod.meta && mod.meta.tags) || []).includes(tag))
      .map(([file]) => rel(file));
    assert.deepEqual(untagged, []);
  });

  test(`${name}: its tests and scripts require from core only its published modules`, () => {
    const allowed = new Set(CORE_MODULES.map((m) => path.join(ROOT, m)));
    const files = walk(path.join(dir, 'tests')).concat(walk(path.join(dir, 'scripts')));
    const found = files.flatMap((file) =>
      requiresOf(fs.readFileSync(file, 'utf8'))
        .filter((spec) => !isBuiltin(spec) && !isPackage(spec))
        .map((spec) => [spec, resolveSpec(file, spec)])
        .filter(([, abs]) => !inProfile(abs) && !allowed.has(abs))
        .filter(([, abs]) => !CORE_MODULE_DIRS.some((d) => rel(abs).startsWith(d)))
        .map(([spec]) => `${rel(file)}: ${spec}`)
    );
    assert.deepEqual(found, []);
  });

  test(`${name}: its dictionaries hold only the messages of its rules and its entry`, () => {
    if (!profile.i18nDir) return;
    const prefixes = ruleFiles
      .map((file) => require(file).meta)
      .map((meta) => meta && meta.i18n && meta.i18n.titleKey)
      .filter(Boolean)
      .map((key) => key.replace(/_title$/, '_'));
    const own = new Set(
      [profile.standard.report && profile.standard.report.noteKey].filter(Boolean)
    );
    const en = JSON.parse(fs.readFileSync(path.join(profile.i18nDir, 'en.json'), 'utf8'));
    const stray = Object.keys(en).filter(
      (key) => !own.has(key) && !prefixes.some((p) => key.startsWith(p))
    );
    assert.deepEqual(stray, []);
  });
}

test('core reaches a profile only through profiles/index.js', () => {
  // src/rgaa.js is the one exception: RGAA's public entry point
  // (@surea11y/core/rgaa) reads the profile's table, and would move with the
  // profile if it became a package of its own. src/core.js is generated and
  // requires every rule, the profiles' included.
  const EXCEPTIONS = new Set(['src/rgaa.js', 'src/core.js']);
  const files = walk(path.join(ROOT, 'src')).filter((f) => !EXCEPTIONS.has(rel(f)));
  const found = files.flatMap((file) =>
    requiresOf(fs.readFileSync(file, 'utf8'))
      .filter((spec) => spec.startsWith('.'))
      .map((spec) => [spec, resolveSpec(file, spec)])
      .filter(([, abs]) => abs.startsWith(PROFILES_DIR + path.sep))
      .filter(([, abs]) => abs !== path.join(PROFILES_DIR, 'index.js'))
      .map(([spec]) => `${rel(file)}: ${spec}`)
  );
  assert.deepEqual(found, []);
});
