'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  createDom,
  runa11yCoreOnDom,
  runa11yCoreOnHtml
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'iframe-focusable-content';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no iframe has a negative tabindex`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a"></iframe></body></html>`);
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the frame's content document is unreachable (simulated cross-origin)`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  const el = dom.window.document.getElementById('a');
  Object.defineProperty(el, 'contentDocument', { get: () => null });
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the negative-tabindex frame's content has nothing focusable`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML = '<p>static text</p>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the negative-tabindex frame's content contains a focusable element`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button>Click me</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE'
  );
});

test(`${RULE_ID}: cantTell when the only focusable candidate immediately redirects focus`, () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <iframe id="a" tabindex="-1"></iframe>
      <button id="outer-target">Outer target</button>
    </body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  contentDoc.getElementById('sentinel').addEventListener('focus', () => {
    contentDoc.defaultView.setTimeout(() => {
      dom.window.document.getElementById('outer-target').focus();
    }, 0);
  });

  // entryPointParity: this scenario's redirect handler fires once -- a second
  // scan would find focus already moved, so the probe can only observe it once.
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT'
  );
  assert.strictEqual(rule.occurrences[0].occurrenceOutcome, 'cantTell');
});

test(`${RULE_ID}: mixed fail and cantTell stay split at occurrence level`, () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <iframe id="fail-frame" tabindex="-1"></iframe>
      <iframe id="redirect-frame" tabindex="-1"></iframe>
      <button id="outer-target">Outer target</button>
    </body></html>`
  );
  const failDoc = dom.window.document.getElementById('fail-frame').contentDocument;
  failDoc.body.innerHTML = '<button>Focusable</button>';

  const redirectDoc = dom.window.document.getElementById('redirect-frame').contentDocument;
  redirectDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  redirectDoc.getElementById('sentinel').addEventListener('focus', () => {
    redirectDoc.defaultView.setTimeout(() => {
      dom.window.document.getElementById('outer-target').focus();
    }, 0);
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const failOccurrence = rule.occurrences.find((o) => o.selector.includes('#fail-frame'));
  const cantTellOccurrence = rule.occurrences.find((o) => o.selector.includes('#redirect-frame'));
  assert.ok(failOccurrence, 'Expected fail occurrence for fail-frame');
  assert.ok(cantTellOccurrence, 'Expected cantTell occurrence for redirect-frame');
  assert.strictEqual(failOccurrence.occurrenceOutcome, 'fail');
  assert.strictEqual(cantTellOccurrence.occurrenceOutcome, 'cantTell');
  assert.strictEqual(
    cantTellOccurrence.data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT'
  );
});

test(`${RULE_ID}: pass when the focusable candidate itself has tabindex="-1"`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button tabindex="-1">Not tabbable</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// Regression coverage for a bug found while extending direct coverage of
// this rule: hasFocusableCandidate never checked whether a candidate was
// actually rendered (display:none/visibility:hidden/[hidden]) inside the
// frame's embedded document -- a display:none button was wrongly reported
// as "still reachable by keyboard" even though it is never rendered or
// focusable in any real browser.
test(`${RULE_ID}: pass when the only focusable candidate is display:none`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button style="display:none">Hidden</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the only focusable candidate is hidden via an ancestor's visibility:hidden`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<div style="visibility:hidden"><button>Hidden via ancestor</button></div>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the focusable candidate is aria-hidden but still visually rendered (still reachable by real keyboard tab order)`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button aria-hidden="true">Still tabbable</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button>Click me</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Frames with tabindex="-1" must not contain focusable content');
});

test(`${RULE_ID}: pass when the only focusable candidate has the hidden attribute directly`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button hidden>Hidden via attribute</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the only focusable candidate is visibility:collapse`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  dom.window.document.getElementById('a').contentDocument.body.innerHTML =
    '<button style="visibility:collapse">Collapsed</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the redirect target is inside a shadow root within the same frame (getDeepActiveElement shadow traversal)`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button><div id="shadow-host"></div>';
  const shadowRoot = contentDoc.getElementById('shadow-host').attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = '<button id="shadow-target">Shadow target</button>';
  contentDoc.getElementById('sentinel').addEventListener('focus', () => {
    contentDoc.defaultView.setTimeout(() => {
      shadowRoot.getElementById('shadow-target').focus();
    }, 0);
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT'
  );
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe.redirectedWithinFrame, true);
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe.redirectedOutOfFrame, false);
});

test(`${RULE_ID}: cantTell when the redirect is scheduled via requestAnimationFrame`, () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <iframe id="a" tabindex="-1"></iframe>
      <button id="outer-target">Outer target</button>
    </body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  contentDoc.getElementById('sentinel').addEventListener('focus', () => {
    contentDoc.defaultView.requestAnimationFrame(() => {
      dom.window.document.getElementById('outer-target').focus();
    });
  });

  // entryPointParity: this scenario's redirect handler fires once -- a second
  // scan would find focus already moved, so the probe can only observe it once.
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT'
  );
});

test(`${RULE_ID}: cantTell when the redirect is scheduled via queueMicrotask`, () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <iframe id="a" tabindex="-1"></iframe>
      <button id="outer-target">Outer target</button>
    </body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  contentDoc.getElementById('sentinel').addEventListener('focus', () => {
    contentDoc.defaultView.queueMicrotask(() => {
      dom.window.document.getElementById('outer-target').focus();
    });
  });

  // entryPointParity: this scenario's redirect handler fires once -- a second
  // scan would find focus already moved, so the probe can only observe it once.
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT'
  );
});

test(`${RULE_ID}: fail (not cantTell) when the redirect only happens after a long delay outside the observation window`, () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <iframe id="a" tabindex="-1"></iframe>
      <button id="outer-target">Outer target</button>
    </body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  let timerId;
  contentDoc.getElementById('sentinel').addEventListener('focus', () => {
    timerId = contentDoc.defaultView.setTimeout(() => {
      dom.window.document.getElementById('outer-target').focus();
    }, 500);
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE'
  );
  contentDoc.defaultView.clearTimeout(timerId);
});

test(`${RULE_ID}: redirect is still detected when focus({preventScroll}) throws and falls back to plain focus()`, () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <iframe id="a" tabindex="-1"></iframe>
      <button id="outer-target">Outer target</button>
    </body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  const sentinel = contentDoc.getElementById('sentinel');
  const originalFocus = sentinel.focus.bind(sentinel);
  sentinel.focus = function (opts) {
    if (opts) throw new Error('preventScroll unsupported in this simulated environment');
    return originalFocus();
  };
  sentinel.addEventListener('focus', () => {
    contentDoc.defaultView.setTimeout(() => {
      dom.window.document.getElementById('outer-target').focus();
    }, 0);
  });

  // entryPointParity: this scenario's redirect handler fires once -- a second
  // scan would find focus already moved, so the probe can only observe it once.
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe.redirected, true);
});

test(`${RULE_ID}: fail (not cantTell, no crash) when the candidate's focus() always throws`, () => {
  const dom = createDom(
    `<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`
  );
  const contentDoc = dom.window.document.getElementById('a').contentDocument;
  contentDoc.body.innerHTML = '<button id="sentinel">Sentinel</button>';
  const sentinel = contentDoc.getElementById('sentinel');
  sentinel.focus = function () {
    throw new Error('focus is never available in this simulated environment');
  };

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/iframe-focusable-content-all-scenarios.html)`, () => {
  // Static-HTML-only coverage: the FAIL branch requires mutating
  // iframe.contentDocument after parse (see the fixture's own note and the
  // dedicated test above), which a declarative HTML fixture cannot express
  // in this synchronous jsdom harness. This fixture covers every branch
  // that IS expressible statically: not-applicable and pass.
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'iframe-focusable-content-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
