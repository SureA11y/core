'use strict';

// link-in-text-block: cascade layers decide which declaration underlines a
// link's content. jsdom cascades no layered rule, so the rule reads the
// style sheets there, and must give Chromium's answer (round 11, D9). Each
// case runs under jsdom and in Chromium.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../../helpers/chromium');
const { addBundle } = require('../../helpers/browserBundle');

const RULE_ID = 'link-in-text-block';
const CASES = require('./link-in-text-block-layer-cases.js');

function page(head, body) {
  return `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`;
}

test(`${RULE_ID}: cascade layers under jsdom give Chromium's answer`, () => {
  for (const [label, head, body, expected] of CASES) {
    const r = runa11yCoreOnHtml(page(head, body), { runOnly: [RULE_ID] });
    assert.equal(r.checksResults.find((c) => c.ruleId === RULE_ID).outcome, expected, label);
  }
  // A var() is still not read.
  const r = runa11yCoreOnHtml(
    page(
      '<style>@layer a{.u{text-decoration:none}} @layer b{.u{--d:underline;text-decoration:var(--d)}}</style>',
      '<p style="color:#000">Read the <a href="/" style="color:#000;text-decoration:none"><span class="u">guide</span></a> before you start the work today.</p>'
    ),
    { runOnly: [RULE_ID] }
  );
  assert.equal(r.checksResults.find((c) => c.ruleId === RULE_ID).outcome, 'cantTell');
});

test(`${RULE_ID}: cascade layers in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const pg = await browser.newPage();
  for (const [label, head, body, expected] of CASES) {
    await pg.setContent(page(head, body));
    await addBundle(pg);
    const outcome = await pg.evaluate(
      (id) =>
        window.a11ycore
          .runa11yCoreInPage(null, null, {}, [id])
          .checksResults.find((c) => c.ruleId === id).outcome,
      RULE_ID
    );
    assert.equal(outcome, expected, label);
  }
});
