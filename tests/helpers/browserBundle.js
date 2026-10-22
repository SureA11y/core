'use strict';

// surea11y.browser.js, added to a Playwright page or frame from a URL this
// process serves. Chromium keeps the code it compiles for a script it loaded
// from a URL, so in one browser every page after the first skips most of
// compiling the 1.2 MB bundle; added as inline content, each page compiled it
// again, about 240 ms of every scan in the Chromium tests.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const BUNDLE_PATH = path.join(__dirname, '../../surea11y.browser.js');

let served = null;

// The bundle's URL, on a server started on first use. The server and its
// connections don't keep the test process alive.
function bundleUrl() {
  if (!served) {
    served = new Promise((resolve, reject) => {
      const body = fs.readFileSync(BUNDLE_PATH);
      const server = http.createServer((req, res) => {
        res.writeHead(200, {
          'content-type': 'text/javascript; charset=utf-8',
          'cache-control': 'max-age=31536000, immutable'
        });
        res.end(body);
      });
      server.on('connection', (socket) => socket.unref());
      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.unref();
        resolve(`http://127.0.0.1:${server.address().port}/surea11y.browser.js`);
      });
    });
  }
  return served;
}

// Adds the bundle to a page or frame, as addScriptTag({ content }) did. A page
// a test serves at a public origin (https://example.test/) may not load a
// script from 127.0.0.1, which Chromium keeps from public pages, so it gets
// the bundle inline, compiled each time as before.
async function addBundle(target) {
  if (/^https?:\/\/(?!127\.0\.0\.1[:/])/.test(target.url())) {
    return target.addScriptTag({ content: fs.readFileSync(BUNDLE_PATH, 'utf8') });
  }
  return target.addScriptTag({ url: await bundleUrl() });
}

module.exports = { addBundle, bundleUrl };
