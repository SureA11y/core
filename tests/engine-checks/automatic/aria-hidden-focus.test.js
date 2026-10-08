'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { getCheckDefById } = require('../../../src/index.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-hidden-focus';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function getOccurrenceForId(rule, id) {
  return (rule.occurrences || []).find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no aria-hidden="true" elements`, () => {
  const html = `<!doctype html><html><body>
      <div><a href="#x">Link</a></div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-hidden subtree exists but contains no focusable content`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root" aria-hidden="true">
        <p>Just text</p>
        <span>More text</span>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-hidden element itself is focusable (tabindex=0)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_focus" aria-hidden="true" tabindex="0">Focusable hidden</div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_focus'));
  assert.strictEqual(
    rule.occurrences[0].summary,
    'aria-hidden div is focusable (1 focusable element(s)).'
  );
});

test(`${RULE_ID}: cantTell when a single aria-hidden focusable behaves as a focus sentinel (immediate runtime redirect)`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_sentinel" aria-hidden="true" tabindex="0">Focus sentinel</div>
      <input id="target_after" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel');
  const target = doc.getElementById('target_after');
  sentinel.addEventListener('focus', () => target.focus());

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  assert.ok(hasOccurrenceForId(rule, 'ah_sentinel'));
  assert.strictEqual(
    rule.occurrences[0].summary,
    'aria-hidden div received focus but focus moved immediately to another element. Verify sentinel/focus-trap behavior.'
  );
  assert.strictEqual(
    rule.occurrences[0].data.details.reasonCode,
    'ariaHiddenFocusable_runtimeRedirect_needsReview'
  );
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe.redirectedToId, 'target_after');
});

test(`${RULE_ID}: cantTell when redirect is scheduled shortly after focus (setTimeout)`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_sentinel_async" aria-hidden="true" tabindex="0">Focus sentinel async</div>
      <input id="target_after_async" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel_async');
  const target = doc.getElementById('target_after_async');
  sentinel.addEventListener('focus', () => {
    dom.window.setTimeout(() => target.focus(), 0);
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_sentinel_async'));
  assert.strictEqual(
    rule.occurrences[0].data.details.runtimeProbe.redirectedToId,
    'target_after_async'
  );
});

test(`${RULE_ID}: cantTell when redirect is scheduled via requestAnimationFrame`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_sentinel_raf" aria-hidden="true" tabindex="0">Focus sentinel raf</div>
      <input id="target_after_raf" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel_raf');
  const target = doc.getElementById('target_after_raf');
  sentinel.addEventListener('focus', () => {
    dom.window.requestAnimationFrame(() => target.focus());
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.runtimeProbe.redirectedToId,
    'target_after_raf'
  );
});

test(`${RULE_ID}: cantTell when redirect is scheduled via queueMicrotask`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_sentinel_mt" aria-hidden="true" tabindex="0">Focus sentinel microtask</div>
      <input id="target_after_mt" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel_mt');
  const target = doc.getElementById('target_after_mt');
  sentinel.addEventListener('focus', () => {
    dom.window.queueMicrotask(() => target.focus());
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.runtimeProbe.redirectedToId,
    'target_after_mt'
  );
});

test(`${RULE_ID}: fail (not cantTell) when the redirect only happens after a long delay outside the observation window`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_sentinel_slow" aria-hidden="true" tabindex="0">Focus sentinel slow</div>
      <input id="target_after_slow" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel_slow');
  const target = doc.getElementById('target_after_slow');
  let timerId;
  sentinel.addEventListener('focus', () => {
    timerId = dom.window.setTimeout(() => target.focus(), 500);
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_sentinel_slow'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'ariaHiddenSelfFocusable');
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe, null);
  dom.window.clearTimeout(timerId);
});

test(`${RULE_ID}: stays fail (not downgraded) when focus redirects to another element still inside the same aria-hidden subtree`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_root_internal" aria-hidden="true">
        <button id="ah_only_candidate" tabindex="0">Sentinel</button>
        <div id="ah_inner_sink" tabindex="-1">Programmatic sink, not a tab-order candidate</div>
      </div>
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_only_candidate');
  const sink = doc.getElementById('ah_inner_sink');
  sentinel.addEventListener('focus', () => sink.focus());

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_root_internal'));
  assert.strictEqual(rule.occurrences[0].occurrenceOutcome, 'fail');
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'ariaHiddenContainsFocusable');
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe, null);
});

test(`${RULE_ID}: cantTell when the redirect target is inside a shadow root outside the aria-hidden subtree (getDeepActiveElement shadow traversal)`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_shadow_root" aria-hidden="true"><button id="ah_shadow_sentinel" tabindex="0">Sentinel</button></div>
      <div id="shadow-host"></div>
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_shadow_sentinel');
  const shadowRoot = doc.getElementById('shadow-host').attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = '<button id="shadow-target">Shadow target</button>';
  sentinel.addEventListener('focus', () => {
    shadowRoot.getElementById('shadow-target').focus();
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_shadow_root'));
  assert.strictEqual(rule.occurrences[0].data.details.runtimeProbe.redirectedToTag, 'button');
});

test(`${RULE_ID}: redirect is still detected when focus({preventScroll}) throws and falls back to plain focus()`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_sentinel_fallback" aria-hidden="true" tabindex="0">Focus sentinel fallback</div>
      <input id="target_after_fallback" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel_fallback');
  const target = doc.getElementById('target_after_fallback');
  const originalFocus = sentinel.focus.bind(sentinel);
  sentinel.focus = function (opts) {
    if (opts) throw new Error('preventScroll unsupported in this simulated environment');
    return originalFocus();
  };
  sentinel.addEventListener('focus', () => target.focus());

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(
    rule.occurrences[0].data.details.runtimeProbe.redirectedToId,
    'target_after_fallback'
  );
});

test(`${RULE_ID}: mixed independent roots keep per-occurrence outcome differentiation (fail + cantTell in one atomic result)`, () => {
  const dom = createDom(`<!doctype html><html><body>
      <div id="ah_hard_fail" aria-hidden="true" tabindex="0">Focusable hidden</div>
      <div id="ah_sentinel_mixed" aria-hidden="true" tabindex="0">Focus sentinel</div>
      <input id="target_after_mixed" type="text" />
    </body></html>`);

  const doc = dom.window.document;
  const sentinel = doc.getElementById('ah_sentinel_mixed');
  const target = doc.getElementById('target_after_mixed');
  sentinel.addEventListener('focus', () => target.focus());

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const failOccurrence = getOccurrenceForId(rule, 'ah_hard_fail');
  const cantTellOccurrence = getOccurrenceForId(rule, 'ah_sentinel_mixed');
  assert.ok(failOccurrence);
  assert.ok(cantTellOccurrence);
  assert.strictEqual(failOccurrence.occurrenceOutcome, 'fail');
  assert.strictEqual(cantTellOccurrence.occurrenceOutcome, 'cantTell');
});

// ===== open-modal downgrade (fail -> cantTell) =====

test(`${RULE_ID}: cantTell when a custom aria-modal="true" dialog is open behind an aria-hidden background`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_bg_modal" aria-hidden="true">
        <a id="bg_link" href="#x">Background link</a>
        <button id="bg_btn">Background button</button>
      </div>
      <div id="the_dialog" role="dialog" aria-modal="true">
        <button>OK</button>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = getOccurrenceForId(rule, 'ah_bg_modal');
  assert.ok(occ);
  assert.strictEqual(occ.occurrenceOutcome, 'cantTell');
  assert.strictEqual(occ.data.details.reasonCode, 'ariaHiddenFocusable_modalOpen_needsReview');
  assert.strictEqual(occ.data.details.metrics.modalOpen, true);
  assert.strictEqual(
    occ.summary,
    'aria-hidden div contains 2 focusable element(s) while a modal dialog is open. If the modal keeps keyboard focus trapped they may be unreachable; verify focus cannot land on them.'
  );
});

test(`${RULE_ID}: cantTell when a native dialog[open] is present behind an aria-hidden background`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_bg_native" aria-hidden="true">
        <a id="bg_link_native" href="#x">Background link</a>
      </div>
      <dialog id="native_dialog" open><button>Close</button></dialog>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = getOccurrenceForId(rule, 'ah_bg_native');
  assert.ok(occ);
  assert.strictEqual(occ.data.details.reasonCode, 'ariaHiddenFocusable_modalOpen_needsReview');
});

test(`${RULE_ID}: stays fail (not downgraded) when the open modal lives INSIDE the aria-hidden subtree`, () => {
  // A modal that is itself inside the hidden subtree really is broken
  // (the dialog is being hidden), so this must remain a hard fail.
  const html = `<!doctype html><html><body>
      <div id="ah_bg_inner_modal" aria-hidden="true">
        <div role="dialog" aria-modal="true">
          <button id="inner_dialog_btn">OK</button>
        </div>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = getOccurrenceForId(rule, 'ah_bg_inner_modal');
  assert.ok(occ);
  assert.strictEqual(occ.occurrenceOutcome, 'fail');
  assert.strictEqual(occ.data.details.metrics.modalOpen, false);
});

test(`${RULE_ID}: stays fail when the only aria-modal element is display:none (not actually open)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_bg_hidden_modal" aria-hidden="true">
        <a id="bg_link_hidden_modal" href="#x">Background link</a>
      </div>
      <div role="dialog" aria-modal="true" style="display:none">
        <button>OK</button>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = getOccurrenceForId(rule, 'ah_bg_hidden_modal');
  assert.ok(occ);
  assert.strictEqual(occ.occurrenceOutcome, 'fail');
});

test(`${RULE_ID}: cantTell for the Angular Material default (role="dialog" with aria-modal="false") behind an aria-hidden background`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_bg_mat" aria-hidden="true">
        <a id="bg_link_mat" href="#x">Background link</a>
      </div>
      <div role="dialog" aria-modal="false">
        <button>OK</button>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = getOccurrenceForId(rule, 'ah_bg_mat');
  assert.ok(occ);
  assert.strictEqual(occ.data.details.reasonCode, 'ariaHiddenFocusable_modalOpen_needsReview');
});

test(`${RULE_ID}: cantTell for a fallback-list or upper-case dialog role (role="foo dialog", role="ALERTDIALOG") behind an aria-hidden background`, () => {
  for (const role of ['foo dialog', 'ALERTDIALOG']) {
    const html = `<!doctype html><html><body>
        <div id="ah_bg_fallback" aria-hidden="true">
          <a href="#x">Background link</a>
        </div>
        <div role="${role}" aria-modal="false"><button>OK</button></div>
      </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = getOccurrenceForId(rule, 'ah_bg_fallback');
    assert.ok(occ, role);
    assert.strictEqual(occ.data.details.reasonCode, 'ariaHiddenFocusable_modalOpen_needsReview');
  }
});

test(`${RULE_ID}: stays fail when the dialog token is only a fallback after a real role (role="region dialog")`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_bg_region" aria-hidden="true">
        <a href="#x">Background link</a>
      </div>
      <div role="region dialog" aria-label="Panel"><button>OK</button></div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(getOccurrenceForId(rule, 'ah_bg_region'));
});

test(`${RULE_ID}: fail when aria-hidden native control itself is focusable (button)`, () => {
  const html = `<!doctype html><html><body>
      <button id="ah_btn" aria-hidden="true">Hidden button</button>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_btn'));
  assert.strictEqual(
    rule.occurrences[0].summary,
    'aria-hidden button is focusable (1 focusable element(s)).'
  );
});

test(`${RULE_ID}: fail when aria-hidden subtree contains focusable descendant (link)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root2" aria-hidden="true">
        <a id="focus_link" href="#x">Focusable link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_root2'));
  assert.strictEqual(
    rule.occurrences[0].summary,
    'aria-hidden div contains 1 focusable element(s).'
  );
});

test(`${RULE_ID}: fail when a slotted focusable element's aria-hidden ancestor only exists across a shadow-DOM slot boundary`, () => {
  // closestAriaHiddenTrue walks ancestors via composedParent, which checks
  // assignedSlot before parentNode: parentNode is always truthy for a
  // normally-connected slotted element, so checking it first would mean the
  // assignedSlot branch never fires, silently missing any aria-hidden
  // ancestor that only exists inside the shadow tree a light-DOM element
  // is distributed into. Getting this wrong is a false negative: a hidden
  // but focusable element going unflagged.
  const dom = createDom(`<!doctype html><html><body>
      <div id="host"><button id="a" slot="x">Btn</button></div>
    </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML =
    `<div id="ah_shadow_root" aria-hidden="true"><slot name="x"></slot></div>`;

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  // The rule reports against the aria-hidden root (not the offending
  // descendant), same convention as the "focusable descendant (link)"
  // test above, with the offender summarized in data.details.offenders.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_shadow_root'));
  assert.strictEqual(rule.occurrences[0].data.details.offenders[0].tag, 'button');
});

test(`${RULE_ID}: pass when the only "focusable" content has an explicit negative tabindex`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_neg_desc" aria-hidden="true">
        <button tabindex="-1">Not tabbable</button>
        <a href="#x" tabindex="-1">Not tabbable link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the aria-hidden root itself has an explicit negative tabindex`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_neg_self" aria-hidden="true" tabindex="-1">Root has negative tabindex</div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-hidden element is focusable AND contains focusable descendants`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root_mix" aria-hidden="true" tabindex="0">
        <a id="focus_link2" href="#x">Focusable link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_root_mix'));
  assert.strictEqual(
    rule.occurrences[0].summary,
    'aria-hidden div is focusable and contains 1 focusable descendant(s) (2 focusable element(s) total).'
  );
});

test(`${RULE_ID}: excludes display:none focusable candidates (pass when only display:none focusables exist)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root3" aria-hidden="true">
        <a id="hidden_link" href="#x" style="display:none">Hidden link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: excludes visibility:hidden focusable candidates (pass when only visibility:hidden focusables exist)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root4" aria-hidden="true">
        <a id="vh_link" href="#x" style="visibility:hidden">Hidden link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: excludes candidates that are opacity:0 AND visibility:hidden together (pass, visibility:hidden wins)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root_op_vh" aria-hidden="true">
        <a id="op_vh_link" href="#x" style="opacity:0;visibility:hidden">Hidden link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: excludes a candidate whose closer ancestor is opacity:0 but a FARTHER ancestor is display:none (the closer, filterable opacity:0 must not mask the farther, unconditional display:none)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_outer_display_none" style="display:none">
        <div id="ah_root_deep" aria-hidden="true">
          <div style="opacity:0">
            <a href="#x">Nested link</a>
          </div>
        </div>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: includeHiddenElements=true restores legacy behavior for display:none ancestor case (pass)`, () => {
  const html = `<!doctype html><html><body>
      <div style="display:none">
        <div aria-hidden="true">
          <div style="opacity:0">
            <a href="#x">Nested link</a>
          </div>
        </div>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { includeHiddenElements: true }
  });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: does NOT exclude opacity:0 focusable candidates (fail when opacity:0 link exists)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root5" aria-hidden="true">
        <a id="op_link" href="#x" style="opacity:0">Invisible but focusable link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_root5'));
  assert.strictEqual(
    rule.occurrences[0].summary,
    'aria-hidden div contains 1 focusable element(s).'
  );
});

test(`${RULE_ID}: inert subtree is not focusable => pass when only inert focusables exist`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_root6" aria-hidden="true" inert>
        <a id="inert_link" href="#x">Link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: contenteditable="false" does NOT trigger a fail (explicit non-editing host is not focus-enabling)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_ce_false" aria-hidden="true">
        <div contenteditable="false">Not editable</div>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: contenteditable (empty attr = true) triggers a fail`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_ce_empty" aria-hidden="true">
        <div contenteditable>Editable</div>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_ce_empty'));
});

test(`${RULE_ID}: iframe under aria-hidden triggers a fail`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_iframe" aria-hidden="true">
        <iframe title="f" src="about:blank"></iframe>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_iframe'));
});

test(`${RULE_ID}: audio[controls] under aria-hidden triggers a fail`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_audio" aria-hidden="true">
        <audio controls src="a.mp3"></audio>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_audio'));
});

test(`${RULE_ID}: audio WITHOUT controls under aria-hidden does not trigger a fail`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_audio_nc" aria-hidden="true">
        <audio src="a.mp3"></audio>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: video[controls] under aria-hidden triggers a fail`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_video" aria-hidden="true">
        <video controls src="v.mp4"></video>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ah_video'));
});

test(`${RULE_ID}: disabled form control exception (pass even though disabled button matches focusable selector)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_disabled_btn" aria-hidden="true">
        <button disabled>Disabled</button>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a control disabled by an ancestor <fieldset disabled> is not focusable (pass)`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <div aria-hidden="true">
        <fieldset disabled><input aria-label="x"><select aria-label="y"><option>a</option></select></fieldset>
      </div>
    </body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a control in the first <legend> of a disabled fieldset stays focusable (fail)`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <div id="ah_legend" aria-hidden="true">
        <fieldset disabled><legend><input aria-label="x"></legend></fieldset>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: aria-hidden <area href> of a map an image uses fails; judged by that image`, () => {
  const page = (img) => `<!doctype html><html lang="en"><head><title>t</title></head><body>
      ${img}
      <map name="m"><area id="ar" href="/a" alt="P" shape="rect" coords="0,0,10,10" aria-hidden="true"></map>
    </body></html>`;
  const used = page('<img src="a.png" alt="Plan" usemap="#m">');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(used, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'ar'));
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'ariaHiddenSelfFocusable');
  }
  // No image uses the map, or the image is not rendered: the area takes no focus.
  for (const img of ['', '<img src="a.png" alt="Plan" usemap="#m" hidden>']) {
    assertRule(runa11yCoreOnHtml(page(img), { runOnly: [RULE_ID] }), RULE_ID, 'pass');
  }
  // A negative tabindex takes the area out of the tab order.
  const negative = used.replace('aria-hidden="true"', 'aria-hidden="true" tabindex="-1"');
  assertRule(runa11yCoreOnHtml(negative, { runOnly: [RULE_ID] }), RULE_ID, 'pass');
});

// ===== visibilityHints metric (data.details.metrics.visibilityHints) =====
// getVisibilityHints is a diagnostic-only enrichment (does not affect
// outcome -- opacity/clip/offscreen focusables are already in-scope and
// flagged regardless), covering the classic visually-hidden-but-focusable
// CSS patterns real sites use behind aria-hidden.

test(`${RULE_ID}: visibilityHints includes "clipped" for the classic clip:rect(0,0,0,0) visually-hidden pattern`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_clip" aria-hidden="true">
        <a id="clip_link" href="#x" style="position:absolute;clip:rect(0,0,0,0)">Visually hidden link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.metrics.visibilityHints.includes('clipped'));
});

test(`${RULE_ID}: visibilityHints includes "clipped" for clip-path:inset(50%)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_clippath" aria-hidden="true">
        <a id="clippath_link" href="#x" style="clip-path:inset(50%)">Clipped link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.metrics.visibilityHints.includes('clipped'));
});

test(`${RULE_ID}: visibilityHints includes "zeroSizeOverflowHidden" for a zero-size, overflow:hidden focusable`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_zerosize" aria-hidden="true">
        <a id="zerosize_link" href="#x" style="width:0px;height:0px;overflow:hidden;display:inline-block">Zero-size link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(
    rule.occurrences[0].data.details.metrics.visibilityHints.includes('zeroSizeOverflowHidden')
  );
});

test(`${RULE_ID}: visibilityHints includes "offscreen" for the classic large-negative-text-indent technique`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_offscreen" aria-hidden="true">
        <a id="offscreen_link" href="#x" style="text-indent:-9999px">Off-screen link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.metrics.visibilityHints.includes('offscreen'));
});

test(`${RULE_ID}: visibilityHints includes "offscreen" for position:absolute with a large negative left offset`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_offscreen2" aria-hidden="true">
        <a id="offscreen_link2" href="#x" style="position:absolute;left:-9999px">Off-screen link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.metrics.visibilityHints.includes('offscreen'));
});

test(`${RULE_ID}: visibilityHints is empty for an ordinary visible focusable (no false hints)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_plain" aria-hidden="true">
        <a id="plain_link" href="#x">Ordinary link</a>
      </div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepEqual(rule.occurrences[0].data.details.metrics.visibilityHints, []);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-hidden-focus-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-hidden-focus-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 21, maxOccurrences: 21 });

  const expectedFailIds = [
    'case_link_href',
    'case_button',
    'case_input',
    'case_select',
    'case_textarea',
    'case_summary',
    'case_tabindex',
    'case_contenteditable_true',
    'case_contenteditable_empty',
    'case_iframe',
    'case_audio_controls',
    'case_video_controls',
    'case_area_href',
    'case_area_self',
    'case_opacity_zero',
    'case_self_focusable',
    'case_self_and_descendant',
    'case_clip_rect',
    'case_clip_path_inset',
    'case_zero_size_overflow_hidden',
    'case_offscreen_text_indent'
  ];

  const expectedNoOccIds = [
    'case_non_focusable_content',
    'case_contenteditable_false',
    'case_audio_no_controls',
    'case_video_no_controls',
    'case_inert',
    'case_disabled_button',
    'case_disabled_input',
    'case_fieldset_disabled',
    'case_area_unused_map',
    'case_display_none',
    'case_visibility_hidden',
    'case_opacity_and_visibility_hidden',
    'case_opacity_close_display_none_far',
    'case_tabindex_negative_descendant',
    'case_tabindex_negative_self'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }

  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n default is English (title/description/occurrence strings)`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_i18n_en" aria-hidden="true"><a href="#x">Link</a></div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  assert.strictEqual(rule.title, 'ARIA hidden elements must not be focusable');
  assert.strictEqual(
    rule.description,
    'Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'aria-hidden div contains 1 focusable element(s).');
  assert.strictEqual(
    occ.hint,
    'Remove focusability from descendants or remove aria-hidden; ensure focus and accessibility trees stay aligned.'
  );
});

test(`${RULE_ID}: i18n (fr) rule title/description/occurrence strings are localized`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_i18n_fr" aria-hidden="true"><a href="#x">Link</a></div>
    </body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  assert.strictEqual(rule.title, 'Les éléments aria-hidden ne doivent pas être focalisables');
  assert.strictEqual(
    rule.description,
    'Vérifie que les éléments avec aria-hidden="true" ne sont pas focalisables et ne contiennent pas d’éléments focalisables.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'L’élément aria-hidden div contient 1 élément(s) focalisable(s).'
  );
  assert.strictEqual(
    occ.hint,
    'Supprimez la focalisation des descendants ou retirez aria-hidden ; assurez la cohérence entre l’ordre de focus et l’arbre d’accessibilité.'
  );
});

test(`${RULE_ID}: i18n unknown locale falls back to English`, () => {
  const html = `<!doctype html><html><body>
      <div id="ah_i18n_zz" aria-hidden="true"><a href="#x">Link</a></div>
    </body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'zz' }
  });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  assert.strictEqual(rule.title, 'ARIA hidden elements must not be focusable');
  assert.strictEqual(
    rule.description,
    'Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.'
  );
});

// aria-hidden removes an element from the accessibility tree and changes
// nothing on screen: a focusable element inside it is a 4.1.2 defect (ACT
// 6cfa84), not a Focus Visible one (#116).
test(`${RULE_ID}: maps to 4.1.2 only, so the Focus Visible rollup does not fail for it`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main>
      <button aria-hidden="true">Close</button>
    </main></body></html>`;
  const result = runa11yCoreOnHtml(html, {});
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.strictEqual(rule.outcome, 'fail');
  assert.deepStrictEqual(rule.rollupIds, ['wcag-4.1.2-name']);

  const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id);
  assert.strictEqual(rollup('wcag-4.1.2-name').outcome, 'fail');
  assert.notStrictEqual(rollup('wcag-2.4.7-focus-visible').outcome, 'fail');
  assert.ok(!rollup('wcag-2.4.7-focus-visible').data.details.checksIds.includes(RULE_ID));

  const def = getCheckDefById(RULE_ID);
  assert.deepStrictEqual(def.wcagSc, ['4.1.2']);
  assert.ok(!def.tags.includes('wcag2aa'));
});

// Browsers hide aria-hidden="TRUE" too. The rule's ancestor walk read the
// value in any case, but its first query matched only "true", so a page
// whose only hidden roots were written otherwise was notApplicable (#148).
test(`${RULE_ID}: aria-hidden="true" in any case, and trimmed, is a hidden root`, () => {
  for (const value of ['TRUE', 'True', ' true ']) {
    for (const body of [
      `<div aria-hidden="${value}"><button>Close</button></div>`,
      `<button aria-hidden="${value}">Close</button>`
    ]) {
      const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p>${body}</main></body></html>`;
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
      assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    }
  }
  for (const value of ['false', 'yes', '']) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div aria-hidden="${value}"><button>Close</button></div></main></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

// A page that reacts to focus (#168): a carousel's focusin handler moves
// aria-hidden to the slide whose link took focus. The findings, and the
// markup they report, are those of the page as found, and focus is not
// left in a hidden slide.
test('aria-hidden-focus: a page that reacts to focus is reported as it was found', () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id="car">' +
      '<div class="slide" id="s1"><a href="/1">One</a></div>' +
      '<div class="slide" id="s2" aria-hidden="true"><a href="/2">Two</a></div>' +
      '<div class="slide" id="s3" aria-hidden="true"><a href="/3">Three</a></div>' +
      '</div></main></body></html>'
  );
  const doc = dom.window.document;
  doc.getElementById('car').addEventListener('focusin', (e) => {
    const slide = e.target.closest('.slide');
    for (const s of doc.querySelectorAll('.slide')) {
      if (s === slide) s.removeAttribute('aria-hidden');
      else s.setAttribute('aria-hidden', 'true');
    }
  });
  const r = runa11yCoreOnDom(dom, { runOnly: ['aria-hidden-focus'] }).checksResults[0];
  assert.strictEqual(r.outcome, 'fail');
  assert.deepStrictEqual(
    r.occurrences.map((o) => [o.selector, o.html.includes('aria-hidden="true"')]),
    [
      ['#s2', true],
      ['#s3', true]
    ]
  );
  assert.strictEqual(doc.activeElement, doc.body);
});
