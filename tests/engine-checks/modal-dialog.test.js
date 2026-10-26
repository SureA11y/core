'use strict';

// While a modal dialog is open, the rest of the page is inert: assistive
// technology gets only the dialog. Element rules leave the inert content out,
// and rules about the page's own structure are notApplicable, since the scan
// saw a dialog, not the page (#58). jsdom has no top layer, so these use an
// open dialog with aria-modal="true", which the engine takes as modal only
// there; modal-dialog-chromium.test.js covers showModal(), and that a
// browser does not treat such a dialog as modal.

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const page = (dialog) =>
  '<!doctype html><html lang="en"><head><title>Shop</title></head><body>' +
  '<nav aria-label="Primary"><a href="/">Home</a></nav>' +
  '<main><h1>Shop</h1><img id="behind" src="x.png"></main>' +
  dialog +
  '</body></html>';
const MODAL =
  '<dialog open aria-modal="true" aria-label="Sign in"><nav aria-label="Primary"><a href="/a">A</a></nav><img id="inside" src="y.png"><button>Close</button></dialog>';

function outcome(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  return result.checksResults.find((c) => c.ruleId === ruleId);
}

for (const ruleId of [
  'page-has-heading-one',
  'landmark-one-main',
  'bypass-blocks-present',
  'region'
]) {
  test(`${ruleId}: notApplicable while a modal dialog is open, and judged as before without one`, () => {
    assert.strictEqual(outcome(page(MODAL), ruleId).outcome, 'notApplicable');
    assert.notStrictEqual(outcome(page(''), ruleId).outcome, 'notApplicable');
  });
}

test('img-alt-present: an image behind an open modal dialog is not judged; one inside it is', () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(MODAL), { runOnly: ['img-alt-present'] }),
    'img-alt-present',
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.ok(rule.occurrences[0].html.includes('id="inside"'));
});

test('landmark-unique: the inert page nav does not collide with the dialog nav', () => {
  assertRule(
    runa11yCoreOnHtml(page(MODAL), { runOnly: ['landmark-unique'] }),
    'landmark-unique',
    'notApplicable',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

test('a dialog that is open but not modal leaves the page as it is', () => {
  const html = page('<dialog open aria-label="Note"><p>Hi</p></dialog>');
  assertRule(runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'] }), 'img-alt-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(outcome(html, 'page-has-heading-one').outcome, 'pass');
});

// Rules that find their elements through the shared query (queryAllSmart) or
// the contrast text scan, rather than checking accessibility-tree eligibility
// themselves: they too leave out what an open modal makes inert.
const BEHIND =
  '<div id="behind-all">' +
  '<p id="faint" style="color:#aaa">Faint text</p>' +
  '<dl id="dl"><div>Not a term</div></dl>' +
  '<div id="tab" tabindex="5">Jumps the tab order</div>' +
  '<span id="lang" lang="xx-invalid-tag-zz">Text</span>' +
  '<video id="vid" src="v.mp4" controls></video>' +
  '</div>';
const PAGE_BEHIND = (dialog) =>
  '<!doctype html><html lang="en"><head><title>Shop</title></head>' +
  '<body style="background:#ffffff;color:#000000"><main><h1>Shop</h1>' +
  BEHIND +
  '</main>' +
  dialog +
  '</body></html>';
const PLAIN_MODAL =
  '<dialog open aria-modal="true" aria-label="Sign in" style="background:#ffffff;color:#000000"><p>Sign in</p><button>Close</button></dialog>';

for (const ruleId of [
  'contrast-minimum',
  'contrast-enhanced',
  'definition-list-children-valid',
  'tabindex',
  'valid-lang',
  'video-caption'
]) {
  test(`${ruleId}: content behind an open modal dialog is not judged`, () => {
    const without = outcome(PAGE_BEHIND(''), ruleId);
    assert.ok(
      ['fail', 'cantTell'].includes(without.outcome),
      `without a modal the page has something to report (${without.outcome})`
    );
    const withModal = outcome(PAGE_BEHIND(PLAIN_MODAL), ruleId);
    assert.deepStrictEqual(
      withModal.occurrences.filter((o) => /behind-all|id="(faint|dl|tab|lang|vid)"/.test(o.html)),
      [],
      `${ruleId} judged content behind the modal`
    );
  });
}

test('contrast-minimum: faint text inside the open modal dialog is still judged', () => {
  const modal =
    '<dialog open aria-modal="true" aria-label="Sign in" style="background:#ffffff"><p id="faint-in" style="color:#bbbbbb">Faint in the dialog</p></dialog>';
  const rule = outcome(PAGE_BEHIND(modal), 'contrast-minimum');
  assert.strictEqual(rule.outcome, 'fail');
  assert.ok(rule.occurrences.some((o) => /faint-in/.test(o.html)));
  assert.ok(!rule.occurrences.some((o) => /id="faint"/.test(o.html)));
});

test('no-autoplay-audio still reports autoplaying media behind a modal: it plays all the same', () => {
  const html = PAGE_BEHIND(PLAIN_MODAL).replace(
    '<video id="vid" src="v.mp4" controls></video>',
    '<audio id="aud" src="a.mp3" autoplay></audio>'
  );
  assert.strictEqual(outcome(html, 'no-autoplay-audio').outcome, 'cantTell');
});

test('a full scan with a modal open reports nothing behind it, apart from page-wide findings and sound', () => {
  const result = runa11yCoreOnHtml(PAGE_BEHIND(PLAIN_MODAL));
  // Findings about the page as a whole (its title, its language) and about
  // sound, which an inert page still plays, are allowed to stay.
  const allowed = new Set(['no-autoplay-audio', 'page-title-patterns', 'manual-review']);
  const leaks = [];
  for (const rule of result.checksResults) {
    if (allowed.has(rule.ruleId)) continue;
    for (const o of rule.occurrences || []) {
      if (/behind-all|id="(faint|dl|tab|lang|vid)"/.test(o.html || '')) leaks.push(rule.ruleId);
    }
  }
  assert.deepStrictEqual(leaks, []);
});

// A script-made modal: an element with role="dialog" or role="alertdialog"
// and aria-modal="true", shown. aria-modal makes nothing inert (Tab and
// clicks still reach the page), so element rules keep judging the page
// behind it; but the scan saw a dialog, so rules about the page's own
// structure are notApplicable, as with a modal <dialog>.
const ARIA_MODAL = (attrs) =>
  `<div ${attrs} aria-label="Sign in"><img id="inside" src="y.png"><button>Close</button></div>`;

for (const ruleId of [
  'page-has-heading-one',
  'landmark-one-main',
  'bypass-blocks-present',
  'region'
]) {
  test(`${ruleId}: notApplicable while a shown role="dialog" with aria-modal="true" is open`, () => {
    assert.strictEqual(
      outcome(page(ARIA_MODAL('role="dialog" aria-modal="true"')), ruleId).outcome,
      'notApplicable'
    );
    assert.strictEqual(
      outcome(page(ARIA_MODAL('role="alertdialog" aria-modal="true"')), ruleId).outcome,
      'notApplicable'
    );
  });

  test(`${ruleId}: a hidden aria-modal dialog, or a role="dialog" without aria-modal, does not count`, () => {
    const without = outcome(page(''), ruleId).outcome;
    for (const attrs of [
      'role="dialog" aria-modal="true" style="display:none"',
      'role="dialog" aria-modal="true" hidden',
      'role="dialog" aria-modal="true" style="visibility:hidden"',
      'role="dialog" aria-modal="true" aria-hidden="true"',
      'role="dialog"',
      'role="dialog" aria-modal="false"'
    ]) {
      assert.strictEqual(outcome(page(ARIA_MODAL(attrs)), ruleId).outcome, without, attrs);
    }
  });
}

test('img-alt-present: an image behind a role="dialog" with aria-modal="true" is still judged', () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(ARIA_MODAL('role="dialog" aria-modal="true"')), {
      runOnly: ['img-alt-present']
    }),
    'img-alt-present',
    'fail',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.ok(rule.occurrences.some((o) => o.html.includes('id="behind"')));
  assert.ok(rule.occurrences.some((o) => o.html.includes('id="inside"')));
});

test('skip-link: a shown aria-modal dialog explains a target hidden by aria-hidden; a hidden one does not', () => {
  const lean = (dialog) => {
    const html =
      '<!doctype html><html lang="en"><body><a href="#c">Skip to content</a>' +
      '<main id="c" aria-hidden="true">x</main>' +
      dialog +
      '</body></html>';
    return assertRule(
      runa11yCoreOnHtml(html, { runOnly: ['skip-link'] }),
      'skip-link',
      'cantTell',
      {
        minOccurrences: 1,
        maxOccurrences: 1
      }
    ).occurrences[0].lean;
  };
  assert.strictEqual(lean(ARIA_MODAL('role="dialog" aria-modal="true"')), undefined);
  assert.strictEqual(
    lean(ARIA_MODAL('role="dialog" aria-modal="true" style="display:none"')).toward,
    'fail'
  );
});
