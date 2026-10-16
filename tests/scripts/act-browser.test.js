'use strict';

// The Chromium runner of scripts/act-report.js: a page is loaded from its
// URL, through the cache, so its scripts run before the scan.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const { skip } = require('../helpers/chromium.js');
const { openBrowserRunner, cachedResponse } = require('../../scripts/lib/act-browser.js');

const PAGES = {
  '/script.html':
    '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
    '<div id="host"></div><script>' +
    "document.getElementById('host').innerHTML = '<button></button>';" +
    '</script></body></html>',
  '/math.xml': '<math lang="en">x</math>'
};

function serve() {
  const hits = new Map();
  const server = http.createServer((req, res) => {
    hits.set(req.url, (hits.get(req.url) || 0) + 1);
    const body = PAGES[req.url];
    if (!body) {
      res.writeHead(404).end();
      return;
    }
    const type = req.url.endsWith('.xml') ? 'application/xml' : 'text/html';
    res.writeHead(200, { 'content-type': type }).end(body);
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ base: `http://127.0.0.1:${server.address().port}`, server, hits })
    )
  );
}

test('cachedResponse fetches once, then answers from the cache, a 404 included', async () => {
  const { base, server, hits } = await serve();
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'act-cache-'));
  try {
    const first = await cachedResponse(`${base}/script.html`, { cacheDir });
    const again = await cachedResponse(`${base}/script.html`, { cacheDir });
    assert.equal(first.status, 200);
    assert.equal(again.body.toString(), PAGES['/script.html']);
    assert.equal(hits.get('/script.html'), 1);
    assert.equal((await cachedResponse(`${base}/missing`, { cacheDir })).status, 404);
  } finally {
    server.close();
  }
});

test('a page is scanned after its own scripts have run', { skip }, async () => {
  const { base, server } = await serve();
  const runner = await openBrowserRunner({
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'act-cache-'))
  });
  try {
    const result = await runner.scan(`${base}/script.html`, {
      runOnly: { includeRuleIds: ['button-name-present'] },
      engineOptions: {}
    });
    const check = result.checksResults.find((c) => c.ruleId === 'button-name-present');
    assert.equal(check.outcome, 'fail');
    assert.equal(result.url, `${base}/script.html`);
  } finally {
    await runner.close();
    server.close();
  }
});

test(
  "a document Chromium shows through its XML viewer gives null, not the viewer's scan",
  { skip },
  async () => {
    const { base, server } = await serve();
    const runner = await openBrowserRunner({
      cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'act-cache-'))
    });
    try {
      const result = await runner.scan(`${base}/math.xml`, {
        runOnly: { includeRuleIds: ['html-lang-attr-present'] },
        engineOptions: {}
      });
      assert.equal(result, null);
    } finally {
      await runner.close();
      server.close();
    }
  }
);
