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

// runa11yCoreAcrossFrames/a11yCoreEnableFrameResponder aren't extractable
// alone via .toString() the way runa11yCoreInPage is -- they're
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
  assert.ok(
    start >= 0 && end > start,
    'expected to find the cross-frame IIFE chunk in generated core.js'
  );
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

test(
  'runa11yCoreAcrossFrames / a11yCoreEnableFrameResponder (real browser, real cross-origin)',
  { skip: !chromium ? 'playwright not installed' : false },
  async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());

    await t.test('no iframes: topFrame is a normal result, frames is empty', async () => {
      const page = await browser.newPage();
      await page.setContent('<!doctype html><html><body><img src="x.png"></body></html>');
      await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

      const result = await page.evaluate(() =>
        window.runa11yCoreAcrossFrames(null, null, {}, null)
      );

      assert.ok(Array.isArray(result.topFrame.checksResults));
      assert.ok(result.topFrame.checksResults.length > 100);
      assert.deepStrictEqual(result.frames, []);

      await page.close();
    });

    await t.test(
      'a child frame with no responder enabled is reported as { url, error }, not fatal',
      async () => {
        const page = await browser.newPage();
        await page.setContent(
          '<!doctype html><html><body><iframe srcdoc="<html><body></body></html>"></iframe></body></html>'
        );
        await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

        const result = await page.evaluate(() =>
          window.runa11yCoreAcrossFrames(null, null, { pingWaitTime: 150 }, null)
        );

        assert.strictEqual(result.frames.length, 1);
        assert.strictEqual(typeof result.frames[0].error, 'string');
        assert.ok(!result.frames[0].topFrame);
        // the rest of the scan (topFrame) still completed normally
        assert.ok(result.topFrame.checksResults.length > 100);

        await page.close();
      }
    );

    await t.test(
      'a same-document srcdoc child with the responder enabled replies with its own full result',
      async () => {
        const page = await browser.newPage();
        await page.setContent(
          '<!doctype html><html><body><iframe srcdoc="<html><body><img></body></html>"></iframe></body></html>'
        );
        await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

        const frame = page.frames()[1];
        await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await frame.evaluate(() => {
          window.a11yCoreEnableFrameResponder();
        });

        const result = await page.evaluate(() =>
          window.runa11yCoreAcrossFrames(null, null, {}, null)
        );

        assert.strictEqual(result.frames.length, 1);
        assert.strictEqual(result.frames[0].error, undefined);
        assert.ok(Array.isArray(result.frames[0].topFrame.checksResults));
        const altRule = result.frames[0].topFrame.checksResults.find(
          (r) => r.ruleId === 'img-alt-present'
        );
        assert.strictEqual(altRule.outcome, 'fail'); // the child's own <img> with no alt, found and reported correctly
        assert.deepStrictEqual(result.frames[0].frames, []); // no further nesting

        await page.close();
      }
    );

    await t.test(
      'a truly cross-origin child (different local origin) with the responder enabled is reachable too',
      async () => {
        const childServer = await serve(
          '<!doctype html><html><body><button></button></body></html>'
        );
        t.after(() => closeServer(childServer));
        const parentServer = await serve(
          () =>
            `<!doctype html><html><body><iframe src="${serverUrl(childServer)}"></iframe></body></html>`
        );
        t.after(() => closeServer(parentServer));

        const page = await browser.newPage();
        await page.goto(serverUrl(parentServer));

        const frame = page.frames()[1];
        assert.notStrictEqual(frame.url(), page.url()); // actually a different origin, not just a different path
        await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await frame.evaluate(() => {
          window.a11yCoreEnableFrameResponder();
        });

        await page.addScriptTag({ content: CROSS_FRAME_CHUNK });
        const result = await page.evaluate(() =>
          window.runa11yCoreAcrossFrames(null, null, {}, null)
        );

        assert.strictEqual(result.frames.length, 1);
        assert.strictEqual(result.frames[0].error, undefined);
        assert.strictEqual(result.frames[0].url, serverUrl(childServer));
        const buttonRule = result.frames[0].topFrame.checksResults.find(
          (r) => r.ruleId === 'button-name-present'
        );
        assert.strictEqual(buttonRule.outcome, 'fail'); // the child's own empty <button>, found and reported correctly

        await page.close();
      }
    );

    await t.test(
      'nested frames: a grandchild is reachable through its own parent, producing a tree not a flat list',
      async () => {
        const page = await browser.newPage();
        await page.setContent(`<!doctype html><html><body>
      <iframe srcdoc="<html><body><iframe srcdoc='<html><body><img></body></html>'></iframe></body></html>"></iframe>
    </body></html>`);
        await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

        const childFrame = page.frames()[1];
        const grandchildFrame = page.frames()[2];
        await grandchildFrame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await grandchildFrame.evaluate(() => {
          window.a11yCoreEnableFrameResponder();
        });
        await childFrame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await childFrame.evaluate(() => {
          window.a11yCoreEnableFrameResponder();
        });

        const result = await page.evaluate(() =>
          window.runa11yCoreAcrossFrames(null, null, {}, null)
        );

        assert.strictEqual(result.frames.length, 1);
        const child = result.frames[0];
        assert.strictEqual(child.error, undefined);
        assert.strictEqual(child.frames.length, 1);
        const grandchild = child.frames[0];
        assert.strictEqual(grandchild.error, undefined);
        const altRule = grandchild.topFrame.checksResults.find(
          (r) => r.ruleId === 'img-alt-present'
        );
        assert.strictEqual(altRule.outcome, 'fail'); // the grandchild's own <img>, reached two levels deep

        await page.close();
      }
    );

    await t.test(
      'a customRules entry (string-sourced) flows correctly through a cross-frame scan',
      async () => {
        const page = await browser.newPage();
        await page.setContent(
          '<!doctype html><html><body><iframe srcdoc="<html><body><div id=\'target\'></div></body></html>"></iframe></body></html>'
        );
        await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

        const frame = page.frames()[1];
        await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await frame.evaluate(() => {
          window.a11yCoreEnableFrameResponder();
        });

        const runInPageSrc = function (ctx) {
          const el = ctx.document.getElementById('target');
          return el
            ? { outcome: 'fail', occurrences: [{ __node: el }] }
            : { outcome: 'notApplicable', occurrences: [] };
        }.toString();

        const result = await page.evaluate(
          ({ src }) => {
            return window.runa11yCoreAcrossFrames(
              null,
              null,
              {
                customRules: [{ id: 'my-custom-rule', meta: { title: 'Custom' }, runInPage: src }]
              },
              null
            );
          },
          { src: runInPageSrc }
        );

        const childCustomRule = result.frames[0].topFrame.checksResults.find(
          (r) => r.ruleId === 'my-custom-rule'
        );
        assert.ok(childCustomRule, 'the custom rule ran inside the child frame too');
        assert.strictEqual(childCustomRule.outcome, 'fail');

        await page.close();
      }
    );

    // engineOptions is forwarded to every child frame, so a locale has to
    // reach them as well -- otherwise a cross-frame scan would answer in two
    // languages at once.
    async function scanWithResponder(engineOptions) {
      const page = await browser.newPage();
      await page.setContent(
        '<!doctype html><html><body><div role="generic">x</div>' +
          '<iframe srcdoc="<html><body><div role=\'generic\'>y</div></body></html>"></iframe>' +
          '</body></html>'
      );
      await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

      for (const frame of page.frames().slice(1)) {
        await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await frame.evaluate(() => {
          window.a11yCoreEnableFrameResponder();
        });
      }

      const result = await page.evaluate(
        (options) => window.runa11yCoreAcrossFrames(null, null, options, null),
        { pingWaitTime: 800, frameWaitTime: 8000, ...engineOptions }
      );

      await page.close();
      return result;
    }

    function deprecatedRoleHint(frameResult) {
      const rule = frameResult.checksResults.find((r) => r.ruleId === 'aria-deprecated-role');
      return rule && rule.occurrences[0] ? rule.occurrences[0].hint : null;
    }

    await t.test('a locale reaches child frames, not just the top one', async () => {
      const result = await scanWithResponder({ locale: 'de' });

      assert.strictEqual(result.frames.length, 1);
      assert.ok(!result.frames[0].error, 'child frame answered');

      for (const frameResult of [result.topFrame, result.frames[0].topFrame]) {
        assert.deepStrictEqual(frameResult.engine.locale, {
          requested: 'de',
          resolved: 'de',
          reason: 'ok'
        });
        assert.match(deprecatedRoleHint(frameResult), /^Entfernen Sie/);
      }
    });

    // Every ping and run registers a pending entry keyed by request id. A path
    // that settles without removing its entry leaks quietly and only shows up
    // in a long-lived page, so this drives the timeout path too.
    await t.test('the RPC registry is empty again after repeated scans', async () => {
      const page = await browser.newPage();
      await page.setContent(
        '<!doctype html><html><body><img src="a.png">' +
          '<iframe srcdoc="<html><body><img src=b.png></body></html>"></iframe>' +
          '<iframe srcdoc="<html><body></body></html>"></iframe>' +
          '</body></html>'
      );
      await page.addScriptTag({ content: CROSS_FRAME_CHUNK });

      const responder = page.frames()[1];
      await responder.addScriptTag({ content: CROSS_FRAME_CHUNK });
      await responder.evaluate(() => {
        window.a11yCoreEnableFrameResponder();
      });

      for (let i = 0; i < 3; i += 1) {
        const result = await page.evaluate(() =>
          window.runa11yCoreAcrossFrames(
            null,
            null,
            { pingWaitTime: 200, frameWaitTime: 3000 },
            null
          )
        );
        assert.strictEqual(result.frames.length, 2);
        assert.strictEqual(
          result.frames.filter((f) => f.error).length,
          1,
          'the frame with no responder times out every run'
        );
      }

      const pending = await page.evaluate(() => {
        const registry = window.__a11yCoreFrameRpc__;
        return registry && registry.pending ? registry.pending.size : -1;
      });
      assert.strictEqual(pending, 0, 'no pending RPC entry survives a settled scan');

      await page.close();
    });

    await t.test('a caller-supplied dictionary survives the hop to a child frame', async () => {
      const result = await scanWithResponder({
        locale: 'xx',
        messages: { xx: { ariaDeprecatedRole_guidance_generic: 'SUPPLIED-XX' } }
      });

      assert.ok(!result.frames[0].error, 'child frame answered');

      for (const frameResult of [result.topFrame, result.frames[0].topFrame]) {
        assert.strictEqual(frameResult.engine.locale.resolved, 'xx');
        assert.strictEqual(deprecatedRoleHint(frameResult), 'SUPPLIED-XX');
      }
    });
  }
);
