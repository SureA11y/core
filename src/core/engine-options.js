/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// What engineOptions may hold, and a check of a given object against it.
// Each function is self-contained but for the others in this file: they are
// inlined together into the generated core.js and the in-page runner.

/**
 * The table of every engine option: for each key, `test` (does a value fit),
 * `expected` (said when it doesn't) and, for an object, `keys`, its own
 * table. docs/ENGINE_OPTIONS.md and the TypeScript types are checked
 * against it.
 */
function engineOptionSpec() {
  const list = (v) =>
    typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string'));
  const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const T = {
    any: { test: () => true, expected: 'any value' },
    boolean: { test: (v) => typeof v === 'boolean', expected: 'true or false' },
    string: { test: (v) => typeof v === 'string', expected: 'a string' },
    list: { test: list, expected: 'a string or an array of strings' },
    number: {
      test: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
      expected: 'a number of milliseconds, 0 or more'
    },
    oneOf: (values) => ({
      test: (v) => values.includes(v),
      expected: 'one of ' + values.map((x) => JSON.stringify(x)).join(', ')
    })
  };
  const selection = {
    test: (v) => list(v) || isObject(v),
    expected: '{ include, exclude }, or the include list itself',
    keys: { include: T.list, exclude: T.list }
  };
  const policyFields = {
    allowedOutcomes: T.list,
    allowedConfidence: T.list,
    coerceManualFailToCantTell: T.boolean
  };
  const SPEC = {
    // true or false, or how a command line or an environment variable
    // spells one ('true', 1, '0'); see strictOf.
    strictOptions: {
      test: (v) =>
        typeof v === 'boolean' ||
        v === 0 ||
        v === 1 ||
        (typeof v === 'string' && ['true', 'false', '1', '0', ''].includes(v.trim().toLowerCase())),
      expected: 'true or false'
    },
    locale: T.string,
    wcagVersion: T.oneOf(['2.0', '2.1', '2.2']),
    profile: T.string,
    mappings: T.list,
    optInRules: T.list,
    logUntestedWcag: T.boolean,
    messages: { test: isObject, expected: '{ [locale]: { key: text } }' },
    includeHiddenElements: T.boolean,
    includeShadowDom: T.boolean,
    fragment: T.boolean,
    excludeSelectors: T.list,
    timestamp: T.string,
    contrast: {
      test: isObject,
      expected: '{ mode, rootCanvasFallback }',
      keys: {
        mode: T.oneOf(['strictConformance', 'auditorAssist']),
        rootCanvasFallback: T.string
      }
    },
    visibilityMode: T.oneOf(['styleOnly', 'styleAndGeometry']),
    includeMode: T.oneOf(['and', 'or']),
    policyContract: {
      test: (v) => typeof v === 'string' || isObject(v),
      expected: "a contract's name, or a contract object",
      keys: Object.assign({ id: T.string }, policyFields)
    },
    policy: { test: isObject, expected: 'an object', keys: policyFields },
    output: {
      test: isObject,
      expected: '{ includeSelector, includeHtml, detail }',
      keys: {
        includeSelector: T.boolean,
        includeHtml: T.boolean,
        detail: T.oneOf(['full', 'findings'])
      }
    },
    // Besides include and exclude, a key of rules is a rule's id and its
    // value that rule's settings, which the engine passes on unread.
    rules: {
      test: selection.test,
      expected: selection.expected,
      keys: selection.keys,
      open: true
    },
    tags: selection,
    tests: selection,
    customRules: { test: Array.isArray, expected: 'an array of rules' },
    packs: { test: Array.isArray, expected: 'an array of packs' },
    probes: T.any,
    perfStats: T.boolean,
    profileRules: T.boolean,
    pingWaitTime: T.number,
    frameWaitTime: T.number
  };
  return SPEC;
}

/**
 * Returns the problems checkEngineOptions finds, in the order of the keys:
 * { path, kind, message, suggestion }. `kind` is 'unknown' for a key the
 * engine doesn't read, with `suggestion` the known key it is closest to, if
 * any is close; 'invalid' for a value of the wrong type or outside its set.
 * Keys the engine passes on unread are not checked: a rule's settings under
 * rules[ruleId], messages' keys, and probes.
 */
function checkEngineOptions(engineOptions) {
  const SPEC = engineOptionSpec();
  const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

  // Optimal string alignment distance, case ignored: "lcoale" is one from
  // "locale", "includeShadowDOM" none from "includeShadowDom".
  function distance(a, b) {
    const s = a.toLowerCase();
    const t = b.toLowerCase();
    const d = [];
    for (let i = 0; i <= s.length; i++) d.push([i]);
    for (let j = 1; j <= t.length; j++) d[0][j] = j;
    for (let i = 1; i <= s.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[s.length][t.length];
  }
  // The known key a typo most likely meant: two edits away at most, one for
  // a key of four letters or fewer, so short unrelated keys aren't matched.
  function closest(key, known) {
    let best = null;
    let bestD = Infinity;
    for (const k of known) {
      const dk = distance(key, k);
      if (dk < bestD) {
        best = k;
        bestD = dk;
      }
    }
    const limit = Math.min(key.length, best ? best.length : 0) <= 4 ? 1 : 2;
    return best !== null && bestD <= limit ? best : null;
  }
  function describe(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'an array';
    if (typeof v === 'string') return JSON.stringify(v.length > 40 ? v.slice(0, 40) + '…' : v);
    if (typeof v === 'object') return 'an object';
    return typeof v === 'number' || typeof v === 'boolean' ? String(v) : 'a ' + typeof v;
  }

  const problems = [];
  function check(obj, spec, prefix, open) {
    for (const key of Object.keys(obj)) {
      const path = prefix ? prefix + '.' + key : key;
      const value = obj[key];
      const entry = Object.prototype.hasOwnProperty.call(spec, key) ? spec[key] : null;
      if (!entry) {
        const suggestion = closest(key, Object.keys(spec));
        // In rules, any other key is a rule's id; only one that looks like a
        // typo of include or exclude is reported.
        if (open && !suggestion) continue;
        problems.push({
          path,
          kind: 'unknown',
          suggestion,
          message:
            'unknown option "' +
            path +
            '"' +
            (suggestion
              ? ' (did you mean "' + (prefix ? prefix + '.' : '') + suggestion + '"?)'
              : '')
        });
        continue;
      }
      // An option given as undefined is an option not given.
      if (value === undefined) continue;
      if (!entry.test(value)) {
        problems.push({
          path,
          kind: 'invalid',
          suggestion: null,
          message: path + ' must be ' + entry.expected + ', not ' + describe(value)
        });
        continue;
      }
      if (entry.keys && isObject(value)) check(value, entry.keys, path, !!entry.open);
    }
  }
  if (isObject(engineOptions)) check(engineOptions, SPEC, '', false);
  return problems;
}

/**
 * Acts on checkEngineOptions' problems. With strictOptions: true, any
 * problem throws, code INVALID_ENGINE_OPTIONS, the problems in the error's
 * `problems`. Without it, an unknown key close to a known one is warned
 * about, since it is most likely a typo; other unknown keys may be a custom
 * rule's own settings, and stay silent, and values are left to the warnings
 * the options already give.
 */
function enforceEngineOptions(engineOptions) {
  const problems = checkEngineOptions(engineOptions);
  if (!problems.length) return;
  const given =
    engineOptions && typeof engineOptions === 'object' ? engineOptions.strictOptions : null;
  if (given != null && problems.some((p) => p.path === 'strictOptions')) {
    // A switch read as off where the caller may have meant on: said so.
    try {
      console.warn(
        '[surea11y] engineOptions.strictOptions must be true or false, not ' +
          JSON.stringify(given) +
          '; read as false.'
      );
    } catch {}
  }
  if (strictOf(engineOptions)) {
    const err = new Error(
      'engineOptions: ' + problems.map((p) => p.message).join('; ') + '. (strictOptions)'
    );
    err.code = 'INVALID_ENGINE_OPTIONS';
    err.problems = problems;
    throw err;
  }
  for (const p of problems) {
    if (p.kind !== 'unknown' || !p.suggestion) continue;
    try {
      console.warn('[surea11y] engineOptions: ' + p.message + '; ignored.');
    } catch {}
  }
}

/**
 * Whether a scan is strict: strictOptions true, or as a command line or an
 * environment variable spells it ('true', '1', 1). Anything else, 'false',
 * 0 and '' included, is not; enforceEngineOptions warns about a value that
 * is neither.
 */
function strictOf(engineOptions) {
  const v =
    engineOptions && typeof engineOptions === 'object' ? engineOptions.strictOptions : undefined;
  if (v === true || v === 1) return true;
  return typeof v === 'string' && ['true', '1'].includes(v.trim().toLowerCase());
}

module.exports = { engineOptionSpec, checkEngineOptions, enforceEngineOptions, strictOf };
