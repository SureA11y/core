'use strict';

/**
 * What the register still listed after the seventh round (audits/FINDINGS.md
 * on audit/register), and the decisions taken on 2026-11-20: options the
 * engine read loosely or let through without a word.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { packScript, definePack } = require('../src/pack.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><img src="a.png"><a href="/x"></a></main></body></html>';

function quietly(fn) {
  const warnings = [];
  const warn = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    return { value: fn(), warnings };
  } catch (err) {
    return { error: err, warnings };
  } finally {
    console.warn = warn;
  }
}
const scan = (engineOptions, runOnly) =>
  quietly(() => runa11yCoreOnHtml(HTML, { engineOptions, runOnly }));

test('strictOptions refuses unknown mappings and optInRules tags and invalid excludeSelectors CSS (R4:OP-P2)', () => {
  for (const eo of [
    { mappings: ['nope'] },
    { optInRules: ['nope'] },
    { excludeSelectors: ['div[[['] },
    { rules: { 'img-alt-present': { excludeSelectors: ['a[['] } } }
  ]) {
    const strict = scan({ strictOptions: true, ...eo });
    assert.equal(strict.error && strict.error.code, 'INVALID_ENGINE_OPTIONS', JSON.stringify(eo));
    // Without strictOptions, a warning, and the scan runs.
    const loose = scan(eo);
    assert.ok(loose.value, JSON.stringify(eo));
    assert.equal(loose.warnings.length, 1, JSON.stringify(loose.warnings));
  }
  assert.ok(scan({ strictOptions: true, excludeSelectors: ['main img'] }).value);
});

test('an applicability that returns neither true nor false is an error, not run everywhere (R4:OP-P3)', () => {
  for (const v of [undefined, 0, Number.NaN, null, 'false']) {
    const rule = {
      id: 'org-x',
      meta: { title: 'T', description: 'd', tags: ['org'] },
      applicability: () => v,
      runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] })
    };
    const { value } = scan({ customRules: [rule] }, ['org-x']);
    const c = value.checksResults.find((x) => x.ruleId === 'org-x');
    assert.equal(c.outcome, 'cantTell', String(v));
    assert.match(c.error, /applicability returned .*; it must return true or false/, String(v));
    // No "a undefined" (round 12, A12-11).
    assert.doesNotMatch(c.error, /\ba undefined\b/, String(v));
    if (v === undefined) assert.match(c.error, /^applicability returned undefined \(no value\);/);
  }
});

test('rootCanvasFallback refuses what is not an opaque color as CSS writes it (R4:OP-P4)', () => {
  // rgb(0 0 0 1) and rgb(0,0,0 / 1) mix the two forms (round 8, NW-13).
  for (const v of [
    'inherit',
    'currentColor',
    'initial',
    'rgb(1,2,3,4,5)',
    'rgb(1,2,3,)',
    'rgb(0 0 0 1)',
    'rgb(0,0,0 / 1)'
  ]) {
    assert.equal(scan({ contrast: { rootCanvasFallback: v } }).warnings.length, 1, v);
    assert.equal(
      scan({ strictOptions: true, contrast: { rootCanvasFallback: v } }).error.code,
      'INVALID_ENGINE_OPTIONS',
      v
    );
  }
  for (const v of [
    '#000',
    'black',
    'rgb(0 0 0)',
    'rgb(0 0 0 / 1)',
    'rgba(0,0,0,1)',
    'hsl(0 0% 0%)'
  ]) {
    assert.equal(scan({ contrast: { rootCanvasFallback: v } }).warnings.length, 0, v);
  }
});

test('packScript refuses rule code with "<!--" then "<script", which can keep an inline script open (R4:OP-P5)', () => {
  const pack = definePack({
    name: 'html-comment-pack',
    version: '1.0.0',
    namespace: 'hc',
    core: '*',
    rules: [
      {
        id: 'hc-rule',
        meta: { title: 'T', description: 'd', tags: ['hc'] },
        runInPage: new Function("return { outcome: 'pass', note: '<!--<script>' };")
      }
    ]
  });
  assert.throws(() => packScript([pack]), /"<!--" followed by "<script"/);
  // "--!>" ends a comment in markup, but not inside a <script> element.
  const bang = definePack({
    name: 'bang-pack',
    version: '1.0.0',
    namespace: 'bg',
    core: '*',
    rules: [
      {
        id: 'bg-rule',
        meta: { title: 'T', description: 'd', tags: ['bg'] },
        runInPage: new Function("return { outcome: 'pass', note: '<!-- --!> <script>' };")
      }
    ]
  });
  assert.throws(() => packScript([bang]), /"<!--" followed by "<script"/);
  // "<!--" closed by "-->" first, as a rule stripping comments writes it,
  // is harmless.
  const comments = definePack({
    name: 'comment-strip-pack',
    version: '1.0.0',
    namespace: 'cs',
    core: '*',
    rules: [
      {
        id: 'cs-rule',
        meta: { title: 'T', description: 'd', tags: ['cs'] },
        runInPage: new Function(
          "return { outcome: 'pass', note: 'x'.replace(/<!--[\\s\\S]*?(-->|$)/g, '') };"
        )
      }
    ]
  });
  assert.ok(packScript([comments]).length > 0);
  // "<!-->" and "<!--->" close at once, as HTML reads them (round 8, NW-12).
  for (const note of ['<!--> <script>', '<!---> <script>']) {
    const closed = definePack({
      name: 'closed-pack',
      version: '1.0.0',
      namespace: 'cl',
      core: '*',
      rules: [
        {
          id: 'cl-rule',
          meta: { title: 'T', description: 'd', tags: ['cl'] },
          runInPage: new Function(`return { outcome: 'pass', note: ${JSON.stringify(note)} };`)
        }
      ]
    });
    assert.ok(packScript([closed]).length > 0, note);
  }
});

test('a hole in an option list is refused as a null is (R4:OP-P6)', () => {
  /* eslint-disable no-sparse-arrays */
  for (const eo of [{ excludeSelectors: [, 'main'] }, { mappings: [,] }]) {
    /* eslint-enable no-sparse-arrays */
    assert.equal(scan({ strictOptions: true, ...eo }).error.code, 'INVALID_ENGINE_OPTIONS');
    assert.equal(scan(eo).warnings.length, 1);
  }
});

test('wcagVersion is read trimmed under strictOptions, as wcagLevel is (R4:SE)', () => {
  const { value, error } = scan({ strictOptions: true, wcagVersion: '2.1 ', wcagLevel: ' aA ' });
  assert.equal(error, undefined);
  assert.equal(value.engine.wcagVersion, '2.1');
});

test('rule ids match case in ASCII only: the Kelvin sign is no "k" (R4:SE)', () => {
  const kelvin = 'linK-name-present';
  assert.equal(scan({}, [kelvin]).error.code, 'INVALID_RUN_ONLY');
  assert.ok(scan({ rules: { include: [kelvin] } }).error);
  // Plain ASCII case still matches.
  assert.equal(scan({}, ['LINK-name-present']).value.checksResults.length, 1);
  const own = scan({ rules: { [kelvin]: { excludeSelectors: ['main'] } } });
  assert.match(own.warnings.join('\n'), /no rule named/);
});

test('a profile name with the Kelvin sign is no profile in a list either (round 8, NW-11)', () => {
  const { ruleMappedStandard } = require('../src/pack.js');
  const std = ruleMappedStandard({
    standard: 'Keys',
    tag: 'keys',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { K1: { title: 'Named', wcagSc: ['4.1.2'] } } },
    ruleMap: { '1.0': { 'aria-role-name-present': { requirements: ['K1'] } } }
  });
  const pack = definePack({
    name: 'keys-pack',
    version: '1.0.0',
    namespace: 'keys',
    core: '*',
    standard: {
      key: 'keys',
      standard: 'Keys',
      versions: ['1.0'],
      profiles: { 'keys-1.0': { version: '1.0', tags: ['keys'], mappedRules: true } },
      ruleTag: 'keys',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate
    }
  });
  const kelvin = 'Keys-1.0';
  const { value } = scan({ packs: [pack], profile: [kelvin, 'wcag22-aa'] });
  assert.ok(!value.rulesResults.some((r) => r.ruleId.startsWith('keys-')));
  assert.deepEqual(
    value.engine.profilesNotRun.map((n) => n.reason),
    ['unknown-profile']
  );
  // Plain ASCII case still matches.
  const ascii = scan({ packs: [pack], profile: ['KEYS-1.0', 'wcag22-aa'] }).value;
  assert.ok(ascii.rulesResults.some((r) => r.ruleId.startsWith('keys-')));
});

// packScript refuses a pack's code only where HTML would leave an inline
// <script> open: checked here against the HTML parser itself (jsdom's), for
// "<!-->" and "<!--->" in each script data state (round 12, A12-8).
test('packScript refuses code only where HTML leaves the script open (round 12, A12-8)', () => {
  const { JSDOM } = require('jsdom');
  const notes = [
    '<!-- <!--> <script>',
    '<!-- <!---> <script>',
    '<!-- <script> <!-->',
    '<!-- <script> <!--->',
    '<!-- <script> <!--> <script>',
    '<!-- <script>',
    '<!-- <SCRIPT\t',
    '<!-- <script/',
    '<!-- <script> --!>',
    '<!-- <script> <!-- -->',
    '<!--<script>-->'
  ];
  for (const note of notes) {
    const pack = definePack({
      name: 'note-pack',
      version: '1.0.0',
      namespace: 'nt',
      core: '*',
      rules: [
        {
          id: 'nt-rule',
          meta: { title: 'T', description: 'd', tags: ['nt'] },
          runInPage: new Function(`return { outcome: 'pass', note: ${JSON.stringify(note)} };`)
        }
      ]
    });
    let refused = false;
    try {
      packScript([pack]);
    } catch (e) {
      assert.match(e.message, /keeps an inline <script> element from ending/);
      refused = true;
    }
    const html = `<script>var s = ${JSON.stringify(note)};</script><p id="after">after</p>`;
    const open = !new JSDOM(html).window.document.getElementById('after');
    assert.equal(refused, open, note);
  }
});

// An empty rule or tag list selects nothing, and every rule runs: said, and
// refused under strictOptions (round 12, A12-12).
test('an empty runOnly rule or tag list warns that every rule runs, and throws under strictOptions (round 12, A12-12)', () => {
  const empties = [
    [],
    '',
    new Set(),
    { type: 'rule', values: [] },
    { type: 'tags', values: '' },
    { tags: [] },
    { includeRuleIds: [] }
  ];
  const all = scan({}).value.checksResults.length;
  for (const runOnly of empties) {
    const loose = scan({}, runOnly);
    assert.equal(loose.value.checksResults.length, all);
    assert.ok(
      loose.warnings.some((w) =>
        /is an empty list: it selects no rule, so every rule runs/.test(w)
      ),
      String(loose.warnings)
    );
    const strict = scan({ strictOptions: true }, runOnly);
    assert.equal(strict.error && strict.error.code, 'INVALID_ENGINE_OPTIONS');
  }
  // A list with something in it, and no runOnly at all, say nothing of it.
  assert.ok(!scan({}, ['page-title-present']).warnings.some((w) => /empty list/.test(w)));
  assert.ok(!scan({}).warnings.some((w) => /empty list/.test(w)));
});
