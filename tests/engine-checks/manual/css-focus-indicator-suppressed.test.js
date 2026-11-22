'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'css-focus-indicator-suppressed';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function page(css, body) {
  return `<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`;
}

test(`${RULE_ID}: notApplicable when the page has no focus rule at all`, () => {
  const result = runa11yCoreOnHtml(page('a { color: red }', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell for a global outline reset with no replacement`, () => {
  const result = runa11yCoreOnHtml(page('*:focus{outline:none}', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'FOCUS_INDICATOR_SUPPRESSED');
  assert.deepStrictEqual(rule.occurrences[0].data.details.suppressingSelectors, ['*:focus']);
});

test(`${RULE_ID}: an outline removed by a rule with no focus state is asked about (F78)`, () => {
  for (const css of ['a{outline:none}', '*{outline:0}', 'nav a{outline-style:none}']) {
    const html = page(css, '<nav><a href="/x" id="a">Lien</a></nav>');
    for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'cantTell', {
        minOccurrences: 1,
        maxOccurrences: 1
      });
      assert.ok(hasOccurrenceForId(rule, 'a'), css);
      assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'FOCUS_INDICATOR_SUPPRESSED');
      assert.deepStrictEqual(rule.occurrences[0].data.details.suppressingSelectors, [
        css.slice(0, css.indexOf('{'))
      ]);
    }
  }
});

test(`${RULE_ID}: a focus rule restoring an indicator clears an outline removed with no state`, () => {
  for (const css of [
    'a{outline:none} a:focus{outline:2px solid}',
    'a{outline:none} a:focus-visible{box-shadow:0 0 0 2px navy}'
  ]) {
    const result = runa11yCoreOnHtml(page(css, '<a href="/x" id="a">Lien</a>'), {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a reset limited to another state, or to a pseudo-element, is not a suppression`, () => {
  for (const css of [
    'a:hover{outline:none}',
    'a:active{outline:0}',
    'button::-moz-focus-inner{border:0;outline:none}'
  ]) {
    const result = runa11yCoreOnHtml(
      page(css, '<a href="/x" id="a">Lien</a><button type="button">B</button>'),
      { runOnly: [RULE_ID] }
    );
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: outline suppression is recognized in each of its written forms`, () => {
  for (const decl of [
    'outline:none',
    'outline:0',
    'outline:0px',
    'outline-style:none',
    'outline-width:0',
    'outline-color:transparent'
  ]) {
    const result = runa11yCoreOnHtml(page(`a:focus{${decl}}`, '<a href="/x" id="a">x</a>'), {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: :focus-visible counts as a focus rule`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus-visible{outline:none}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: an outline removed only for focus that is not focus-visible is not reported`, () => {
  const outcome = (css, body = '<a href="/x" id="a">x</a>') =>
    runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] }).checksResults.find(
      (c) => c.ruleId === RULE_ID
    );
  const htmlScoped = (body) =>
    `<!doctype html><html class="js-focus-visible"><head><style>${body}</style></head><body><a href="/x" id="a">x</a></body></html>`;
  const attrScoped = (body) =>
    `<!doctype html><html data-js-focus-visible=""><head><style>${body}</style></head><body><a href="/x" id="a">x</a></body></html>`;
  const run = (html) =>
    runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }).checksResults.find((c) => c.ruleId === RULE_ID);

  // Native.
  assert.strictEqual(outcome('a:focus:not(:focus-visible){outline:none}').outcome, 'notApplicable');
  // The WICG polyfill's class form, scoped under .js-focus-visible.
  for (const css of [
    '.js-focus-visible :focus:not(.focus-visible){outline:none}',
    '.js-focus-visible a:focus:not(.focus-visible){outline:0}',
    'html.js-focus-visible > body a:not(.focus-visible){outline:none}'
  ]) {
    const r = run(htmlScoped(css));
    assert.strictEqual(r.outcome, 'notApplicable', css);
    assert.strictEqual(r.occurrences.length, 0, css);
  }
  // Its attribute form, scoped under [data-js-focus-visible].
  for (const css of [
    '[data-js-focus-visible] :focus:not([data-focus-visible-added]){outline:none}',
    '[data-js-focus-visible] a:focus:not([data-focus-visible-added]){outline:none}'
  ]) {
    const r = run(attrScoped(css));
    assert.strictEqual(r.outcome, 'notApplicable', css);
    assert.strictEqual(r.occurrences.length, 0, css);
  }
  // A rule that also removes the outline outright is still reported.
  const both = run(
    htmlScoped('.js-focus-visible :focus:not(.focus-visible){outline:none} a{outline:none}')
  );
  assert.strictEqual(both.outcome, 'cantTell');
  assert.deepStrictEqual(both.occurrences[0].data.details.suppressingSelectors, ['a']);
});

test(`${RULE_ID}: .focus-visible outside the polyfill's scope is judged as before`, () => {
  const run = (html) =>
    runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }).checksResults.find((c) => c.ruleId === RULE_ID);
  const doc = (htmlAttrs, css, body = '<a href="/x" id="a">x</a>') =>
    `<!doctype html><html${htmlAttrs}><head><style>${css}</style></head><body>${body}</body></html>`;
  for (const [attrs, css, body] of [
    // No scope at all.
    ['', 'a:focus:not(.focus-visible){outline:none}'],
    ['', ':focus:not(.focus-visible){outline:none}'],
    // Names that only look like the polyfill's.
    [' class="js-focus-visible-x"', '.js-focus-visible-x :focus:not(.focus-visible){outline:none}'],
    [' class="js-focus-visible"', '.js-focus-visible :focus:not(.focus-visible-x){outline:none}'],
    // The scope on the element itself, or as a sibling, is not a scope above it.
    ['', 'a.js-focus-visible:focus:not(.focus-visible), a:focus:not(.focus-visible){outline:none}'],
    [
      '',
      '.js-focus-visible + div :focus:not(.focus-visible){outline:none}',
      '<div class="js-focus-visible"></div><div><a href="/x" id="a">x</a></div>'
    ],
    // The class form under the attribute scope, and the other way round.
    [
      ' data-js-focus-visible=""',
      '[data-js-focus-visible] :focus:not(.focus-visible){outline:none}'
    ],
    [
      ' class="js-focus-visible"',
      '.js-focus-visible :focus:not([data-focus-visible-added]){outline:none}'
    ]
  ]) {
    const r = run(doc(attrs, css, body));
    assert.strictEqual(r.outcome, 'cantTell', css);
    assert.strictEqual(r.occurrences.length, 1, css);
    assert.strictEqual(r.occurrences[0].data.details.reasonCode, 'FOCUS_INDICATOR_SUPPRESSED');
  }
});

test(`${RULE_ID}: a focus pseudo inside :is() or :where() is a focus rule (round 8, LY-12)`, () => {
  for (const css of [
    'a:is(:focus){outline:none}',
    'a:where(:focus){outline:none}',
    'a:is(:focus,:hover){outline:none}',
    'a:matches(:focus){outline:none}',
    ':is(a, button):is(:focus){outline:none}',
    'nav :is(.menu :focus){outline:none}'
  ]) {
    const result = runa11yCoreOnHtml(
      page(css, '<nav class="menu"><a href="/x" id="a">x</a></nav>'),
      {
        runOnly: [RULE_ID]
      }
    );
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a'), css);
    assert.deepStrictEqual(rule.occurrences[0].data.details.suppressingSelectors, [
      css.slice(0, css.indexOf('{'))
    ]);
  }
  // Another argument the link does not meet, or a replacement written the same way.
  for (const css of [
    'a:is(:focus.other){outline:none}',
    'a:focus{outline:none} a:is(:focus){box-shadow:0 0 0 2px navy}'
  ]) {
    const result = runa11yCoreOnHtml(page(css, '<nav class="menu"><a href="/x">x</a></nav>'), {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: suppression nested in a grouping rule is found`, () => {
  const result = runa11yCoreOnHtml(
    page('@media screen{a:focus{outline:none}}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

// ---------------------------------------------------------------------------
// A replacement indicator clears the element, wherever it is drawn.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: a replacement in the same rule clears the element`, () => {
  for (const decl of [
    'box-shadow:0 0 0 3px navy',
    'border:2px solid navy',
    'background-color:navy',
    // Not underline: the link shows that already (round 9, V9-6).
    'text-decoration:overline'
  ]) {
    const result = runa11yCoreOnHtml(page(`a:focus{outline:none;${decl}}`, '<a href="/x">x</a>'), {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a focus style that draws nothing is no replacement (round 8, LY-3)`, () => {
  for (const [css, body] of [
    ['button:focus{outline:none;box-shadow:none}', '<button type="button" id="a">Go</button>'],
    ['a:focus{outline:none;background:transparent}', '<a href="/x" id="a">x</a>'],
    ['a:focus{outline:none;background-color:rgba(0,0,0,0)}', '<a href="/x" id="a">x</a>'],
    ['button:focus{outline:none;border:0}', '<button type="button" id="a">Go</button>'],
    [
      'button:focus{outline:none;border:2px solid transparent}',
      '<button type="button" id="a">Go</button>'
    ],
    ['a:focus{outline:none;color:inherit}', '<a href="/x" id="a">x</a>'],
    ['a:focus{outline:none;filter:none;transform:none}', '<a href="/x" id="a">x</a>'],
    // The same value the element already shows unfocused changes nothing.
    [
      'a:focus{outline:0;text-decoration:none}',
      '<a href="/x" id="a" style="text-decoration:none">x</a>'
    ],
    ['a:focus{outline:0;color:#c00}', '<a href="/x" id="a" style="color:#c00">x</a>']
  ]) {
    const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a'), css);
  }
  // A value that does change the element is still a replacement.
  for (const [css, body] of [
    ['a:focus{outline:0;text-decoration:none}', '<a href="/x">x</a>'],
    ['a:focus{outline:0;color:#c00}', '<a href="/x" style="color:#00c">x</a>'],
    ['a:focus{outline:none;background:transparent;box-shadow:0 0 0 2px navy}', '<a href="/x">x</a>']
  ]) {
    const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a focus style that draws nothing on the element is no replacement (round 9, V9-6)`, () => {
  for (const [css, body] of [
    // The outline's style is still none: a color or a width alone draws nothing.
    ['a{outline:none} a:focus-visible{outline-color:red}', '<a href="/x" id="a">x</a>'],
    ['a{outline-style:none} a:focus{outline-width:4px}', '<a href="/x" id="a">x</a>'],
    ['a{outline:0} a:focus{outline-width:4px;outline-color:red}', '<a href="/x" id="a">x</a>'],
    ['a{outline:none} a:focus{outline-offset:2px;outline-color:red}', '<a href="/x" id="a">x</a>'],
    // A border color on an element with no border.
    ['a{outline:none} a:focus{border-color:red}', '<a href="/x" id="a">x</a>'],
    // The underline the link already shows.
    ['a{outline:none} a:focus{text-decoration:underline}', '<a href="/x" id="a">x</a>'],
    // A shadow in a clear color, or one that reaches past nothing.
    ['a{outline:none} a:focus{box-shadow:0 0 0 3px transparent}', '<a href="/x" id="a">x</a>'],
    ['a{outline:none} a:focus{box-shadow:0 0 0 0 red}', '<a href="/x" id="a">x</a>'],
    ['a{outline:none} a:focus{text-shadow:0 0 0 red}', '<a href="/x" id="a">x</a>'],
    // A custom property that comes to none.
    [
      ':root{--ring:none} a{outline:none} a:focus{box-shadow:var(--ring)}',
      '<a href="/x" id="a">x</a>'
    ],
    ['a{outline:none} a:focus{box-shadow:var(--unset, none)}', '<a href="/x" id="a">x</a>']
  ]) {
    const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a'), css);
  }
  // What does draw is still a replacement.
  for (const [css, body] of [
    ['a{outline-color:transparent} a:focus{outline-color:red}', '<a href="/x">x</a>'],
    ['a{outline-width:0} a:focus{outline-width:3px}', '<a href="/x">x</a>'],
    ['a{outline:none} a:focus{outline:2px solid red}', '<a href="/x">x</a>'],
    ['a{outline:none} a:focus{outline-style:solid}', '<a href="/x">x</a>'],
    [
      'a{outline:none} a:focus{border-color:red}',
      '<a href="/x" style="border:1px solid #ccc">x</a>'
    ],
    ['a{outline:none} a:focus{border-color:red;border-style:solid}', '<a href="/x">x</a>'],
    [
      'a{outline:none} a:focus{text-decoration:underline}',
      '<a href="/x" style="text-decoration:none">x</a>'
    ],
    ['a{outline:none} a:focus{text-decoration:underline overline}', '<a href="/x">x</a>'],
    ['a{outline:none} a:focus{box-shadow:0 2px 0 red}', '<a href="/x">x</a>'],
    [
      ':root{--ring:0 0 0 3px red} a{outline:none} a:focus{box-shadow:var(--ring)}',
      '<a href="/x">x</a>'
    ]
  ]) {
    const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a later rule restoring a positive outline clears the element`, () => {
  const result = runa11yCoreOnHtml(
    page('*:focus{outline:none} a:focus{outline:2px solid navy}', '<a href="/x">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a replacement drawn on a pseudo-element clears the element`, () => {
  const result = runa11yCoreOnHtml(
    page(
      'a:focus{outline:none} a:focus::before{content:"x";background:navy}',
      '<a href="/x">x</a>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a replacement painted on a sibling clears the element`, () => {
  const result = runa11yCoreOnHtml(
    page(
      'a:focus{outline:none} a:focus + .ind{background:navy}',
      '<a href="/x">x</a><span class="ind"></span>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: outline-offset alone is not a replacement`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none;outline-offset:4px}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: compensation is resolved per element, not per page`, () => {
  // The reset hits everything; only the button gets an indicator back.
  const result = runa11yCoreOnHtml(
    page(
      '*:focus{outline:none} .btn:focus{box-shadow:0 0 0 3px navy}',
      '<a href="/x" id="link">x</a><button class="btn" id="btn">b</button>'
    ),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'link'));
  assert.ok(!hasOccurrenceForId(rule, 'btn'));
});

// ---------------------------------------------------------------------------
// Scope boundaries.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: a rule scoped to one selector does not reach other elements`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none}', '<a href="/x" id="link">x</a><button id="btn">b</button>'),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'link'));
  assert.ok(!hasOccurrenceForId(rule, 'btn'));
});

test(`${RULE_ID}: a rule firing on an ancestor's focus is not the element's own suppression`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '.card:focus .link{outline:none}',
      '<div class="card" tabindex="0"><a class="link" id="a" href="/x">x</a></div>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: :focus-within is not treated as a focus rule for the element itself`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus-within{outline:none}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an element outside sequential focus navigation is skipped`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none}', '<a href="/x" id="a" tabindex="-1">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a non-rendered element is skipped`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none}', '<a href="/x" id="a" style="display:none">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: catches ACT oj04fd's failed example once its stylesheet is available`, () => {
  // ACT ships that example's CSS in a linked stylesheet, which the offline
  // example runner does not fetch; inlined here, the rule reports it.
  const css = '.no-focus-default:focus { outline: none; }';
  const body =
    '<a class="no-focus-default" id="a" href="https://act-rules.github.io/">ACT rules</a>';
  const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: leans fail when nothing readable shows focus another way`, () => {
  const lean = (css, body) => {
    const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'FOCUS_INDICATOR_SUPPRESSED');
    return rule.occurrences[0].lean;
  };
  const plain = lean('a:focus{outline:none}', '<a href="/x" id="a">x</a>');
  assert.strictEqual(plain.toward, 'fail');
  assert.strictEqual(plain.i18n.whyKey, 'cssFocusIndicatorSuppressed_lean_why');
  // An inline focus handler may draw the indicator: no lean.
  assert.strictEqual(
    lean('a:focus{outline:none}', '<a href="/x" id="a" onfocus="mark(this)">x</a>'),
    undefined
  );
  // A :focus-within rule around it draws a change: no lean.
  assert.strictEqual(
    lean(
      'a:focus{outline:none} nav:focus-within{background:yellow}',
      '<nav><a href="/x" id="a">x</a></nav>'
    ),
    undefined
  );
  // A focus-visible polyfill's class: no lean.
  assert.strictEqual(
    lean('a:focus:not(.focus-visible){outline:none}', '<a href="/x" id="a">x</a>'),
    undefined
  );
});

test(`${RULE_ID}: manual rule never reports fail`, () => {
  const result = runa11yCoreOnHtml(page('*:focus{outline:none}', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.notStrictEqual(rule.outcome, 'fail');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const result = runa11yCoreOnHtml(page('*:focus{outline:none}', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Focus indicator must not be removed without a replacement');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/css-focus-indicator-suppressed-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'css-focus-indicator-suppressed-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedIds = [
    'cfis_case_01',
    'cfis_case_02',
    'cfis_case_03',
    'cfis_case_04',
    'cfis_case_05',
    'cfis_case_13',
    'cfis_case_17'
  ];
  const expectedNoOccIds = [
    'cfis_case_06',
    'cfis_case_07',
    'cfis_case_08',
    'cfis_case_09',
    'cfis_case_10',
    'cfis_case_11',
    'cfis_case_12',
    'cfis_case_14',
    'cfis_case_15',
    'cfis_case_16'
  ];

  for (const id of expectedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: says which <style> element the removing rule is in`, () => {
  const html =
    '<!doctype html><html><head><style>p { color: red }</style>' +
    '<style>*:focus { outline: none }</style></head><body><a href="/x" id="a">x</a></body></html>';
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'This element takes a tab stop, and "*:focus" in <style> element 2 of the page removes its focus outline with no replacement indicator in any other focus rule matching it.'
  );
  assert.strictEqual(occ.i18n.summaryKey, 'cssFocusIndicatorSuppressed_summary_cantTell_inStyle');
  assert.deepStrictEqual(occ.i18n.params, { selectors: '*:focus', index: 2 });
  assert.strictEqual(occ.data.details.styleElementIndex, 2);
});

test(`${RULE_ID}: a selector jsdom cannot read does not hide the other rules (round 11, R11P-1)`, () => {
  // jsdom throws on :-moz-focusring only when matching reaches it, so it
  // passes a check against <html> and then fails every button.
  const html = page(
    'button:-moz-focusring{outline:none} button:focus{outline:none}',
    '<main><button type="button" id="b">Save</button></main>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.suppressingSelectors, ['button:focus']);
});

test(`${RULE_ID}: jsdom tests each selector on its own, never as a list (round 11, R11P-3, R11P-4)`, () => {
  // In jsdom a list is slower when most elements match it, and can answer
  // differently from its selectors one by one (:nth-child(An+B of S)).
  const rules = Array.from({ length: 20 }, (_, i) => `.c${i} a:focus{outline:none}`).join(' ');
  const links = Array.from(
    { length: 20 },
    (_, i) => `<div class="c${i}"><a href="#${i}" id="a${i}">${i}</a></div>`
  ).join('');
  const dom = createDom(
    `<!doctype html><html><head><style>${rules} button:focus{outline:none} ` +
      `:nth-child(2 of .x):focus{outline:none}</style></head><body>${links}` +
      '<div class="x"><a href="h1" class="x">a</a><button id="b">b</button></div></body></html>'
  );
  const proto = dom.window.Element.prototype;
  const matches = proto.matches;
  const lists = [];
  proto.matches = function (sel) {
    if (/\.c\d+ a, \.c\d+ a/.test(sel)) lists.push(sel);
    return matches.call(this, sel);
  };
  const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 21,
    maxOccurrences: 21
  });
  proto.matches = matches;
  assert.deepStrictEqual(lists, []);
  for (let i = 0; i < 20; i++) assert.ok(hasOccurrenceForId(rule, `a${i}`), `a${i}`);
  assert.ok(hasOccurrenceForId(rule, 'b'));
});
