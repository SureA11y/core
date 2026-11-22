/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { closestOptionKey } = require('./closest-option-key.js');

// What engineOptions may hold, and a check of a given object against it.
// Each function is self-contained but for the others in this file: they are
// inlined together into the generated core.js and the in-page runner.

/**
 * Whether a timestamp is an ISO 8601 date and time, as new
 * Date().toISOString() writes one: a date, "T", hours and minutes, seconds
 * and their fraction optionally, and a zone (Z or an offset) optionally,
 * each in range. A date alone, or text such as "yesterday", is not one: the
 * reporters write it as the scan's time (JUnit's timestamp attribute), and
 * the HTML report used the time of rendering for it without a word.
 */
function isIsoDateTime(value) {
  if (typeof value !== 'string') return false;
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):?(\d{2}))?$/i.exec(
      value.trim()
    );
  if (!m) return false;
  const [year, month, day, hour, minute, second, zoneHour, zoneMinute] = m
    .slice(1)
    .map((x) => (x === undefined ? 0 : Number(x)));
  const daysInMonth =
    month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
  return (
    day >= 1 &&
    day <= daysInMonth &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    zoneHour <= 23 &&
    zoneMinute <= 59
  );
}

/**
 * The table of every engine option: for each key, `test` (does a value fit),
 * `expected` (said when it doesn't) and, for an object, `keys`, its own
 * table. docs/ENGINE_OPTIONS.md and the TypeScript types are checked
 * against it.
 */
function engineOptionSpec() {
  // Spread reads a hole ([, 'main']) as undefined, which every() skips.
  const list = (v) =>
    typeof v === 'string' || (Array.isArray(v) && [...v].every((x) => typeof x === 'string'));
  const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  // A plain object, as written in a literal or by JSON.parse, from any
  // realm: not a Date, a Map, an element or a class instance, which have
  // keys of their own to give or none (round 12, A12-13).
  const isPlain = (v) => {
    try {
      if (!isObject(v) || Object.prototype.toString.call(v) !== '[object Object]') return false;
      const proto = Object.getPrototypeOf(v);
      return proto === null || Object.getPrototypeOf(proto) === null;
    } catch {
      return false;
    }
  };
  // JSON-safe data: a plain object at the top (the engine reads probes by
  // key, and an array there was dropped), and inside
  // strings, finite numbers, true, false, null, plain objects and arrays,
  // with no object reached twice along a path (round 12, A12-13).
  const jsonSafe = (top) => {
    const path = [];
    const safe = (v, depth) => {
      if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
      if (typeof v === 'number') return Number.isFinite(v);
      if (typeof v !== 'object' || depth > 100 || path.includes(v)) return false;
      if (!Array.isArray(v) && !isPlain(v)) return false;
      path.push(v);
      try {
        const values = Array.isArray(v) ? [...v] : Object.keys(v).map((k) => v[k]);
        return values.every((x) => safe(x, depth + 1));
      } finally {
        path.pop();
      }
    };
    try {
      return isPlain(top) && safe(top, 0);
    } catch {
      return false;
    }
  };
  const T = {
    any: { test: () => true, expected: 'any value' },
    // true or false, or how a command line or an environment variable
    // spells one ('true', 1, '0'); see switchOf.
    boolean: { test: (v) => switchOf(v) !== null, expected: 'true or false' },
    string: { test: (v) => typeof v === 'string', expected: 'a string' },
    list: { test: list, expected: 'a string or an array of strings' },
    // A profile, or a list of them. An empty slot, a blank name and a value
    // that is no name are each refused: each was dropped without a word.
    // An empty one, '' or [], names none (round 12, A12-13).
    profiles: {
      test: (v) =>
        (typeof v === 'string' && v.trim() !== '') ||
        (Array.isArray(v) &&
          v.length > 0 &&
          [...v].every((x) => typeof x === 'string' && x.trim() !== '')),
      expected: 'a profile name or a non-empty array of them, none blank'
    },
    number: {
      test: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
      expected: 'a number of milliseconds, 0 or more'
    },
    oneOf: (values) => ({
      test: (v) => values.includes(v),
      expected: 'one of ' + values.map((x) => JSON.stringify(x)).join(', ')
    }),
    // A non-empty list of some of `values`.
    someOf: (values) => ({
      test: (v) => Array.isArray(v) && v.length > 0 && [...v].every((x) => values.includes(x)),
      expected: 'a non-empty list of ' + values.map((x) => JSON.stringify(x)).join(', ')
    })
  };
  const selection = {
    test: (v) => list(v) || isPlain(v),
    expected: '{ include, exclude }, or the include list itself',
    keys: { include: T.list, exclude: T.list }
  };
  const policyFields = {
    allowedOutcomes: T.someOf(['fail', 'pass', 'cantTell', 'notApplicable']),
    allowedConfidence: T.someOf(['high', 'medium', 'low']),
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
    // Read trimmed, as wcagLevel is read trimmed and in any case.
    wcagVersion: {
      test: (v) => typeof v === 'string' && ['2.0', '2.1', '2.2'].includes(v.trim()),
      expected: 'one of "2.0", "2.1", "2.2"'
    },
    wcagLevel: {
      test: (v) => typeof v === 'string' && ['A', 'AA', 'AAA'].includes(v.trim().toUpperCase()),
      expected: '"A", "AA" or "AAA", in any case'
    },
    // One profile, or a list of them: a scan of several at once.
    profile: T.profiles,
    mappings: T.list,
    optInRules: T.list,
    logUntestedWcag: T.boolean,
    messages: { test: isPlain, expected: '{ [locale]: { key: text } }' },
    includeHiddenElements: T.boolean,
    includeShadowDom: T.boolean,
    fragment: T.boolean,
    embeddedAriaHidden: T.boolean,
    embeddedInert: T.boolean,
    topLevelDocument: T.boolean,
    assumeModal: T.boolean,
    excludeSelectors: T.list,
    // The text of style sheets the page can't read (preloadStyleSheets).
    styleSheetTexts: {
      test: (v) =>
        Array.isArray(v) &&
        [...v].every(
          (s) => isObject(s) && typeof s.href === 'string' && typeof s.text === 'string'
        ),
      expected: '[{ href, text }]'
    },
    // Blank is no timestamp: refused, as one that isn't a date and time is
    // (round 12, A12-13).
    timestamp: {
      test: (v) => typeof v === 'string' && isIsoDateTime(v),
      expected: 'an ISO 8601 date and time, such as new Date().toISOString()'
    },
    contrast: {
      test: isPlain,
      expected: '{ mode, rootCanvasFallback }',
      keys: {
        mode: T.oneOf(['strictConformance', 'auditorAssist']),
        rootCanvasFallback: T.string,
        // Echoed on each result; read back, false says rootCanvasFallback is
        // the engine's default, not the caller's.
        rootCanvasFallbackSet: T.boolean
      }
    },
    visibilityMode: T.oneOf(['styleOnly', 'styleAndGeometry']),
    includeMode: T.oneOf(['and', 'or']),
    policyContract: {
      test: (v) => typeof v === 'string' || isPlain(v),
      expected: "a contract's name, or a contract object",
      keys: Object.assign({ id: T.string }, policyFields)
    },
    policy: { test: isPlain, expected: 'a plain object', keys: policyFields },
    output: {
      test: isPlain,
      expected: '{ includeSelector, includeHtml, detail, maxOccurrencesPerRule }',
      keys: {
        includeSelector: T.boolean,
        includeHtml: T.boolean,
        detail: T.oneOf(['full', 'findings']),
        // At most this many occurrences of each rule in the result, the
        // rest counted (occurrencesOmitted); outcomes and rollups unchanged.
        maxOccurrencesPerRule: {
          test: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1,
          expected: 'a whole number, 1 or more'
        }
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
    // Evidence the host gives, passed to rules: JSON-safe data only (round
    // 12, A12-13).
    probes: {
      test: jsonSafe,
      expected: 'a plain object of JSON data (no function, Date, BigInt, NaN or circular reference)'
    },
    perfStats: T.boolean,
    profileRules: T.boolean,
    // Once a scan has spent this long, it starts no more rules; those it
    // didn't start are listed in its result (notRun). Off when not given,
    // and Infinity, the natural value for no limit, is off too (round 10,
    // S10-9).
    timeBudgetMs: {
      test: (v) => typeof v === 'number' && v > 0,
      expected: 'a number of milliseconds, more than 0'
    },
    pingWaitTime: T.number,
    frameWaitTime: T.number
  };
  return SPEC;
}

// closestOptionKey: src/core/closest-option-key.js, which the reporters
// load without the rest of this module.

/**
 * Returns the problems checkEngineOptions finds, in the order of the keys:
 * { path, kind, message, suggestion }. `kind` is 'unknown' for a key the
 * engine doesn't read, with `suggestion` the known key it is closest to, if
 * any is close; 'invalid' for a value of the wrong type or outside its set.
 * Keys the engine passes on unread are not checked: a rule's settings under
 * rules[ruleId] and messages' keys. probes is checked as JSON-safe data,
 * not against keys.
 */
function checkEngineOptions(engineOptions) {
  const SPEC = engineOptionSpec();
  const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

  const closest = closestOptionKey;
  function describe(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) {
      // Short lists of plain values are shown, so the one at fault is seen;
      // a hole as undefined.
      v = [...v];
      const plain =
        v.length > 0 && v.length <= 6 && v.every((x) => x === null || typeof x !== 'object');
      const text = plain
        ? '[' +
          v.map((x) => (typeof x === 'string' ? JSON.stringify(x) : String(x))).join(', ') +
          ']'
        : '';
      return plain && text.length <= 80 ? text : 'an array';
    }
    if (typeof v === 'string') return JSON.stringify(v.length > 40 ? v.slice(0, 40) + '…' : v);
    if (typeof v === 'object') {
      // A Date, a Map: named by its kind (round 12, A12-13).
      let tag = 'Object';
      try {
        tag = Object.prototype.toString.call(v).slice(8, -1);
      } catch {}
      return tag === 'Object' ? 'an object' : /^[AEIOU]/.test(tag) ? 'an ' + tag : 'a ' + tag;
    }
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
          // An on/off option had no warning of its own when given wrong.
          onOff: entry.expected === 'true or false',
          message: path + ' must be ' + entry.expected + ', not ' + describe(value)
        });
        continue;
      }
      if (entry.keys && isObject(value)) check(value, entry.keys, path, !!entry.open);
    }
  }
  if (isObject(engineOptions)) check(engineOptions, SPEC, '', false);
  else if (engineOptions != null) {
    problems.push({
      path: '',
      kind: 'invalid',
      suggestion: null,
      message: 'engineOptions must be an object, not ' + describe(engineOptions)
    });
  }
  return problems;
}

/**
 * Acts on checkEngineOptions' problems. With strictOptions: true, any
 * problem throws, code INVALID_ENGINE_OPTIONS, the problems in the error's
 * `problems`. Without it, an unknown key close to a known one is warned
 * about, since it is most likely a typo; other unknown keys may be a custom
 * rule's own settings, and stay silent; a value of the wrong type is said
 * and read as not given.
 */
function enforceEngineOptions(engineOptions) {
  // These options say a value of the wrong type themselves, with what was
  // read instead; the others are said below, so none is ignored in silence.
  const SAID_BY_OWN_READING = new Set([
    'wcagVersion',
    'wcagLevel',
    'profile',
    'optInRules',
    'timestamp',
    'includeMode',
    'customRules',
    'packs'
  ]);
  const problems = checkEngineOptions(engineOptions);
  if (!problems.length) return;
  // A switch read as off where the caller may have meant on: said so, with
  // the value named as checkEngineOptions names it, whatever its type (a
  // Symbol or a BigInt too). Null is a switch not given.
  const strictProblem = problems.find((p) => p.path === 'strictOptions');
  if (strictProblem && engineOptions.strictOptions !== null) {
    try {
      console.warn('[surea11y] engineOptions.' + strictProblem.message + '; read as false.');
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
  // A key that looks like a typo of a known one, and a value of the wrong
  // type, which the engine reads as not given, are said; other unknown keys
  // may be a custom rule's own settings, and stay silent.
  for (const p of problems) {
    if (p.kind === 'unknown' && !p.suggestion) continue;
    if (p.path === 'strictOptions') continue;
    // An empty profile or timestamp ('' or []) is read as none without a
    // word of its own, so it is said here (round 12, A12-13).
    const top = String(p.path).split('.')[0];
    const value = engineOptions[top];
    const empty =
      (top === 'profile' || top === 'timestamp') &&
      p.path === top &&
      ((typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length));
    if (p.kind === 'invalid' && SAID_BY_OWN_READING.has(top) && !empty) continue;
    // A policy list given as an array says what it leaves out itself
    // (resolvePolicy), and keeps the values it knows.
    if (p.kind === 'invalid' && /^policy(Contract)?\.allowed(Outcomes|Confidence)$/.test(p.path)) {
      const [key, field] = p.path.split('.');
      if (Array.isArray(engineOptions[key][field])) continue;
    }
    try {
      console.warn('[surea11y] engineOptions: ' + p.message + '; ignored.');
    } catch {}
  }
}

// An on/off option as given: true or false, or how a command line or an
// environment variable spells one ('true', 'false', '1', '0', 1, 0, '').
// Null for anything else, which is read as the option's default.
function switchOf(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0' || s === '') return false;
  return null;
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

module.exports = {
  isIsoDateTime,
  closestOptionKey,
  engineOptionSpec,
  checkEngineOptions,
  enforceEngineOptions,
  strictOf,
  switchOf
};
