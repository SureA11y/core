/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Shared access to the W3C ACT Rules test-case corpus (act-rules.github.io):
 * the rule-mapping manifest, the test-case buckets scraped from each rule page,
 * and a disk-cached fetch.
 *
 * The mismatch check and the implementation report both read it; reading it two
 * ways would leave the report unverifiable by the check.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'act-rule-map.json');
const CACHE_DIR = path.join(__dirname, '..', '..', '.act-cache');
const RULE_PAGE = (actId) => `https://act-rules.github.io/rules/${actId}/`;

const BUCKETS = ['passed', 'failed', 'inapplicable'];

function loadManifest(actId) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  return actId ? manifest.filter((e) => e.actId === actId) : manifest;
}

function cachePathFor(url) {
  return path.join(CACHE_DIR, `${crypto.createHash('sha1').update(url).digest('hex')}.html`);
}

const RETRY_DELAYS = [500, 1500, 4500];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} for ${url}`);
    err.retryable = res.status === 429 || res.status >= 500;
    throw err;
  }
  return res.text();
}

/**
 * A few hundred fetches from a third-party site per run, so a previous run's
 * copy is the default. A pre-submission run wants `--no-cache`.
 *
 * The site answers a few of those with a 503, and one unfetched case is enough
 * to make the whole report incomplete, so a transient status is retried.
 */
async function fetchText(url, { cache = true } = {}) {
  const cached = cachePathFor(url);
  if (cache && fs.existsSync(cached)) return fs.readFileSync(cached, 'utf8');

  let lastError;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    if (attempt) await delay(RETRY_DELAYS[attempt - 1]);
    try {
      const text = await fetchOnce(url);
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cached, text);
      return text;
    } catch (err) {
      lastError = err;
      if (err.retryable === false) break;
    }
  }
  throw lastError;
}

/**
 * Parses a rule page for its Passed/Failed/Inapplicable test-case links,
 * bucketed by the nearest preceding `id="passed|failed|inapplicable"` section
 * anchor in document order.
 */
function parseTestCaseBuckets(html, actId) {
  const markerRe = /id="(passed|failed|inapplicable)"/g;
  const markers = [];
  let m;
  while ((m = markerRe.exec(html))) {
    markers.push({ name: m[1], pos: m.index });
  }
  markers.sort((a, b) => a.pos - b.pos);

  const linkRe = new RegExp(`testcases/${actId}/[a-f0-9]+\\.html`, 'g');
  const buckets = { passed: [], failed: [], inapplicable: [] };
  const seen = new Set();
  let lm;
  while ((lm = linkRe.exec(html))) {
    const url = lm[0];
    if (seen.has(url)) continue;
    let bucket = null;
    for (const marker of markers) {
      if (marker.pos <= lm.index) bucket = marker.name;
      else break;
    }
    if (bucket) {
      buckets[bucket].push(`https://act-rules.github.io/${url}`);
      seen.add(url);
    }
  }
  return buckets;
}

async function fetchBuckets(actId, options) {
  return parseTestCaseBuckets(await fetchText(RULE_PAGE(actId), options), actId);
}

/**
 * Bounded concurrency. Results keep input order, so output does not depend on
 * which fetch finishes first.
 */
async function mapPool(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let i = next++; i < items.length; i = next++) {
      results[i] = await task(items[i], i);
    }
  });

  await Promise.all(workers);
  return results;
}

module.exports = {
  BUCKETS,
  CACHE_DIR,
  MANIFEST_PATH,
  RULE_PAGE,
  fetchBuckets,
  fetchText,
  loadManifest,
  mapPool,
  parseTestCaseBuckets
};
