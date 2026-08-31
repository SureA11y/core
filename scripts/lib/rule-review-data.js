/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Assemble the per-rule review dataset: each rule's header prose, every message
 * it can emit filed under the outcome it is emitted as, its scenario-fixture
 * cases, and its test names.
 *
 * Every fixture is replayed through the engine so a case carries the verdict
 * the engine really returns, not only the PASS/FAIL/CANTTELL marker its title
 * claims. Nothing asserts those markers, so they drift; the two are reported
 * side by side and disagreements are marked.
 */

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const OUTCOMES = ['fail', 'cantTell', 'pass', 'notApplicable'];

function findRepoRoot(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(startDir);
    dir = parent;
  }
}

function listFilesRecursive(dirAbs, filterFn) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const full = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) out.push(...listFilesRecursive(full, filterFn));
    else if (ent.isFile() && filterFn(ent.name)) out.push(full);
  }
  return out;
}

/* ---------- rule / test / fixture discovery ---------- */

/**
 * Same convention generate-fixture-index.js uses: each rule's test file
 * declares `const RULE_ID = '...'` and reads its fixture by path.
 */
function scanTestFiles(repoRoot, testsDir) {
  const files = listFilesRecursive(path.resolve(repoRoot, testsDir), (n) => n.endsWith('.test.js'));
  const byRuleId = new Map();

  const ruleIdRe = /const\s+RULE_ID\s*=\s*['"]([^'"]+)['"]/;
  const fixtureRefRe = /fixtures['"]\s*,\s*['"]([\w.-]+\.html)['"]/;
  const fixtureRefInlineRe = /fixtures\/([\w.-]+\.html)/;

  for (const file of files) {
    let src;
    try {
      src = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const idMatch = ruleIdRe.exec(src);
    if (!idMatch) continue;

    const fm = fixtureRefRe.exec(src) || fixtureRefInlineRe.exec(src);
    const entry = { testFile: path.relative(repoRoot, file), fixtureFile: fm ? fm[1] : null };
    const prev = byRuleId.get(idMatch[1]);
    if (!prev || (entry.fixtureFile && !prev.fixtureFile)) byRuleId.set(idMatch[1], entry);
  }
  return byRuleId;
}

/** Type comes from each rule's own meta: not every rule file sits under a directory named for its type. */
function listRuleModules(repoRoot, checksDir, types) {
  const dir = path.resolve(repoRoot, checksDir);
  const out = [];
  for (const file of listFilesRecursive(dir, (n) => n.endsWith('.js') && !n.endsWith('.test.js'))) {
    let mod;
    try {
      mod = require(file);
    } catch {
      continue;
    }
    if (!mod || !mod.id || !mod.meta) continue;
    const type = mod.meta.type === 'manual' ? 'manual' : 'automatic';
    if (!types.includes(type)) continue;
    out.push({ id: mod.id, meta: mod.meta, type, file: path.relative(repoRoot, file) });
  }
  return out;
}

/* ---------- rule header prose ---------- */

function reflow(lines) {
  return lines
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function jsdocTag(source, tag) {
  const start = new RegExp(`^[ \\t]*\\*[ \\t]*@${tag}\\b[ \\t]*(.*)$`, 'm').exec(source);
  if (!start) return '';
  const lines = [start[1]];
  for (const line of source
    .slice(start.index + start[0].length)
    .split('\n')
    .slice(1)) {
    if (/^[ \t]*\*[ \t]*@\w/.test(line) || /\*\//.test(line)) break;
    lines.push(line.replace(/^[ \t]*\*[ \t]?/, ''));
  }
  return reflow(lines);
}

function levelFromTags(tags) {
  const t = Array.isArray(tags) ? tags : [];
  if (t.some((x) => /^wcag2\d?aaa$/.test(x))) return 'AAA';
  if (t.some((x) => /^wcag2\d?aa$/.test(x))) return 'AA';
  if (t.some((x) => /^wcag2\d?a$/.test(x))) return 'A';
  return '';
}

/* ---------- which outcome a message is emitted as ---------- */

/** Index every position in a source to the stack of object literals enclosing it. */
function scanOpeners(src) {
  const stackAt = new Array(src.length).fill(null);
  const stack = [];
  let str = null;
  let line = false;
  let block = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (line) {
      if (c === '\n') line = false;
      continue;
    }
    if (block) {
      if (c === '*' && n === '/') {
        block = false;
        i++;
      }
      continue;
    }
    if (str) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === str) str = null;
      stackAt[i] = stack.slice();
      continue;
    }
    if (c === '/' && n === '/') {
      line = true;
      i++;
      continue;
    }
    if (c === '/' && n === '*') {
      block = true;
      i++;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      str = c;
      stackAt[i] = stack.slice();
      continue;
    }
    if (c === '{') stack.push(i);
    stackAt[i] = stack.slice();
    if (c === '}') stack.pop();
  }
  return stackAt;
}

function balanced(src, openIdx) {
  let depth = 0;
  let str = null;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (str) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === str) str = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      str = c;
      continue;
    }
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') {
      depth--;
      if (depth === 0) return src.slice(openIdx, i + 1);
    }
  }
  return src.slice(openIdx);
}

function str1(body, key) {
  const m = new RegExp(`\\b${key}\\s*:\\s*(['"\`])([\\s\\S]*?)\\1`).exec(body);
  return m ? m[2].replace(/\s+/g, ' ').trim() : null;
}

const CONDITIONAL_UNCERTAINTY = /\.\.\.\([\s\S]{0,160}?\?[\s\S]{0,60}?\{\s*uncertainty\s*:/;

/** The occurrence object a key literal sits in: carries both a summary and an i18n block. */
function occurrenceBodyFor(src, stackAt, idx) {
  const stack = stackAt[idx];
  if (!stack || !stack.length) return null;
  for (let i = stack.length - 1; i >= 0; i--) {
    const body = balanced(src, stack[i]);
    if (/\bsummary\s*:/.test(body) && /\bi18n\s*:/.test(body)) return body;
  }
  return null;
}

function keyNameOutcome(key) {
  const k = key.toLowerCase();
  if (/(^|_)canttell($|_)/.test(k)) return 'cantTell';
  if (/(^|_)(notapplicable|inapplicable)($|_)/.test(k)) return 'notApplicable';
  if (/(^|_)fail($|_)/.test(k)) return 'fail';
  if (/(^|_)pass($|_)/.test(k)) return 'pass';
  return null;
}

/**
 * An occurrence carrying an unconditional `uncertainty` block is reported as
 * cantTell whatever its key is named -- several rules emit `_summary_fail`
 * keys that way -- so the source wins over the key name.
 */
function tierForKey(src, stackAt, key) {
  const re = new RegExp(`(['"\`])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
  let best = null;
  let m;
  while ((m = re.exec(src)) !== null) {
    const body = occurrenceBodyFor(src, stackAt, m.index);
    if (!body) continue;
    const hasUncertainty = /\buncertainty\s*:/.test(body);
    const info = {
      hasUncertainty,
      conditional: hasUncertainty && CONDITIONAL_UNCERTAINTY.test(body),
      uncertaintyCode: hasUncertainty ? str1(body, 'code') : null,
      needed: hasUncertainty ? str1(body, 'needed') : null,
      reasonCode: str1(body, 'reasonCode')
    };
    if (!best || (info.hasUncertainty && !best.hasUncertainty)) best = info;
  }

  if (best && best.hasUncertainty && !best.conditional) return { tier: 'cantTell', ...best };
  return { tier: keyNameOutcome(key) || 'fail', ...(best || {}) };
}

function extractRuleOutcomes(src) {
  const set = new Set();
  const re = /outcome\s*:\s*'(fail|pass|cantTell|notApplicable|inapplicable)'/g;
  let m;
  while ((m = re.exec(src)) !== null) set.add(m[1] === 'inapplicable' ? 'notApplicable' : m[1]);
  if (/resolveTieredOutcome/.test(src)) {
    set.add('fail');
    set.add('cantTell');
  }
  return Array.from(set);
}

function messagesFor(messages, prefix, source) {
  const groups = { fail: [], cantTell: [], pass: [], notApplicable: [] };
  if (!prefix) return groups;

  const stackAt = scanOpeners(source);
  for (const key of Object.keys(messages).filter((k) => k.startsWith(prefix + '_'))) {
    const suffix = key.slice(prefix.length + 1);
    if (suffix === 'title' || suffix === 'description') continue;
    if (/(^|_)hint(_|$)/.test(suffix)) continue;
    if (/^guidance(_|$)/.test(suffix)) continue;

    const t = tierForKey(source, stackAt, key);
    const hintKey = [
      key.replace(/_summary(_|$)/, '_hint$1'),
      prefix + '_hint_' + suffix,
      key.replace(/^(.*?)_/, '$1_hint_')
    ].find((c) => messages[c]);

    // A rule can pick key and uncertainty from one shared occurrence object
    // (label-in-name does), so uncertainty metadata only belongs on the
    // messages that are actually reported as cantTell.
    const uncertain = t.tier === 'cantTell';
    groups[t.tier].push({
      key,
      variant: suffix,
      text: messages[key],
      hint: hintKey ? messages[hintKey] : null,
      uncertaintyCode: uncertain ? t.uncertaintyCode || null : null,
      needed: uncertain ? t.needed || null : null,
      reasonCode: t.reasonCode || null
    });
  }
  return groups;
}

/* ---------- fixture cases ---------- */

/** A case title often states its verdict outright at the end ("... => FAIL"). */
function arrowOutcome(title) {
  const m = /(?:=>|->)\s*([A-Za-z ]{2,20})\s*$/.exec(String(title).trim());
  return m ? outcomeFromText(m[1]) : null;
}

function outcomeFromText(raw) {
  const s = String(raw).toLowerCase();
  if (/cant\s*tell|canttell/.test(s)) return 'cantTell';
  if (/^flagged/.test(s.trim())) return 'flagged';
  if (
    /not\s*applicable|notapplicable|inapplicable|ineligible|neutral|out of scope|excluded|not targeted|exception|n\/a/.test(
      s
    )
  )
    return 'notApplicable';
  if (/\bfail/.test(s)) return 'fail';
  if (/\bpass/.test(s)) return 'pass';
  return null;
}

function sectionFor(el) {
  let n = el.previousElementSibling;
  while (n) {
    if (/^h[23]$/i.test(n.tagName)) return n.textContent.replace(/\s+/g, ' ').trim();
    n = n.previousElementSibling;
  }
  return '';
}

const MAX_MARKUP = 1400;

function readFixture(repoRoot, fixtureRel) {
  if (!fixtureRel) return null;
  const abs = path.join(repoRoot, fixtureRel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}

/**
 * A whole-document rule can only demonstrate one outcome per page, so its
 * fixture declares a bare .case-title with no .case wrapper. The page itself
 * is the case, and the marker is compared against the rule-level outcome.
 */
function documentCase(doc, ruleId) {
  const titles = Array.from(doc.querySelectorAll('.case-title')).filter(
    (el) => !el.closest('.case')
  );
  if (titles.length !== 1) return null;

  const title = titles[0].textContent.replace(/\s+/g, ' ').trim();
  const m = /^(\d+[a-z]?)\s*[—–-]+\s*(.*)$/.exec(title);
  const rest = m ? m[2] : title;
  const marker = (/^([A-Za-z][A-Za-z /()_-]*?)\s*:/.exec(rest) || [])[1] || '';
  const perRule = ruleId ? doc.body && doc.body.getAttribute('data-outcome-' + ruleId) : null;

  return {
    id: 'document',
    num: m ? m[1] : '',
    marker: perRule ? perRule.trim() : marker || 'OTHER',
    scope: 'document',
    outcome: perRule
      ? outcomeFromText(perRule) || 'other'
      : arrowOutcome(rest) || outcomeFromText(marker || rest) || 'other',
    label: rest.replace(/^[A-Za-z][A-Za-z /()_-]*?:\s*/, ''),
    notes: Array.from(doc.querySelectorAll('.note'))
      .map((n) => n.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean),
    markup: '',
    section: ''
  };
}

function fixtureCases(doc, ruleId) {
  if (!doc) return [];
  const out = [];

  for (const el of doc.querySelectorAll('.case')) {
    const titleEl = el.querySelector('.case-title');
    if (!titleEl) continue;

    const title = titleEl.textContent.replace(/\s+/g, ' ').trim();
    const m = /^(\d+[a-z]?)\s*[—–-]+\s*(.*)$/.exec(title);
    const rest = m ? m[2] : title;
    const marker = (/^([A-Za-z][A-Za-z /()_-]*?)\s*:/.exec(rest) || [])[1] || '';

    const clone = el.cloneNode(true);
    for (const drop of clone.querySelectorAll('.case-title, .meta, .note')) drop.remove();
    let markup = clone.innerHTML.replace(/\n\s*\n/g, '\n').trim();
    // fixtures inline the same long data: URL in every image; the tail carries nothing
    markup = markup.replace(/(src="data:[^"]{60})[^"]*"/g, '$1…"');

    // One fixture can serve several rules that expect different things of the
    // same case -- the contrast trio does -- so a per-rule marker overrides the
    // shared title.
    const perRule = ruleId ? el.getAttribute('data-outcome-' + ruleId) : null;

    out.push({
      id: el.id || null,
      num: m ? m[1] : '',
      marker: perRule ? perRule.trim() : marker || 'OTHER',
      outcome: perRule
        ? outcomeFromText(perRule) || 'other'
        : arrowOutcome(rest) || outcomeFromText(marker || rest) || 'other',
      label: rest.replace(/^[A-Za-z][A-Za-z /()_-]*?:\s*/, ''),
      notes: Array.from(el.querySelectorAll('.meta, .note'))
        .map((n) => n.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean),
      scope: 'element',
      markup: markup.length > MAX_MARKUP ? markup.slice(0, MAX_MARKUP) + '\n…' : markup,
      section: sectionFor(el)
    });
  }

  if (!out.length) {
    const page = documentCase(doc, ruleId);
    if (page) out.push(page);
  }
  return out;
}

/* ---------- test names ---------- */

function testCases(repoRoot, testRel) {
  if (!testRel) return [];
  const abs = path.join(repoRoot, testRel);
  if (!fs.existsSync(abs)) return [];

  const src = fs.readFileSync(abs, 'utf8');
  const re = /^\s*(?:await\s+)?(?:test|it)\(\s*(`|'|")([\s\S]*?)\1\s*,/gm;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const name = m[2]
      .replace(/\$\{RULE_ID\}/g, '')
      .replace(/\$\{[^}]*\}/g, '')
      .trim()
      .replace(/^[:\s-]+/, '')
      .replace(/\s+/g, ' ');
    if (!name) continue;
    if (/fixture coverage|determinism|serializ|snapshot/i.test(name)) continue;
    out.push({ name, outcome: outcomeFromText(name) || 'other' });
  }
  return out;
}

/* ---------- engine replay ---------- */

/**
 * Rules whose fixture needs an environment jsdom does not provide on its own.
 * target-size-minimum measures geometry and hit-tests with elementFromPoint,
 * which its fixture supplies through data-rect attributes; replayed without
 * that patch the rule finds no candidates and reports notApplicable.
 */
const ENV_PATCHES = {
  'target-size-minimum': require(
    path.join(findRepoRoot(__dirname), 'tests/helpers/patchTargetSizeEnv')
  ).patchTargetSizeEnv
};

function replayFixture(run, ruleId, html, doc) {
  if (!html) return null;

  let res;
  try {
    // Entry-point parity is the test suite's job; a second scan here only
    // doubles the work, and a few rules probe by mutating the page.
    const patch = ENV_PATCHES[ruleId];
    if (patch) {
      const dom = run.createDom(html);
      patch(dom);
      res = run.runa11yCoreOnDom(dom, { runOnly: [ruleId], entryPointParity: false });
    } else {
      res = run(html, { runOnly: [ruleId], entryPointParity: false });
    }
  } catch (e) {
    return { error: String((e && e.message) || e).slice(0, 200) };
  }

  const rule =
    (res.checksResults || []).find((x) => x.ruleId === ruleId) ||
    (res.rulesResults || []).find((x) => x.ruleId === ruleId);
  if (!rule) return { error: 'rule produced no result' };

  const byCase = {};
  const unmatched = [];

  for (const occ of rule.occurrences || []) {
    const hit = {
      // resolveTieredOutcome stamps occurrenceOutcome on a rule that mixes
      // tiers; failing that, per OUTPUT_SCHEMA.md an uncertainty block is
      // present only on a cantTell-tier occurrence, so it decides the tier.
      outcome:
        occ.occurrenceOutcome || occ.outcome || (occ.uncertainty ? 'cantTell' : rule.outcome),
      summary: (occ.summary || '').replace(/\s+/g, ' ').trim(),
      selector: occ.selector || null,
      uncertainty: occ.uncertainty ? occ.uncertainty.code : null
    };
    let box = null;
    if (occ.selector) {
      let node;
      try {
        node = doc.querySelector(occ.selector);
      } catch {
        // a selector the fixture's own DOM cannot resolve leaves the hit unmatched
      }
      box = node && node.closest ? node.closest('.case') : null;
    }
    if (box && box.id) (byCase[box.id] ||= []).push(hit);
    else unmatched.push(hit);
  }

  return {
    outcome: rule.outcome,
    occurrenceCount: (rule.occurrences || []).length,
    byCase,
    unmatched
  };
}

/* ---------- assembly ---------- */

/**
 * Manual rules are advisory: the default a11y policy contract coerces any fail
 * they produce to cantTell, so they are presented that way.
 */
function capForType(rule, type) {
  if (type !== 'manual') return rule;
  rule.outcomes = rule.outcomes.filter((o) => o !== 'fail');
  if (rule.messages.fail.length && !rule.outcomes.includes('cantTell'))
    rule.outcomes.push('cantTell');
  rule.messages.cantTell = rule.messages.cantTell.concat(rule.messages.fail);
  rule.messages.fail = [];
  return rule;
}

function settleCase(c, engine, type) {
  const hits = (engine && engine.byCase && engine.byCase[c.id]) || [];
  const tiers = hits.map((h) => h.outcome);

  if (c.scope === 'document') {
    // The rule reports one outcome for the page, so pass and notApplicable are
    // told apart here -- unlike an element case, where neither is an occurrence.
    c.engineHits = (engine && engine.unmatched) || [];
    c.engineOutcome = (engine && engine.outcome) || 'notFlagged';
    let claimed = c.outcome;
    if (type === 'manual' && claimed === 'fail') claimed = 'cantTell';
    const unstated = claimed === 'other' || claimed === 'flagged';
    c.agrees = unstated ? true : claimed === c.engineOutcome;
    if (unstated) c.outcome = c.engineOutcome;
    return c;
  }

  c.engineHits = hits;
  c.engineOutcome = tiers.length ? (tiers.includes('fail') ? 'fail' : tiers[0]) : 'notFlagged';

  let want = c.outcome;
  if (type === 'manual' && want === 'fail') want = 'cantTell';
  // "FLAGGED" claims a report without naming the tier; an unlabelled case
  // claims nothing at all. Neither can contradict the engine.
  if (want === 'flagged' && tiers.length) want = c.engineOutcome;

  const expectFlag = want === 'fail' || want === 'cantTell' || want === 'flagged';
  const gotFlag = c.engineOutcome !== 'notFlagged';
  c.agrees =
    want === 'other' ? true : expectFlag === gotFlag && (!expectFlag || want === c.engineOutcome);

  if ((c.outcome === 'flagged' || c.outcome === 'other') && gotFlag) c.outcome = c.engineOutcome;
  else if (c.outcome === 'flagged') c.outcome = 'cantTell';

  return c;
}

/**
 * @param {object} [opts]
 * @param {string} [opts.repoRoot]
 * @param {string[]} [opts.types] which of src/checks/<type> to include
 * @returns {{rules: object[], stats: object}}
 */
function collect(opts = {}) {
  const repoRoot = opts.repoRoot || findRepoRoot(__dirname);
  const types = opts.types || ['automatic', 'manual'];

  const messages = JSON.parse(fs.readFileSync(path.join(repoRoot, 'src/i18n/en.json'), 'utf8'));
  const tests = scanTestFiles(repoRoot, 'tests/engine-checks');
  const run = require(path.join(repoRoot, 'tests/helpers/runa11yCoreOnHtml'));

  const rules = [];
  let replayed = 0;
  let replayErrors = 0;

  for (const mod of listRuleModules(repoRoot, 'src/checks', types)) {
    const meta = mod.meta;
    const source = fs.readFileSync(path.join(repoRoot, mod.file), 'utf8');
    const found = tests.get(mod.id) || {};
    const fixtureFile = found.fixtureFile ? 'tests/fixtures/' + found.fixtureFile : null;
    const prefix =
      meta.i18n && meta.i18n.titleKey ? meta.i18n.titleKey.replace(/_title$/, '') : null;

    // One parse per fixture, shared by the case reader and the occurrence
    // mapping. The engine gets its own document from the test helper: some
    // rules probe the page by mutating it, so it must not be this one.
    const fixtureHtml = readFixture(repoRoot, fixtureFile);
    const fixtureDoc = fixtureHtml ? new JSDOM(fixtureHtml).window.document : null;

    const engine = replayFixture(run, mod.id, fixtureHtml, fixtureDoc);
    if (engine && engine.error) replayErrors++;
    else if (engine) replayed++;

    const rule = capForType(
      {
        id: mod.id,
        type: mod.type,
        title: meta.title || '',
        description: meta.description || '',
        sc: meta.wcagSc || [],
        level: levelFromTags(meta.tags),
        confidence: meta.defaultConfidence || '',
        severity: meta.defaultSeverity || '',
        category: meta.category || '',
        applicability: jsdocTag(source, 'applicability'),
        expectation: jsdocTag(source, 'expectation'),
        outcomes: extractRuleOutcomes(source),
        messages: messagesFor(messages, prefix, source),
        ruleFile: mod.file,
        testFile: found.testFile || null,
        fixtureFile,
        engineOutcome: engine && !engine.error ? engine.outcome : null,
        unmatched: engine && !engine.error ? engine.unmatched.slice(0, 12) : [],
        cases: fixtureCases(fixtureDoc, mod.id),
        tests: testCases(repoRoot, found.testFile)
      },
      mod.type
    );

    rule.cases = rule.cases.map((c) =>
      settleCase(c, engine && !engine.error ? engine : null, mod.type)
    );
    rules.push(rule);
  }

  rules.sort((a, b) => a.id.localeCompare(b.id));

  const cases = rules.reduce((s, r) => s + r.cases.length, 0);
  return {
    rules,
    stats: {
      rules: rules.length,
      cases,
      tests: rules.reduce((s, r) => s + r.tests.length, 0),
      disagreements: rules.reduce((s, r) => s + r.cases.filter((c) => !c.agrees).length, 0),
      replayed,
      replayErrors
    }
  };
}

module.exports = { collect, findRepoRoot, OUTCOMES };
