'use strict';

// link-in-text-block in Chromium (#166): a "|" or "·" between links is no
// text for them to sit in, so a row of links is not judged as links in a
// block of text; a link in a sentence still is.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');
const STYLE = '<style>a{color:#333;text-decoration:none} p{color:#222}</style>';

test('link-in-text-block: separators are no surrounding text, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const outcome = async (body) => {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title>${STYLE}</head><body><main>${body}</main></body></html>`
    );
    await page.addScriptTag({ content: BUNDLE });
    return page.evaluate(
      () =>
        window.a11ycore.runa11yCoreInPage(null, null, null, ['link-in-text-block']).checksResults[0]
          .outcome
    );
  };
  assert.equal(
    await outcome('<p><a href="/p">Privacy</a> | <a href="/t">Terms</a></p>'),
    'notApplicable'
  );
  assert.equal(
    await outcome('<p><a href="/a">Alpha</a> · <a href="/b">Beta</a> / <a href="/c">Gamma</a></p>'),
    'notApplicable'
  );
  assert.notEqual(
    await outcome('<p>Read our <a href="/p">privacy policy</a> first.</p>'),
    'notApplicable'
  );
  // A sentence split into spans is text around the link; a flex row's
  // items and a screen-reader-only label are not.
  assert.notEqual(
    await outcome('<p><span>Please read our</span> <a href="/t">terms</a> <span>first</span></p>'),
    'notApplicable'
  );
  assert.equal(
    await outcome('<div style="display:flex"><span>Follow us</span><a href="/a">Twitter</a></div>'),
    'notApplicable'
  );
  assert.equal(
    await outcome(
      '<p><a href="/a">Read more</a><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">about cats</span></p>'
    ),
    'notApplicable'
  );
});
