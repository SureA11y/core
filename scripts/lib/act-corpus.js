/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Shared access to the ACT Rules test-case corpus: the rule-mapping manifest,
 * the test cases of each rule, and a disk-cached fetch.
 *
 * Two corpora are published. W3C's (the ACT Task Force's, under
 * w3.org/WAI/standards-guidelines/act/rules/) holds the rules W3C has approved,
 * and is the one W3C's implementation listing scores reports against, so it is
 * the default. The ACT Rules Community Group's (act-rules.github.io) holds its
 * drafts as well, and keeps rules W3C has since deprecated; `--source=cg`
 * reads it. Both list their test cases in a `testcases.json`, which is read
 * instead of the rule pages, so a change to how a page is laid out cannot drop
 * a case silently.
 *
 * The mismatch check and the implementation report both read it; reading it two
 * ways would leave the report unverifiable by the check.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'act-rule-map.json');
const CACHE_DIR = path.join(__dirname, '..', '..', '.act-cache');

const SOURCES = {
  w3c: {
    name: 'W3C ACT Task Force',
    site: 'https://www.w3.org/WAI/standards-guidelines/act/rules/',
    testcases: 'https://www.w3.org/WAI/content-assets/wcag-act-rules/testcases.json'
  },
  cg: {
    name: 'ACT Rules Community Group',
    site: 'https://act-rules.github.io/',
    testcases: 'https://act-rules.github.io/testcases.json'
  }
};
const DEFAULT_SOURCE = 'w3c';

const BUCKETS = ['passed', 'failed', 'inapplicable'];

/**
 * Some test cases are not HTML: an SVG or MathML document, whose root is not
 * an `html` element, is how ACT tests that a page-level rule leaves it alone.
 * Parsed as HTML it would gain an `html` root and become applicable.
 */
const CONTENT_TYPES = {
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.xhtml': 'application/xhtml+xml'
};

function contentTypeFor(url) {
  return CONTENT_TYPES[path.extname(new URL(url).pathname).toLowerCase()] || 'text/html';
}

/**
 * Engine options for the ACT rules whose criteria a default run leaves out.
 * 3ea0c8 maps to 4.1.1 Parsing, which WCAG 2.2 removed, so under the default
 * 2.2 target duplicate-id names no criterion and reports cantTell. ACT's
 * rule is a WCAG 2.0/2.1 rule, so it runs under 2.1, where 4.1.1 exists.
 */
const ENGINE_OPTIONS_BY_ACT_ID = {
  '3ea0c8': { wcagVersion: '2.1' }
};

/** What a test case of `actId` is scanned with, by the check and the report alike. */
function scanOptionsFor(actId, ourRuleIds, caseUrl) {
  return {
    contentType: contentTypeFor(caseUrl),
    runOnly: { includeRuleIds: ourRuleIds },
    engineOptions: ENGINE_OPTIONS_BY_ACT_ID[actId] || {}
  };
}

function sourceFor(name = DEFAULT_SOURCE) {
  const source = SOURCES[name];
  if (!source) {
    throw new Error(
      `Unknown ACT corpus source "${name}" (one of ${Object.keys(SOURCES).join(', ')})`
    );
  }
  return source;
}

function loadManifest(actId) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  return actId ? manifest.filter((e) => e.actId === actId) : manifest;
}

function cachePathFor(url) {
  return path.join(CACHE_DIR, `${crypto.createHash('sha1').update(url).digest('hex')}.html`);
}

const RETRY_DELAYS = [500, 1500, 4500];

/**
 * A 429 is the site asking for fewer requests, not a passing fault, so it
 * waits longer than a 503 does, and as long as the site's Retry-After asks,
 * up to a cap.
 */
const RATE_LIMIT_DELAYS = [5000, 15000, 30000, 60000];
const MAX_RETRY_AFTER_MS = 120000;

/**
 * Past this point in a run no fetch waits to retry: a site still refusing
 * after it is not going to let the rest of the corpus through, and a run
 * that ends reports what it read instead of waiting out every case.
 */
const RETRY_BUDGET_MS = 15 * 60 * 1000;
const retryDeadline = Date.now() + RETRY_BUDGET_MS;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryAfterMs(header) {
  if (!header) return undefined;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
  return Number.isFinite(ms) && ms >= 0 ? Math.min(ms, MAX_RETRY_AFTER_MS) : undefined;
}

/**
 * The response for `url`. A status worth retrying (a 429, a 5xx) is thrown;
 * with `ok: true` (the default) so is any other status that isn't ok.
 */
async function fetchOnce(url, { ok = true } = {}) {
  const res = await fetch(url, { redirect: 'follow' });
  const transient = res.status === 429 || res.status >= 500;
  if (transient || (ok && !res.ok)) {
    const err = new Error(`${res.status} ${res.statusText} for ${url}`);
    err.rateLimited = res.status === 429;
    err.retryable = transient;
    err.retryAfter = retryAfterMs(res.headers.get('retry-after'));
    throw err;
  }
  return res;
}

/**
 * Runs `attempt` until it succeeds, retrying a transient failure as the site
 * asks: a 429 waits longer than a 503, for as long as Retry-After says, and
 * no retry waits past the run's budget.
 */
async function withRetries(attempt) {
  let lastError;
  for (let tries = 0; ; tries += 1) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
      if (err.retryable === false) break;
      const delays = err.rateLimited ? RATE_LIMIT_DELAYS : RETRY_DELAYS;
      if (tries >= delays.length) break;
      const wait = err.retryAfter ?? delays[tries];
      if (Date.now() + wait > retryDeadline) break;
      await delay(wait);
    }
  }
  throw lastError;
}

/**
 * A few hundred fetches from a third-party site per run, so a previous run's
 * copy is the default. A pre-submission run wants `--no-cache`.
 *
 * The site answers a few of those with a 503, or a 429 when a cold cache
 * asks for the whole corpus at once, and one unfetched case is enough to make
 * the whole report incomplete, so a transient status is retried.
 */
async function fetchText(url, { cache = true } = {}) {
  const cached = cachePathFor(url);
  if (cache && fs.existsSync(cached)) return fs.readFileSync(cached, 'utf8');

  const text = await withRetries(async () => (await fetchOnce(url)).text());
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cached, text);
  return text;
}

/**
 * The source's test cases, grouped by ACT rule id. The list changes as rules
 * gain examples, so the cache honours `--no-cache` like every other fetch.
 */
async function loadCorpus(options = {}) {
  const source = sourceFor(options.source);
  const { testcases } = JSON.parse(await fetchText(source.testcases, options));
  const rules = new Map();
  for (const tc of testcases) {
    if (!rules.has(tc.ruleId)) {
      rules.set(tc.ruleId, {
        actId: tc.ruleId,
        actName: tc.ruleName,
        requirements: tc.ruleAccessibilityRequirements || {},
        deprecated: /^DEPRECATED\b/.test(tc.ruleName),
        buckets: { passed: [], failed: [], inapplicable: [] }
      });
    }
    const bucket = rules.get(tc.ruleId).buckets[tc.expected];
    if (bucket) bucket.push(tc.url);
  }
  return { source, rules };
}

/**
 * Test-case URLs for one ACT rule, by expected outcome. A rule the source does
 * not publish (W3C has not approved it, or has withdrawn it) is an error rather
 * than an empty set, so it cannot pass as a rule with nothing to fail.
 */
async function fetchBuckets(actId, options = {}) {
  const corpus = options.corpus || (await loadCorpus(options));
  const rule = corpus.rules.get(actId);
  if (!rule) throw new Error(`${corpus.source.name} publishes no test cases for ${actId}`);
  return rule.buckets;
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
  DEFAULT_SOURCE,
  MANIFEST_PATH,
  SOURCES,
  contentTypeFor,
  fetchBuckets,
  fetchOnce,
  fetchText,
  loadCorpus,
  loadManifest,
  mapPool,
  scanOptionsFor,
  sourceFor,
  withRetries
};
