'use strict';

// deprecated-elements-not-used: a <marquee> that stops only while the
// pointer is over it keeps leaning fail, with a message that says so;
// keyboard and touch users cannot hold a pointer over it. A separate
// control that stops it keeps its own lean (round 11, B11-14). Each case
// runs under jsdom and in Chromium.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../../helpers/chromium');
const { addBundle } = require('../../helpers/browserBundle');

const RULE_ID = 'deprecated-elements-not-used';
const HOVER = 'MARQUEE_STOPS_ONLY_ON_HOVER';
const UNKNOWN = 'MARQUEE_PAUSE_MECHANISM_UNKNOWN';

// [label, body, reasonCode, lean]
const CASES = [
  [
    'its own onmouseover calls this.stop()',
    '<marquee onmouseover="this.stop()" onmouseout="this.start()">Sale</marquee>',
    HOVER,
    'fail'
  ],
  [
    'its own onmouseenter calls this.stop()',
    '<marquee onmouseenter="this.stop()">Sale</marquee>',
    HOVER,
    'fail'
  ],
  [
    "a wrapper's onmouseover stops it by id",
    '<div onmouseover="document.getElementById(\'m\').stop()"><marquee id="m">Sale</marquee></div>',
    HOVER,
    'fail'
  ],
  [
    'an inline script stops it on mouseenter only',
    '<marquee id="m">Sale</marquee><script>var m = document.getElementById("m"); m.addEventListener("mouseenter", function () { m.stop(); }); m.addEventListener("mouseleave", function () { m.start(); });</script>',
    HOVER,
    'fail'
  ],
  [
    'a script that also stops it on a key press is another way',
    '<marquee id="m">Sale</marquee><script>var m = document.getElementById("m"); m.addEventListener("mouseenter", function () { m.stop(); }); document.addEventListener("keydown", function () { m.stop(); });</script>',
    UNKNOWN,
    null
  ],
  [
    'a separate Pause button that calls stop()',
    '<marquee id="m" onmouseover="this.stop()">Sale</marquee><button onclick="document.getElementById(\'m\').stop()">Pause</button>',
    UNKNOWN,
    'pass'
  ],
  [
    'a separate unnamed control that calls stop()',
    '<marquee id="m" onmouseover="this.stop()">Sale</marquee><button onclick="document.getElementById(\'m\').stop()">||</button>',
    UNKNOWN,
    null
  ],
  ['no handler at all', '<marquee>Sale</marquee>', UNKNOWN, 'fail'],
  [
    'a hover handler that does not stop it',
    '<marquee onmouseover="this.title = \'x\'">Sale</marquee>',
    UNKNOWN,
    'fail'
  ]
];

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function brief(o) {
  return [o.data.details.reasonCode, o.lean ? o.lean.toward : null];
}

test(`${RULE_ID}: a marquee that stops only on hover leans fail and says why (jsdom)`, () => {
  for (const [label, body, code, lean] of CASES) {
    const r = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }).checksResults.find(
      (c) => c.ruleId === RULE_ID
    );
    assert.equal(r.outcome, 'cantTell', label);
    assert.deepEqual(brief(r.occurrences[0]), [code, lean], label);
    if (code === HOVER) {
      assert.equal(
        r.occurrences[0].i18n.summaryKey,
        'deprecatedElements_summary_cantTell_hoverOnly'
      );
      assert.equal(r.occurrences[0].lean.i18n.whyKey, 'deprecatedElements_lean_why_hoverOnly');
      assert.match(r.occurrences[0].summary, /only while the pointer is over it/);
    }
  }
  // Every locale says so.
  const de = runa11yCoreOnHtml(page(CASES[0][1]), {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'de' }
  }).checksResults.find((c) => c.ruleId === RULE_ID).occurrences[0];
  assert.match(de.summary, /Mauszeiger/);
});

test(
  `${RULE_ID}: a marquee that stops only on hover leans fail and says why (Chromium)`,
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const pg = await browser.newPage();
    for (const [label, body, code, lean] of CASES) {
      await pg.setContent(page(body));
      await addBundle(pg);
      const got = await pg.evaluate((ruleId) => {
        const o = window.a11ycore
          .runa11yCoreInPage(null, null, {}, [ruleId])
          .checksResults.find((c) => c.ruleId === ruleId).occurrences[0];
        return [o.data.details.reasonCode, o.lean ? o.lean.toward : null];
      }, RULE_ID);
      assert.deepEqual(got, [code, lean], label);
    }
  }
);
