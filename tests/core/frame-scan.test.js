'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  chromium = null;
}

// runa11yCoreAcrossFrames/a11yCoreEnableFrameResponder are deliberately NOT
// extractable alone via .toString() the way runa11yCoreInPage is -- they're
// wrapped in their own self-contained IIFE (crossFrameRunnerSource in
// scripts/build-core.js) together with a private copy of everything they
// need, so they stay usable the same bundler-free way runa11yCoreInPage
// already is (raw source injected into a page, no build step). Extract that
// whole IIFE chunk out of the generated core.js by its marker comment,
// exactly the shape a real "plain script injection" consumer would load.
function loadCrossFrameChunk() {
  const src = fs.readFileSync(path.join(__dirname, '../../src/core.js'), 'utf8');
  const startMarker = '// SELF-CONTAINED cross-frame scanning';
  const endMarker = 'module.exports = {';
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'expected to find the cross-frame IIFE chunk in generated core.js');
  return src.slice(start, end);
}

const CROSS_FRAME_CHUNK = loadCrossFrameChunk();

function serve(html) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader('content-type', 'text/html');
      res.end(typeof html === 'function' ? html(req) : html);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function serverUrl(server) {
  return `http://127.0.0.1:${server.address().port}/`;
}

test('runa11yCoreAcrossFrames / a11yCoreEnableFrameResponder (real browser, real cross-origin)', { skip: !chromium ? 'playwright not installed' : false }, async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());

  await t.test('no iframes: topFrame is a normal result, frames is empty', async () => {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><img src="x.png"></body></html>');
    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

    const result = await page.evaluate(() => window.runa11yCoreAcrossFrames(null, null, {}, null));

    assert.ok(Array.isArray(result.topFrame.checksResults));
    assert.ok(result.topFrame.checksResults.length > 100);
    assert.deepStrictEqual(result.frames, []);

    await page.close();
  });

  await t.test('a child frame with no responder enabled is reported as { url, error }, not fatal', async () => {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><iframe srcdoc="<html><body></body></html>"></iframe></body></html>');
    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

    const result = await page.evaluate(() => window.runa11yCoreAcrossFrames(null, null, { pingWaitTime: 150 }, null));

    assert.strictEqual(result.frames.length, 1);
    assert.strictEqual(typeof result.frames[0].error, 'string');
    assert.ok(!result.frames[0].topFrame);
    // the rest of the scan (topFrame) still completed normally
    assert.ok(result.topFrame.checksResults.length > 100);

    await page.close();
  });

  await t.test('a same-document srcdoc child with the responder enabled replies with its own full result', async () => {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><iframe srcdoc="<html><body><img></body></html>"></iframe></body></html>');
    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

    const frame = page.frames()[1];
    await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    await frame.evaluate(() => { window.a11yCoreEnableFrameResponder(); });

    const result = await page.evaluate(() => window.runa11yCoreAcrossFrames(null, null, {}, null));

    assert.strictEqual(result.frames.length, 1);
    assert.strictEqual(result.frames[0].error, undefined);
    assert.ok(Array.isArray(result.frames[0].topFrame.checksResults));
    const altRule = result.frames[0].topFrame.checksResults.find((r) => r.ruleId === 'a11ycore-img-alt-present');
    assert.strictEqual(altRule.outcome, 'fail'); // the child's own <img> with no alt, found and reported correctly
    assert.deepStrictEqual(result.frames[0].frames, []); // no further nesting

    await page.close();
  });

  await t.test('a genuinely cross-origin child (different local origin) with the responder enabled is reachable too', async () => {
    const childServer = await serve('<!doctype html><html><body><button></button></body></html>');
    t.after(() => closeServer(childServer));
    const parentServer = await serve(() => `<!doctype html><html><body><iframe src="${serverUrl(childServer)}"></iframe></body></html>`);
    t.after(() => closeServer(parentServer));

    const page = await browser.newPage();
    await page.goto(serverUrl(parentServer));

    const frame = page.frames()[1];
    assert.notStrictEqual(frame.url(), page.url()); // genuinely a different origin, not just a different path
    await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    await frame.evaluate(() => { window.a11yCoreEnableFrameResponder(); });

    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });
    const result = await page.evaluate(() => window.runa11yCoreAcrossFrames(null, null, {}, null));

    assert.strictEqual(result.frames.length, 1);
    assert.strictEqual(result.frames[0].error, undefined);
    assert.strictEqual(result.frames[0].url, serverUrl(childServer));
    const buttonRule = result.frames[0].topFrame.checksResults.find((r) => r.ruleId === 'a11ycore-button-name-present');
    assert.strictEqual(buttonRule.outcome, 'fail'); // the child's own empty <button>, found and reported correctly

    await page.close();
  });

  await t.test('nested frames: a grandchild is reachable through its own parent, producing a tree not a flat list', async () => {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><body>
      <iframe srcdoc="<html><body><iframe srcdoc='<html><body><img></body></html>'></iframe></body></html>"></iframe>
    </body></html>`);
    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

    const childFrame = page.frames()[1];
    const grandchildFrame = page.frames()[2];
    await grandchildFrame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    await grandchildFrame.evaluate(() => { window.a11yCoreEnableFrameResponder(); });
    await childFrame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    await childFrame.evaluate(() => { window.a11yCoreEnableFrameResponder(); });

    const result = await page.evaluate(() => window.runa11yCoreAcrossFrames(null, null, {}, null));

    assert.strictEqual(result.frames.length, 1);
    const child = result.frames[0];
    assert.strictEqual(child.error, undefined);
    assert.strictEqual(child.frames.length, 1);
    const grandchild = child.frames[0];
    assert.strictEqual(grandchild.error, undefined);
    const altRule = grandchild.topFrame.checksResults.find((r) => r.ruleId === 'a11ycore-img-alt-present');
    assert.strictEqual(altRule.outcome, 'fail'); // the grandchild's own <img>, reached two levels deep

    await page.close();
  });

  await t.test('a customRules entry (string-sourced) flows correctly through a cross-frame scan', async () => {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><iframe srcdoc="<html><body><div id=\'target\'></div></body></html>"></iframe></body></html>');
    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

    const frame = page.frames()[1];
    await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
    await frame.evaluate(() => { window.a11yCoreEnableFrameResponder(); });

    const runInPageSrc = (function (ctx) {
      const el = ctx.document.getElementById('target');
      return el ? { outcome: 'fail', occurrences: [{ __node: el }] } : { outcome: 'notApplicable', occurrences: [] };
    }).toString();

    const result = await page.evaluate(({ src }) => {
      return window.runa11yCoreAcrossFrames(null, null, {
        customRules: [{ id: 'my-custom-rule', meta: { title: 'Custom' }, runInPage: src }]
      }, null);
    }, { src: runInPageSrc });

    const childCustomRule = result.frames[0].topFrame.checksResults.find((r) => r.ruleId === 'my-custom-rule');
    assert.ok(childCustomRule, 'the custom rule ran inside the child frame too');
    assert.strictEqual(childCustomRule.outcome, 'fail');

    await page.close();
  });
});
