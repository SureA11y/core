'use strict';

// A page a test runner shows in a frame of its own (Cypress runs the app
// under test so) is still the page under test: the whole-page rules judge it.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}
const { addBundle } = require('../helpers/browserBundle');

const APP =
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head>' +
  '<body><div><p>No title, no lang, no main.</p></div></body></html>';
const RUNNER =
  '<!doctype html><html lang="en"><head><title>Runner</title></head><body><main>' +
  '<iframe class="aut-iframe" src="/app"></iframe></main></body></html>';
const RULES = [
  'page-title-present',
  'html-lang-attr-present',
  'meta-viewport-zoom-enabled',
  'landmark-one-main'
];

test(
  'the app under test in a runner frame is judged as the page',
  { skip: !chromium },
  async (t) => {
    const server = http
      .createServer((req, res) => {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(req.url === '/app' ? APP : RUNNER);
      })
      .listen(0, '127.0.0.1');
    await new Promise((r) => server.once('listening', r));
    t.after(() => server.close());
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/runner`);
    const app = page.frames().find((f) => f.url().endsWith('/app'));
    await app.waitForLoadState();
    await addBundle(app);
    // engineOptions.topLevelDocument: the binding says this frame is the page.
    const got = await app.evaluate(
      (rules) =>
        Object.fromEntries(
          window.a11ycore
            .runa11yCoreInPage(null, null, { topLevelDocument: true }, rules)
            .checksResults.map((c) => [c.ruleId, c.outcome])
        ),
      RULES
    );
    assert.deepEqual(got, {
      'page-title-present': 'fail',
      'html-lang-attr-present': 'fail',
      'meta-viewport-zoom-enabled': 'fail',
      'landmark-one-main': 'cantTell'
    });
  }
);
