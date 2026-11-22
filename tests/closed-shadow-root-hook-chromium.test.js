'use strict';

// docs/LIMITATIONS.md: the engine can't see inside a closed shadow root, so
// radio buttons slotted into a <fieldset> there are still asked about by
// form-group-name-present. A host that wraps attachShadow before the page's
// scripts run, to create every root open, makes such a root readable; a
// declarative shadowrootmode="closed" root stays closed (round 11, D8).

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('./helpers/chromium');
const { addBundle } = require('./helpers/browserBundle');

const RULE_ID = 'form-group-name-present';
const R2 =
  '<label><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label>';
const SHADOW = '<fieldset><legend>Size</legend><slot></slot></fieldset>';
const IMPERATIVE = `<x-g id="h">${R2}</x-g><script>document.getElementById('h').attachShadow({ mode: 'closed' }).innerHTML = '${SHADOW}';</script>`;
const DECLARATIVE = `<x-g id="h"><template shadowrootmode="closed">${SHADOW}</template>${R2}</x-g>`;

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// The hook a host would run before the page's scripts.
function openEveryRoot() {
  const attach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    return attach.call(this, Object.assign({}, init, { mode: 'open' }));
  };
}

test(
  'a closed shadow root is not read unless a host hooks attachShadow first',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    for (const [label, body, hook, want] of [
      ['closed root, no hook', IMPERATIVE, false, 'cantTell'],
      ['closed root, hook', IMPERATIVE, true, 'pass'],
      ['declarative closed root, hook', DECLARATIVE, true, 'cantTell']
    ]) {
      const pg = await browser.newPage();
      if (hook) await pg.addInitScript(openEveryRoot);
      await pg.route('http://closed-root.test/', (r) =>
        r.fulfill({ contentType: 'text/html', body: page(body) })
      );
      await pg.goto('http://closed-root.test/');
      await addBundle(pg);
      const outcome = await pg.evaluate(
        (ruleId) =>
          window.a11ycore
            .runa11yCoreInPage(null, null, {}, [ruleId])
            .checksResults.find((c) => c.ruleId === ruleId).outcome,
        RULE_ID
      );
      assert.equal(outcome, want, label);
      await pg.close();
    }
  }
);
