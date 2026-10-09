'use strict';
// Shared helpers for the in-browser pack probes: a Chromium page served from a
// route, core's bundle, packScript, and a jsdom scan through the Node API.
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..');
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const { JSDOM } = require(path.join(ROOT, 'node_modules/jsdom'));
const main = require(path.join(ROOT, 'src/index.js'));
const packApi = require(path.join(ROOT, 'src/pack.js'));
const BUNDLE = fs.readFileSync(path.join(ROOT, 'surea11y.browser.js'), 'utf8');

const PAGE =
  '<!doctype html><html><head><title>t</title></head><body><main>' +
  '<img src="a.png"><a href="/x">click here</a>' +
  '<p style="color:#767676;background:#fff">Grey text</p></main></body></html>';

const TS = '2026-10-09T00:00:00.000Z';

async function withBrowser(fn) {
  const browser = await chromium.launch();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

// A page at https://example.test/ with `html` and optional headers; extra
// routes: { url: { body, headers, contentType } }.
async function openPage(browser, { html = PAGE, headers = {}, routes = {}, bypassCSP = false } = {}) {
  const context = await browser.newContext({ bypassCSP });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const r = routes[url];
    if (r) return route.fulfill({ contentType: r.contentType || 'text/html', headers: r.headers || {}, body: r.body });
    if (url === 'https://example.test/') return route.fulfill({ contentType: 'text/html', headers, body: html });
    return route.fulfill({ status: 200, contentType: 'image/png', body: '' });
  });
  await page.goto('https://example.test/');
  return { page, context, logs };
}

const scanInPage = (target, packs, extra = {}, runOnly = null) =>
  target.evaluate(
    ([packs, extra, ts, runOnly]) => window.a11ycore.runa11yCoreInPage(null, null, { timestamp: ts, ...(packs ? { packs } : {}), ...extra }, runOnly),
    [packs, extra, TS, runOnly]
  );

function scanNode(engineOptions, { html = PAGE, runOnly, fn = 'runDomRulesInPage' } = {}) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return main[fn]('https://example.test/', null, { timestamp: TS, ...engineOptions }, runOnly);
  } finally {
    dom.window.close();
    delete global.window;
    delete global.document;
  }
}

function quiet(fn) {
  const w = console.warn;
  const out = [];
  console.warn = (...a) => out.push(a.join(' '));
  try {
    return { r: fn(), warnings: out };
  } catch (e) {
    return { error: e, warnings: out };
  } finally {
    console.warn = w;
  }
}

const pack = (over = {}) => packApi.definePack({ name: 'p', version: '1.0.0', namespace: 'p', core: '*', ...over });
const rule = (id, runInPage, meta = {}) => ({ id, meta: { title: id, tags: [], ...meta }, runInPage });
const outcome = (res, id) => {
  const c = res && (res.checksResults || []).find((x) => x.ruleId === id);
  return c ? c.outcome : undefined;
};
const log = (name, v) => {
  let text;
  try { text = typeof v === 'string' ? v : JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? `${x}n` : x), 1); } catch (e) { text = require('util').inspect(v, { depth: 6 }); }
  console.log(`--- ${name}\n` + text);
};

module.exports = { ROOT, chromium, JSDOM, main, packApi, BUNDLE, PAGE, TS, withBrowser, openPage, scanInPage, scanNode, quiet, pack, rule, outcome, log };
