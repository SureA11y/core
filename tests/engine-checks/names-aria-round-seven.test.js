'use strict';

/**
 * Names, roles and structure: what the seventh stress test found
 * (AN-1 to AN-8 on audit/register), each with the markup it was found on.
 * jsdom, apart from the form-associated custom element, which needs a
 * browser's ElementInternals and the internals hook.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../helpers/chromium.js');
const { addBundle } = require('../helpers/browserBundle');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
function check(html, ruleId, engineOptions = {}) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId], engineOptions });
  return result.checksResults.find((c) => c.ruleId === ruleId);
}

test('a web component header inside an article is not a second page banner (AN-2)', () => {
  const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml.js');
  const dom = createDom(
    page(
      '<header>Site</header><main><article><post-head id="ph"></post-head><p>Text</p></article></main>'
    )
  );
  // The component's shadow tree, attached as its constructor would.
  const host = dom.window.document.getElementById('ph');
  host.attachShadow({ mode: 'open' }).innerHTML = '<header><h2>Post</h2></header>';
  const result = runa11yCoreOnDom(dom, { runOnly: ['landmark-no-duplicate-banner'] });
  const banners = result.checksResults.find((c) => c.ruleId === 'landmark-no-duplicate-banner');
  assert.equal(banners.occurrences.length, 0, JSON.stringify(banners.occurrences));
});

test('three messages quote a long value capped, not whole (AN-3)', () => {
  const x = 'x'.repeat(200000);
  for (const [ruleId, body] of [
    [
      'form-control-label-quality',
      `<label>${x} <input type="checkbox"></label><label>${x} <input type="checkbox"></label>`
    ],
    ['identical-links-same-purpose', `<a href="/${x}">Read more</a><a href="/b">Read more</a>`],
    ['aria-valid-attr-value', `<div aria-live="${x}">Text</div>`]
  ]) {
    const c = check(page(`<main><h1>h</h1>${body}</main>`), ruleId);
    assert.ok(c.occurrences.length, ruleId);
    assert.ok(JSON.stringify(c).length < 20000, `${ruleId}: ${JSON.stringify(c).length}`);
  }
});

test('a submit or reset button with an empty value has no name (AN-4)', () => {
  for (const input of [
    '<input type="submit" value="">',
    '<input type="reset" value="">',
    '<input type="submit" value="   ">'
  ]) {
    assert.equal(
      check(page(`<main><form>${input}</form></main>`), 'button-name-present').outcome,
      'fail',
      input
    );
  }
  // No value attribute: the browser's own label, "Submit".
  assert.equal(
    check(page('<main><form><input type="submit"></form></main>'), 'button-name-present').outcome,
    'pass'
  );
});

test('a main landmark in an excluded area is still the page main (AN-5)', () => {
  const html = page(
    '<header><nav><a href="/">Home</a></nav></header><main id="m"><h1>Title</h1><p>Text</p></main><footer>F</footer>'
  );
  for (const ruleId of ['landmark-one-main', 'bypass-blocks-present']) {
    const c = check(html, ruleId, { excludeSelectors: ['#m'] });
    assert.equal(c.occurrences.length, 0, `${ruleId}: ${JSON.stringify(c.occurrences)}`);
  }
});

test('<li> in an element with role list is a list item to both rules (AN-6)', () => {
  const html = page('<main><div role="list"><li>a</li><li>b</li></div></main>');
  assert.equal(check(html, 'aria-required-children').outcome, 'pass');
  assert.equal(check(html, 'listitem-parent-valid').outcome, 'pass');
});

test('an invalid aria-checked on a native checkbox is asked about, as on an <option> (AN-7)', () => {
  const native = check(
    page('<main><label><input type="checkbox" aria-checked="yes"> Agree</label></main>'),
    'aria-valid-attr-value'
  );
  assert.equal(native.outcome, 'cantTell');
  // An ARIA checkbox has no other state: it still fails.
  const aria = check(
    page('<main><div role="checkbox" aria-checked="yes" tabindex="0">Agree</div></main>'),
    'aria-valid-attr-value'
  );
  assert.equal(aria.outcome, 'fail');
});

test('the presentation conflict message names what marks the element (AN-8)', () => {
  const summaries = (body) =>
    check(page(`<main>${body}</main>`), 'presentation-role-conflict').occurrences.map(
      (o) => o.summary
    );
  assert.match(
    summaries('<img src="a.png" alt="" tabindex="0">')[0],
    /marked alt="" but can take focus/
  );
  assert.match(
    summaries('<div role="presentation" aria-label="x">x</div>')[0],
    /marked role="presentation" but also has aria-label,/
  );
});

test('a form-associated custom element is labelled by <label> (AN-1)', { skip }, async () => {
  const { internalsHookScript } = require('../../src/index.js');
  const browser = await chromium.launch({ executablePath });
  try {
    const context = await browser.newContext();
    await context.addInitScript({ content: internalsHookScript({ early: true }) });
    const p = await context.newPage();
    await p.setContent(
      page(
        '<script>customElements.define("x-fa", class extends HTMLElement { static formAssociated = true; constructor() { super(); const i = this.attachInternals(); i.role = "checkbox"; i.ariaChecked = "false"; } });</script>' +
          '<main><h1>h</h1><label>Rating <x-fa tabindex="0"></x-fa></label><label for="fa2">Agree</label><x-fa id="fa2" tabindex="0"></x-fa></main>'
      )
    );
    await addBundle(p);
    const outcome = await p.evaluate(async () => {
      const r = await window.a11ycore.runa11yCoreInPage(
        null,
        null,
        { rules: { include: 'binary-control-name-present' } },
        null
      );
      return r.checksResults.find((c) => c.ruleId === 'binary-control-name-present').outcome;
    });
    assert.equal(outcome, 'pass');
  } finally {
    await browser.close();
  }
});
