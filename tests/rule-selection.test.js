'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

function loadCore() {
  // Prefer repo-relative src/core.js, but tolerate different cwd layouts.
  const candidates = [
    path.join(__dirname, '..', 'src', 'core.js'),
    path.join(process.cwd(), 'src', 'core.js'),
    path.join(process.cwd(), 'dist', 'core.js'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error(`Could not locate src/core.js. Tried:\n${candidates.join('\n')}`);
}

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) { seen.add(x); out.push(x); }
  }
  return out;
}

function parseCommaString(s, { lower = false } = {}) {
  if (s == null) return [];
  if (Array.isArray(s)) {
    const vals = s.map(String).map((x) => x.trim()).filter(Boolean);
    return uniq((lower ? vals.map((x) => x.toLowerCase()) : vals));
  }
  if (typeof s !== 'string') return [];
  const vals = s.split(',').map((x) => String(x).trim()).filter(Boolean);
  return uniq((lower ? vals.map((x) => x.toLowerCase()) : vals));
}

function normalizeIncludeMode(mode) {
  const m = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return m === 'or' ? 'or' : 'and';
}

function ruleIdMatches(candidate, ruleId, engineTag) {
  if (!candidate || !ruleId) return false;
  if (candidate === ruleId) return true;

  const prefix = (engineTag ? String(engineTag) : '') + '-';
  if (ruleId.startsWith(prefix) && candidate === ruleId.slice(prefix.length)) return true;
  if (candidate.startsWith(prefix) && candidate.slice(prefix.length) === ruleId) return true;

  return false;
}

function hasAnyRunOnlyKeys(ro) {
  if (!ro || typeof ro !== 'object') return false;
  if (ro.type === 'tag' && Array.isArray(ro.values) && ro.values.length) return true;
  if (Array.isArray(ro.tags) && ro.tags.length) return true;
  if (Array.isArray(ro.excludeTags) && ro.excludeTags.length) return true;
  if (Array.isArray(ro.includeRuleIds) && ro.includeRuleIds.length) return true;
  if (Array.isArray(ro.excludeRuleIds) && ro.excludeRuleIds.length) return true;
  if (typeof ro.includeMode === 'string' && ro.includeMode.trim()) return true;
  return false;
}

/**
 * Reference implementation of effective selection semantics (mirrors build-core.updated.js logic):
 * - If runOnly is non-empty => it takes precedence.
 * - Else derive from engineOptions.checks/tags/includeMode.
 * - includeMode affects only the combination between includeRuleIds and includeTags.
 * - includeTags are ANY-match (intersection within tags is not supported).
 * - excludes always subtract after includes.
 */
function referenceSelectedRuleIds(core, engineOptions, runOnly) {
  const defs = Array.isArray(core.CHECK_DEFS) ? core.CHECK_DEFS : [];
  const ENGINE_TAG = core.ENGINE_TAG || 'a11ycore';

  // Normalize to arrays
  let includeMode = 'and';
  let includeRuleIds = [];
  let excludeRuleIds = [];
  let includeTags = [];
  let excludeTags = [];

  if (hasAnyRunOnlyKeys(runOnly)) {
    includeMode = normalizeIncludeMode(runOnly.includeMode);

    // legacy reference-engine-like
    if (runOnly && runOnly.type === 'tag' && Array.isArray(runOnly.values)) {
      includeTags = parseCommaString(runOnly.values, { lower: true });
    } else {
      includeTags = parseCommaString(runOnly && runOnly.tags, { lower: true });
      excludeTags = parseCommaString(runOnly && runOnly.excludeTags, { lower: true });
      includeRuleIds = parseCommaString(runOnly && runOnly.includeRuleIds, { lower: false });
      excludeRuleIds = parseCommaString(runOnly && runOnly.excludeRuleIds, { lower: false });
    }
  } else {
    const eo = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
    includeMode = normalizeIncludeMode(eo.includeMode);
    const rules = (eo.rules && typeof eo.rules === 'object') ? eo.rules : null;
    const tags = (eo.tags && typeof eo.tags === 'object') ? eo.tags : null;
    includeRuleIds = parseCommaString(rules && rules.include, { lower: false });
    excludeRuleIds = parseCommaString(rules && rules.exclude, { lower: false });
    includeTags = parseCommaString(tags && tags.include, { lower: true });
    excludeTags = parseCommaString(tags && tags.exclude, { lower: true });
  }

  function matches(def) {
    const defTags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];
    const hasIdInclude = includeRuleIds.length > 0;
    const hasTagInclude = includeTags.length > 0;

    let idMatch = true;
    let tagMatch = true;

    if (hasIdInclude) {
      idMatch = includeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, ENGINE_TAG));
    }
    if (hasTagInclude) {
      tagMatch = defTags.some((t) => includeTags.includes(t));
    }

    // Includes
    if (hasIdInclude || hasTagInclude) {
      if (includeMode === 'or' && hasIdInclude && hasTagInclude) {
        if (!(idMatch || tagMatch)) return false;
      } else {
        if (hasIdInclude && !idMatch) return false;
        if (hasTagInclude && !tagMatch) return false;
      }
    }

    // Excludes
    if (excludeRuleIds.length) {
      const blocked = excludeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, ENGINE_TAG));
      if (blocked) return false;
    }
    if (excludeTags.length) {
      const blockedTag = defTags.some((t) => excludeTags.includes(t));
      if (blockedTag) return false;
    }

    return true;
  }

  return defs.filter(matches).map((d) => d.ruleId);
}

function gotSelectedRuleIds(core, runOnly, engineOptions) {
  const entries = core.getChecksForRunOnly(runOnly, engineOptions);
  assert.ok(Array.isArray(entries), 'getChecksForRunOnly must return an array');
  return entries.map((e) => e.ruleId);
}

function assertSelection(core, name, engineOptions, runOnly) {
  const got = gotSelectedRuleIds(core, runOnly, engineOptions);
  const expected = referenceSelectedRuleIds(core, engineOptions, runOnly);
  try {
    assert.deepEqual(got, expected);
  } catch (e) {
    // enrich failure message
    e.message = `${name}\n\nengineOptions=${JSON.stringify(engineOptions)}\nrunOnly=${JSON.stringify(runOnly)}\n\n${e.message}`;
    throw e;
  }
}

function buildTagIndex(defs) {
  const index = new Map(); // tag -> ruleIds
  for (const d of defs) {
    const tags = Array.isArray(d.tags) ? d.tags.map((t) => String(t).toLowerCase()) : [];
    for (const t of tags) {
      if (!index.has(t)) index.set(t, []);
      index.get(t).push(d.ruleId);
    }
  }
  // de-dupe + stable order
  for (const [t, ids] of index.entries()) {
    index.set(t, uniq(ids));
  }
  return index;
}

function findSharedNonUniversalTag(defs, tagIndex) {
  // Prefer a tag that appears in >=2 checks but not in all checks,
  // so we can pick both a rule-with-tag and a rule-without-tag deterministically.
  const total = defs.length;
  const entries = [...tagIndex.entries()]
      .filter(([, ids]) => ids.length >= 2 && ids.length < total)
      .sort((a, b) => {
        // deterministic: prefer rarer tags first, then lexicographic
        const da = a[1].length - b[1].length;
        if (da !== 0) return da;
        return String(a[0]).localeCompare(String(b[0]));
      });
  return entries.length ? entries[0] : null;
}

const core = loadCore();

test('rule selection: sanity - CHECK_DEFS has content', () => {
  assert.ok(Array.isArray(core.CHECK_DEFS), 'CHECK_DEFS should be an array');
  assert.ok(core.CHECK_DEFS.length > 0, 'CHECK_DEFS should not be empty');
});

test('rule selection: default (no runOnly, no engineOptions) => all checks', () => {
  assertSelection(core, 'default all checks', undefined, undefined);
  const got = gotSelectedRuleIds(core, undefined, undefined);
  assert.equal(got.length, core.CHECK_DEFS.length);
});

test('rule selection: engineOptions.checks.include supports comma list + spaces + duplicates + empty tokens', () => {
  const some = core.CHECK_DEFS.slice(0, Math.min(5, core.CHECK_DEFS.length)).map((r) => r.ruleId);
  assert.ok(some.length >= 2, 'need at least 2 checks to test');

  const engineOptions = {
    rules: {
      include: `${some[0]} ,  ${some[1]}, ${some[0]} , ,`
    }
  };

  assertSelection(core, 'checks.include parsing', engineOptions, undefined);
  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  assert.deepEqual(got, [some[0], some[1]]);
});

test('rule selection: engineOptions.checks.exclude subtracts after include', () => {
  const some = core.CHECK_DEFS.slice(0, Math.min(6, core.CHECK_DEFS.length)).map((r) => r.ruleId);
  assert.ok(some.length >= 3);

  const engineOptions = {
    rules: { include: `${some[0]},${some[1]},${some[2]}`, exclude: `${some[1]}` }
  };

  assertSelection(core, 'exclude after include', engineOptions, undefined);
  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  assert.deepEqual(got, [some[0], some[2]]);
});

test('rule selection: tags.include filters by ANY matching tag', () => {
  const tagIndex = buildTagIndex(core.CHECK_DEFS);
  // choose a tag that appears in >= 2 checks for a meaningful test
  const candidate = [...tagIndex.entries()].find(([, ids]) => ids.length >= 2);
  assert.ok(candidate, 'expected at least one tag shared by >=2 checks');
  const [tag, ids] = candidate;

  const engineOptions = { tags: { include: `${tag}` } };
  assertSelection(core, 'tags include ANY', engineOptions, undefined);

  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  assert.ok(got.length >= 2);
  for (const id of got) assert.ok(ids.includes(id), `expected ${id} to have tag ${tag}`);
});

test('rule selection: tags.exclude removes ANY matching tag', () => {
  const tagIndex = buildTagIndex(core.CHECK_DEFS);
  // choose a tag that appears in >= 2 checks for meaningful shrink
  const candidate = [...tagIndex.entries()].find(([, ids]) => ids.length >= 2);
  assert.ok(candidate, 'expected at least one tag shared by >=2 checks');
  const [tag, ids] = candidate;

  const engineOptions = { tags: { exclude: `${tag}` } };
  assertSelection(core, 'tags exclude ANY', engineOptions, undefined);

  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  for (const id of ids) assert.ok(!got.includes(id), `expected ${id} to be excluded by tag ${tag}`);
});

test('rule selection: includeMode=and (default) => intersection between checks.include and tags.include', () => {
  const defs = core.CHECK_DEFS;
  const tagIndex = buildTagIndex(defs);

  const picked = findSharedNonUniversalTag(defs, tagIndex);
  if (!picked) {
    test.skip('includeMode=and: no shared non-universal tag available in this ruleset');
    return;
  }
  const [tag, idsWithTag] = picked;

  const idWith = idsWithTag[0];
  const idWithout = defs.find((d) => d.ruleId !== idWith && !(d.tags || []).map((t) => String(t).toLowerCase()).includes(tag))?.ruleId;
  assert.ok(idWithout, 'expected a rule that does not have the chosen tag');

  const engineOptions = {
    rules: { include: `${idWith},${idWithout}` },
    tags: { include: `${tag}` }
    // includeMode defaults to and
  };

  assertSelection(core, 'includeMode and', engineOptions, undefined);
  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  assert.deepEqual(got, [idWith]);
});

test('rule selection: includeMode=or => union between checks.include and tags.include', () => {
  const defs = core.CHECK_DEFS;
  const tagIndex = buildTagIndex(defs);

  const picked = findSharedNonUniversalTag(defs, tagIndex);
  if (!picked) {
    test.skip('includeMode=or: no shared non-universal tag available in this ruleset');
    return;
  }
  const [tag, idsWithTag] = picked;

  const idWith = idsWithTag[0];
  const idWithout = defs.find((d) => d.ruleId !== idWith && !(d.tags || []).map((t) => String(t).toLowerCase()).includes(tag))?.ruleId;
  assert.ok(idWithout, 'expected a rule that does not have the chosen tag');

  const engineOptions = {
    includeMode: 'or',
    rules: { include: `${idWithout}` },
    tags: { include: `${tag}` }
  };

  assertSelection(core, 'includeMode or', engineOptions, undefined);
  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  // union should include all tag-matching ids + idWithout
  assert.ok(got.includes(idWithout), 'expected explicit included ruleId to be included under OR');
  for (const id of idsWithTag) assert.ok(got.includes(id), `expected ${id} to be included by tag ${tag}`);
});

test('rule selection: excludes always win (even under includeMode=or)', () => {
  const defs = core.CHECK_DEFS;
  const tagIndex = buildTagIndex(defs);

  const candidate = [...tagIndex.entries()].find(([, ids]) => ids.length >= 2);
  assert.ok(candidate);
  const [tag, idsWithTag] = candidate;
  const idVictim = idsWithTag[0];

  const engineOptions = {
    includeMode: 'or',
    tags: { include: `${tag}` },
    // exclude the victim explicitly
    rules: { include: `${idVictim}`, exclude: `${idVictim}` },
  };

  assertSelection(core, 'excludes win under OR', engineOptions, undefined);
  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  assert.ok(!got.includes(idVictim), 'expected excluded rule to be removed');
});

test('rule selection: legacy ruleId prefix matching (a11ycore--prefixed id matches the bare canonical ruleId)', () => {
  const ENGINE_TAG = core.ENGINE_TAG || 'a11ycore';
  const any = core.CHECK_DEFS.find((d) => typeof d.ruleId === 'string' && d.ruleId.length > 0);
  assert.ok(any, 'expected at least one ruleId');
  assert.ok(!any.ruleId.startsWith(ENGINE_TAG + '-'), 'canonical ruleId should be bare, not engine-prefixed');

  const legacyPrefixed = `${ENGINE_TAG}-${any.ruleId}`;
  const engineOptions = { rules: { include: `${legacyPrefixed}` } };

  assertSelection(core, 'legacy prefixed include matches bare ruleId', engineOptions, undefined);
  const got = gotSelectedRuleIds(core, undefined, engineOptions);
  assert.deepEqual(got, [any.ruleId]);
});

test('rule selection: runOnly takes precedence over engineOptions selection', () => {
  const defs = core.CHECK_DEFS;
  assert.ok(defs.length >= 2);

  const engineOptions = { rules: { include: `${defs[0].ruleId}` } };
  const runOnly = { includeRuleIds: [defs[1].ruleId] };

  // runOnly should win, selecting defs[1], not defs[0]
  assertSelection(core, 'runOnly precedence', engineOptions, runOnly);
  const got = gotSelectedRuleIds(core, runOnly, engineOptions);
  assert.deepEqual(got, [defs[1].ruleId]);
});

test('rule selection: legacy runOnly { type:"tag", values:[...] } still works', () => {
  const tagIndex = buildTagIndex(core.CHECK_DEFS);
  const candidate = [...tagIndex.entries()].find(([, ids]) => ids.length >= 2);
  assert.ok(candidate);
  const [tag] = candidate;

  const runOnly = { type: 'tag', values: [tag] };
  assertSelection(core, 'legacy runOnly type=tag', undefined, runOnly);
});

test('rule selection: runOnly supports excludeTags (extended)', () => {
  const tagIndex = buildTagIndex(core.CHECK_DEFS);
  const candidate = [...tagIndex.entries()].find(([, ids]) => ids.length >= 2);
  assert.ok(candidate);
  const [tag, ids] = candidate;

  const runOnly = { tags: [tag], excludeTags: [tag] };
  assertSelection(core, 'runOnly excludeTags wins', undefined, runOnly);
  const got = gotSelectedRuleIds(core, runOnly, undefined);
  for (const id of ids) assert.ok(!got.includes(id));
});

/**
 * Combinatorial stress checks:
 * Generate many selections using real ids/tags, validate against referenceSelectedRuleIds.
 * The goal is to catch regression in parsing, precedence, includeMode, and include/exclude ordering.
 */
test('rule selection: generated combinations against reference selector', () => {
  const defs = core.CHECK_DEFS;
  const ENGINE_TAG = core.ENGINE_TAG || 'a11ycore';
  const tagIndex = buildTagIndex(defs);

  const ids = defs.map((d) => d.ruleId);
  assert.ok(ids.length > 0);

  // Choose a deterministic subset of ruleIds (up to 6) for combination building
  const idsSample = ids.slice(0, Math.min(6, ids.length));

  // Choose deterministic subset of tags:
  // - those shared by >=2 checks (more interesting)
  const sharedTags = [...tagIndex.entries()]
      .filter(([, ruleIds]) => ruleIds.length >= 2)
      .map(([t]) => t)
      .sort();

  const tagsSample = sharedTags.slice(0, Math.min(6, sharedTags.length));

  // If there are no shared tags (unlikely), still test with any tag
  if (tagsSample.length === 0) {
    const anyTag = [...tagIndex.keys()].sort()[0];
    if (anyTag) tagsSample.push(anyTag);
  }

  const modes = ['and', 'or'];

  // Build cases (cap to keep runtime reasonable)
  const cases = [];

  // Basic engineOptions cases
  for (const mode of modes) {
    for (const incId of idsSample) {
      cases.push({
        name: `engineOptions includeMode=${mode} rules.include=${incId}`,
        engineOptions: { includeMode: mode, rules: { include: incId } },
        runOnly: undefined,
      });
    }
    for (const incTag of tagsSample) {
      cases.push({
        name: `engineOptions includeMode=${mode} tags.include=${incTag}`,
        engineOptions: { includeMode: mode, tags: { include: incTag } },
        runOnly: undefined,
      });
    }
    for (const incId of idsSample) {
      for (const incTag of tagsSample) {
        cases.push({
          name: `engineOptions includeMode=${mode} rules.include=${incId} + tags.include=${incTag}`,
          engineOptions: { includeMode: mode, rules: { include: incId }, tags: { include: incTag } },
          runOnly: undefined,
        });
      }
    }
  }

  // Include + exclude combinations
  for (const incId of idsSample) {
    for (const excId of idsSample) {
      cases.push({
        name: `engineOptions rules.include=${incId} rules.exclude=${excId}`,
        engineOptions: { rules: { include: incId, exclude: excId } },
        runOnly: undefined,
      });
    }
  }
  for (const incTag of tagsSample) {
    for (const excTag of tagsSample) {
      cases.push({
        name: `engineOptions tags.include=${incTag} tags.exclude=${excTag}`,
        engineOptions: { tags: { include: incTag, exclude: excTag } },
        runOnly: undefined,
      });
    }
  }

  // runOnly precedence and mixed shapes
  for (const incId of idsSample) {
    for (const incTag of tagsSample) {
      cases.push({
        name: `runOnly includeRuleIds+tags (and) ${incId}+${incTag}`,
        engineOptions: { includeMode: 'or', rules: { include: idsSample[0] }, tags: { include: tagsSample[0] } },
        runOnly: { includeRuleIds: [incId], tags: [incTag] }, // should ignore engineOptions
      });
      cases.push({
        name: `runOnly includeMode=or includeRuleIds+tags ${incId}+${incTag}`,
        engineOptions: {},
        runOnly: { includeMode: 'or', includeRuleIds: [incId], tags: [incTag] },
      });
    }
  }

  // Cap number of cases to keep checks fast
  const MAX_CASES = 220;
  const trimmed = cases.slice(0, MAX_CASES);

  for (const c of trimmed) {
    assertSelection(core, c.name, c.engineOptions, c.runOnly);
  }
});
