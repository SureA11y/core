#!/usr/bin/env node
'use strict';

/**
 * ax-tree-differential.js
 *
 * Compares the engine's view of each element with Chromium's accessibility
 * tree, element by element: whether it is hidden from assistive technology,
 * its role, and its accessible name. Every rule that names an element or
 * skips hidden content depends on those three, so a page where the two
 * disagree points at a name-computation or visibility bug that no single
 * rule's tests would show. A disagreement is a lead, not a verdict: the
 * engine follows HTML-AAM and accname where Chromium departs from them
 * (docs/DESIGN_CHALLENGES.md), and some roles have no one-to-one
 * counterpart (KNOWN_ROLES below).
 *
 * The engine's side runs in the same Chromium page as Chromium's, from the
 * source tree (src/core/dom-helpers.js, bundled with esbuild at start), so
 * both read the same rendered DOM; no build is needed first.
 *
 * Pages, from any of:
 *   fixtures  tests/fixtures/*.html and tests/patterns/*.html
 *   examples  every example in docs/RULE_EXAMPLES.md
 *   act       the ACT Rules test cases (fetched and cached in .act-cache/;
 *             --act-source=cg for the Community Group's corpus)
 *   --file=   any local HTML file (repeatable)
 *   --url=    any page (repeatable)
 *
 * Not part of `npm test`: a manually run dev tool, like
 * scripts/other-engine-corpus-check.js, since it needs Playwright's Chromium
 * and its results move with Chromium's releases.
 *
 * Usage:
 *   node scripts/ax-tree-differential.js [--sources=fixtures,examples]
 *     [--file=page.html] [--url=https://…] [--act-source=w3c|cg]
 *     [--kinds=hidden,role,name] [--examples=3] [--out=report.json]
 *
 * Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build. Exits 0 when
 * the comparison ran, whatever it found; 2 when it could not run.
 */

const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');

// Chromium's reasons for leaving a node out that mean "hidden from assistive
// technology", as opposed to "present but not interesting" (a plain <div>).
const HIDDEN_REASONS = new Set([
  'notRendered',
  'notVisible',
  'ariaHiddenElement',
  'ariaHiddenSubtree',
  'inertElement',
  'inertSubtree',
  'activeModalDialog',
  'probablyPresentational'
]);

// Chromium's role names that differ from the ARIA role the engine reports.
// null: Chromium's node has no ARIA counterpart, so its role is not compared.
const CHROME_ROLE_TO_ARIA = {
  image: 'img',
  StaticText: null,
  InlineTextBox: null,
  ListMarker: null,
  LineBreak: null,
  RootWebArea: null,
  LabelText: null,
  LayoutTable: null,
  LayoutTableRow: null,
  LayoutTableCell: null,
  Iframe: null,
  IframePresentational: null,
  Canvas: null,
  Abbr: null,
  Ruby: null,
  DisclosureTriangle: null,
  DescriptionList: 'list',
  DescriptionListTerm: 'term',
  DescriptionListDetail: 'definition',
  Details: 'group',
  Video: null,
  EmbeddedObject: null,
  PluginObject: null,
  SvgRoot: null,
  Section: null,
  Audio: null,
  Pre: 'generic',
  Legend: null,
  Figcaption: null,
  Mark: 'mark',
  Time: 'time',
  Subscript: 'subscript',
  Superscript: 'superscript',
  emphasis: 'emphasis',
  strong: 'strong',
  code: 'code'
};

// Pairs that are the same thing said two ways: [Chromium's role, the
// engine's role]. The engine reports null for an element with no role.
const KNOWN_ROLES = [
  ['generic', null],
  ['none', null],
  ['none', 'presentation'],
  ['none', 'none'],
  ['presentation', null],
  ['sectionHeader', null],
  ['sectionFooter', null],
  ['sectionHeader', 'generic'],
  ['sectionFooter', 'generic'],
  ['paragraph', null],
  ['blockquote', null],
  ['caption', null],
  ['group', null],
  ['textbox', 'searchbox'],
  ['list', 'directory']
];

// WAI-ARIA 1.2 (and DPUB-ARIA) roles that take their name from content: the engine's
// getNameFromContentInfo applies to these, getAccessibleNameInfo (author
// naming, label, alt, title) to the rest, as the rules choose. row is left
// out: Chromium names no row from its cells, and no rule reads a row's name.
const NAME_FROM_CONTENT = [
  'button',
  'cell',
  'checkbox',
  'columnheader',
  'doc-backlink',
  'doc-biblioref',
  'doc-glossref',
  'doc-noteref',
  'gridcell',
  'heading',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'rowheader',
  'sectionhead',
  'switch',
  'tab',
  'tooltip',
  'treeitem'
];

// Differences that are not the engine's to fix, each decided and recorded:
// left out of the report, and counted in its summary with their reason.
const KNOWN_DIFFERENCES = [
  {
    id: 'area-node',
    reason:
      'Chromium reports an <area> (and its <map>) node as not rendered even in a map an image uses, and exposes its link through the image',
    matches: (d, e) => d.kind === 'hidden' && (e.tag === 'area' || e.tag === 'map')
  },
  {
    id: 'body-aria-hidden',
    reason:
      'Chromium ignores aria-hidden="true" on <body>; the engine hides the content, and aria-hidden-body fails the attribute',
    matches: (d, e) => d.kind === 'hidden' && e.bodyAriaHidden && e.reasons.includes('ariaHidden')
  },
  {
    id: 'aria-placeholder-custom',
    reason:
      'a custom textbox or searchbox named only by aria-placeholder: Chromium names it, accname has no step for it, and the naming rules ask (cantTell)',
    matches: (d, e) =>
      d.kind === 'name' &&
      !d.engine &&
      ['textbox', 'searchbox'].includes(e.role) &&
      e.tag !== 'input' &&
      e.tag !== 'textarea' &&
      /\saria-placeholder="[^"]*[^"\s][^"]*"/.test(e.html)
  },
  {
    id: 'input-image-default-name',
    reason:
      'an <input type="image"> with no usable alt: Chromium falls back to "Submit" (HTML-AAM 4.1.3), which the image-alt rules report rather than accept',
    matches: (d, e) =>
      d.kind === 'name' &&
      !d.engine &&
      e.tag === 'input' &&
      /type="image"/i.test(e.html) &&
      !/\salt="[^"]*[^"\s][^"]*"/i.test(e.html)
  },
  {
    id: 'caption-aria-label',
    reason:
      "a table is named from its caption's content (HTML-AAM 4.1.11); Chromium uses the caption's aria-label, which ARIA prohibits (DESIGN_CHALLENGES.md)",
    matches: (d, e) => d.kind === 'name' && e.tag === 'table' && e.captionAriaLabel
  }
];

function parseArgs(argv) {
  const out = { sources: null, files: [], urls: [], kinds: null, examples: 3, actSource: 'w3c' };
  for (const a of argv) {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    const v = rest.join('=');
    if (k === 'sources') out.sources = v.split(',').filter(Boolean);
    else if (k === 'file') out.files.push(v);
    else if (k === 'url') out.urls.push(v);
    else if (k === 'kinds') out.kinds = v.split(',').filter(Boolean);
    else if (k === 'examples') out.examples = Math.max(0, Number(v) || 0);
    else if (k === 'out') out.out = v;
    else if (k === 'act-source') out.actSource = v;
    else if (k === 'help' || k === 'h') out.help = true;
    else throw new Error(`Unknown option --${k}`);
  }
  if (!out.sources)
    out.sources = out.files.length || out.urls.length ? [] : ['fixtures', 'examples'];
  if (!out.kinds) out.kinds = ['hidden', 'role', 'name'];
  return out;
}

async function collectPages(opts) {
  const pages = [];
  if (opts.sources.includes('fixtures')) {
    for (const dir of ['tests/fixtures', 'tests/patterns']) {
      for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) {
        if (!f.endsWith('.html') || f === 'index.html') continue;
        pages.push({
          source: 'fixtures',
          id: `${dir}/${f}`,
          html: fs.readFileSync(path.join(ROOT, dir, f), 'utf8')
        });
      }
    }
  }
  if (opts.sources.includes('examples')) {
    const { readExamples, toPage } = require('../src/rule-docs.js');
    const counts = {};
    for (const ex of readExamples(path.join(ROOT, 'docs', 'RULE_EXAMPLES.md'))) {
      counts[ex.ruleId] = (counts[ex.ruleId] || 0) + 1;
      pages.push({
        source: 'examples',
        id: `${ex.ruleId} #${counts[ex.ruleId]} (${ex.label})`,
        html: toPage(ex.html)
      });
    }
  }
  if (opts.sources.includes('act')) {
    const { loadCorpus, fetchText, mapPool } = require('./lib/act-corpus.js');
    const corpus = await loadCorpus({ source: opts.actSource });
    const urls = [];
    for (const rule of corpus.rules.values()) {
      if (rule.deprecated) continue;
      for (const bucket of Object.values(rule.buckets)) urls.push(...bucket);
    }
    const htmlUrls = urls.filter((u) => /\.html?$/i.test(u));
    const texts = await mapPool(htmlUrls, 3, (u) => fetchText(u).catch(() => null));
    htmlUrls.forEach((u, i) => {
      if (texts[i]) pages.push({ source: 'act', id: u, html: texts[i], baseUrl: u });
    });
  }
  for (const f of opts.files) {
    pages.push({ source: 'file', id: f, html: fs.readFileSync(path.resolve(f), 'utf8') });
  }
  for (const u of opts.urls) pages.push({ source: 'url', id: u, url: u });
  return pages;
}

function helpersBundle() {
  const result = esbuild.buildSync({
    stdin: {
      contents:
        "const { createDomHelpers } = require('./src/core/dom-helpers.js');\n" +
        'globalThis.__axDiff = { createDomHelpers };\n',
      resolveDir: ROOT,
      sourcefile: 'ax-tree-differential-helpers.js'
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'error'
  });
  return result.outputFiles[0].text;
}

// Runs in the page: tags every element (open shadow roots included) with
// data-axd and records what the engine makes of it.
function engineView(nameFromContent) {
  const GLOBAL_ARIA = [
    'aria-atomic',
    'aria-busy',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-live',
    'aria-owns',
    'aria-relevant',
    'aria-roledescription'
  ];
  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'head',
    'meta',
    'link',
    'title',
    'track',
    'source',
    'param'
  ]);
  const helpers = window.__axDiff.createDomHelpers({ window, document, root: document });
  const bodyAriaHidden =
    !!document.body &&
    (document.body.getAttribute('aria-hidden') || '').trim().toLowerCase() === 'true';
  const out = [];
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) walk(el.shadowRoot);
      const tag = el.localName;
      if (
        SKIP.has(tag) ||
        !document.body ||
        !(document.body.contains(el) || el.getRootNode() !== document)
      ) {
        continue;
      }
      const i = out.length;
      el.setAttribute('data-axd', String(i));
      out.push({ i, el, tag });
    }
  };
  walk(document);
  return out.map(({ i, el, tag }) => {
    // isIncludedInAccessibilityTree, not isAccTreeEligible: the latter keeps
    // focusable content under aria-hidden so aria-hidden-focus can reach it.
    let eligible;
    let reasons = [];
    try {
      const r = helpers.isAccTreeEligible(el);
      reasons = r.reasons || [];
      eligible = helpers.isIncludedInAccessibilityTree(el);
      if (!eligible && r.eligible) reasons = reasons.concat('ariaHidden');
    } catch {
      eligible = true;
    }
    // The role the element ends up with: the author's, unless ARIA's own
    // rules set it aside (presentation on a focusable element or one with a
    // global ARIA attribute; a region or form with no name), else its
    // implicit one. roleSource says which, so a reader can tell a role the
    // author wrote from one the engine worked out.
    let role;
    let roleSource = 'none';
    try {
      const aria = helpers.aria;
      // The implicit role, read with the role attribute set aside for the
      // moment (and put back) so no helper returns the author's instead.
      // An unnamed <form> or <section> is generic (HTML-AAM).
      const native = () => {
        const attr = el.getAttribute('role');
        if (attr !== null) el.removeAttribute('role');
        try {
          const r =
            (aria.getInternalsRole && aria.getInternalsRole(el)) ||
            aria.getNativeRoleForElement(el) ||
            helpers.getRoleInfo(el).role ||
            helpers.getLandmarkRole(el) ||
            null;
          if ((r === 'form' || r === 'region') && !helpers.getAccessibleNameInfo(el).value)
            return null;
          return r;
        } finally {
          if (attr !== null) el.setAttribute('role', attr);
        }
      };
      const author = aria.getAuthorRole(el);
      const conflict =
        (author === 'presentation' || author === 'none') &&
        (helpers.getFocusableInfo(el).focusable ||
          [...el.attributes].some((a) => GLOBAL_ARIA.includes(a.name)));
      const unnamedLandmark =
        (author === 'region' || author === 'form') && !helpers.getAccessibleNameInfo(el).value;
      if (author && !conflict && !unnamedLandmark) {
        role = author;
        roleSource = 'author';
      } else {
        role = native();
        roleSource = role ? 'native' : 'none';
      }
      // A cell of a table the author made presentational is no cell.
      const table = el.closest('table');
      if (
        roleSource === 'native' &&
        ['cell', 'columnheader', 'rowheader', 'row', 'rowgroup'].includes(role) &&
        table &&
        ['presentation', 'none'].includes(aria.getAuthorRole(table))
      ) {
        role = null;
        roleSource = 'none';
      }
    } catch {
      role = null;
    }
    let name = null;
    if (eligible) {
      try {
        const info = nameFromContent.includes(role)
          ? helpers.getNameFromContentInfo(el)
          : helpers.getAccessibleNameInfo(el);
        name = (info && info.value) || '';
        // An <svg>'s <title> child names it; svg-text-alternative-present
        // reads it itself, as no shared helper does.
        if (!name && tag === 'svg') {
          const title = [...el.children].find((c) => c.localName === 'title');
          if (title) name = title.textContent.replace(/\s+/g, ' ').trim();
        }
        // An input button's value, else HTML's default label, as
        // button-name-present reads it.
        const type = tag === 'input' ? String(el.getAttribute('type') || '').toLowerCase() : '';
        if (!name && ['submit', 'reset', 'button'].includes(type)) {
          const value = el.getAttribute('value');
          if (value != null) name = value.replace(/\s+/g, ' ').trim();
          else if (type === 'submit') name = 'Submit';
          else if (type === 'reset') name = 'Reset';
        }
        if (!name) {
          const host = helpers.getNativeHostNameInfo(el, null, { placeholder: true });
          if (host && host.present) name = host.value;
        }
      } catch {
        name = null;
      }
    }
    // Chromium leaves out of its tree elements with nothing to say (a plain
    // <span>, an image with alt=""), so absence means hidden only for an
    // element with no box at all.
    const rendered = el.getClientRects().length > 0 || getComputedStyle(el).display === 'contents';
    const html = el.outerHTML.replace(/\s+/g, ' ').replace(/ data-axd="\d+"/g, '');
    const caption =
      tag === 'table' ? [...el.children].find((c) => c.localName === 'caption') : null;
    return {
      i,
      tag,
      bodyAriaHidden,
      captionAriaLabel: !!(caption && (caption.getAttribute('aria-label') || '').trim()),
      eligible,
      reasons,
      rendered,
      role,
      roleSource,
      name,
      html: html.length > 160 ? html.slice(0, 160) + '…' : html
    };
  });
}

async function chromeView(cdp) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const byBackend = new Map();
  const visit = (n) => {
    if (!n) return;
    if (n.attributes) {
      for (let k = 0; k < n.attributes.length; k += 2) {
        if (n.attributes[k] === 'data-axd')
          byBackend.set(n.backendNodeId, Number(n.attributes[k + 1]));
      }
    }
    (n.children || []).forEach(visit);
    (n.shadowRoots || []).forEach(visit);
  };
  visit(root);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const out = new Map();
  for (const n of nodes) {
    if (n.backendDOMNodeId == null || !byBackend.has(n.backendDOMNodeId)) continue;
    const i = byBackend.get(n.backendDOMNodeId);
    out.set(i, {
      role: n.role ? n.role.value : null,
      name: n.name && n.name.value != null ? String(n.name.value) : '',
      ignored: !!n.ignored,
      ignoredReasons: (n.ignoredReasons || []).map((r) => r.name)
    });
  }
  return out;
}

const norm = (s) =>
  String(s == null ? '' : s)
    .replace(/\s+/g, ' ')
    .trim();

function knownRole(chromeRole, coreRole) {
  return KNOWN_ROLES.some(([c, e]) => c === chromeRole && e === coreRole);
}

// Every disagreement, with `known` set to the KNOWN_DIFFERENCES id it
// matches (null when it is a lead).
function compareAll(engine, chrome, kinds) {
  const diffs = [];
  for (const e of engine) {
    const c = chrome.get(e.i);
    if (!c && e.eligible && e.rendered) continue;
    // Chromium gives some hidden nodes no reason at all (the content of a
    // <body aria-hidden="true">), so a node it ignores without saying why
    // counts as hidden too.
    const chromeHidden =
      !c ||
      (c.ignored &&
        (c.ignoredReasons.length === 0 || c.ignoredReasons.some((r) => HIDDEN_REASONS.has(r))));
    const base = { tag: e.tag, html: e.html, element: e };
    if (kinds.includes('hidden') && chromeHidden === e.eligible) {
      diffs.push({
        ...base,
        kind: 'hidden',
        chrome: !c
          ? 'not in tree, no box'
          : c.ignored
            ? `ignored (${c.ignoredReasons.join(', ') || 'no reason'})`
            : 'exposed',
        engine: e.eligible ? 'exposed' : `hidden (${e.reasons.join(', ')})`,
        signature: e.eligible
          ? `hidden: Chromium ${c ? c.ignoredReasons.filter((r) => HIDDEN_REASONS.has(r)).join('+') : 'absent, no box'}, engine exposed <${e.tag}>`
          : `hidden: Chromium exposed, engine ${e.reasons.join('+')} <${e.tag}>`
      });
      if (e.eligible) continue;
    }
    if (!c || c.ignored || !e.eligible) continue;
    const mapped = Object.prototype.hasOwnProperty.call(CHROME_ROLE_TO_ARIA, c.role)
      ? CHROME_ROLE_TO_ARIA[c.role]
      : c.role;
    // The engine has no single implicit-role table (each rule reads the
    // roles it needs), so a role is compared only where it states one.
    if (
      kinds.includes('role') &&
      e.role !== null &&
      mapped !== null &&
      mapped !== e.role &&
      !knownRole(c.role, e.role)
    ) {
      diffs.push({
        ...base,
        kind: 'role',
        chrome: c.role,
        engine: e.role,
        signature: `role (${e.roleSource}): Chromium ${c.role}, engine ${e.role} <${e.tag}>`
      });
    }
    // Chromium names a <video> or <audio> that hasn't loaded "Unable to play
    // media.", and a role-less element only where it has one to give, so
    // those names are not compared.
    if (
      kinds.includes('name') &&
      e.name !== null &&
      e.role !== null &&
      e.role !== 'row' &&
      c.role !== 'Video' &&
      c.role !== 'Audio' &&
      norm(c.name) !== norm(e.name)
    ) {
      const which = !norm(c.name) ? 'Chromium empty' : !norm(e.name) ? 'engine empty' : 'differ';
      diffs.push({
        ...base,
        kind: 'name',
        chrome: norm(c.name),
        engine: norm(e.name),
        signature: `name (${which}): ${c.role} <${e.tag}>`
      });
    }
  }
  for (const d of diffs) {
    const k = KNOWN_DIFFERENCES.find((x) => x.matches(d, d.element));
    d.known = k ? k.id : null;
    delete d.element;
  }
  return diffs;
}

// The disagreements that are leads: the known differences left out.
function compare(engine, chrome, kinds) {
  return compareAll(engine, chrome, kinds).filter((d) => !d.known);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(fs.readFileSync(__filename, 'utf8').split('*/')[0] + '*/\n');
    return 0;
  }
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    process.stderr.write('ax-tree-differential: needs playwright (a devDependency).\n');
    return 2;
  }
  const pages = await collectPages(opts);
  if (!pages.length) {
    process.stderr.write('ax-tree-differential: no pages to compare.\n');
    return 2;
  }
  const bundle = helpersBundle();
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  // bypassCSP: a test page's Content-Security-Policy would refuse the
  // engine's injected script.
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  const results = [];
  const errors = [];
  for (const p of pages) {
    try {
      if (p.url) await page.goto(p.url, { waitUntil: 'load', timeout: 30000 });
      else {
        // setContent rewrites the current document rather than loading a new
        // one, so the engine's per-document caches would carry over from the
        // last page: start each page from a document of its own.
        await page.goto('about:blank');
        if (p.baseUrl) await page.route('**/*', (route) => route.abort());
        await page.setContent(p.html, { waitUntil: 'load', timeout: 15000 });
        if (p.baseUrl) await page.unroute('**/*');
      }
      await page.addScriptTag({ content: bundle });
      const engine = await page.evaluate(engineView, NAME_FROM_CONTENT);
      const chrome = await chromeView(cdp);
      const all = compareAll(engine, chrome, opts.kinds);
      results.push({
        source: p.source,
        id: p.id,
        elements: engine.length,
        diffs: all.filter((d) => !d.known),
        known: all.filter((d) => d.known).map((d) => d.known)
      });
    } catch (err) {
      errors.push({
        source: p.source,
        id: p.id,
        error: String((err && err.message) || err).split('\n')[0]
      });
    }
  }
  await browser.close();

  const groups = new Map();
  let elements = 0;
  for (const r of results) {
    elements += r.elements;
    for (const d of r.diffs) {
      if (!groups.has(d.signature))
        groups.set(d.signature, { kind: d.kind, count: 0, pages: new Set(), examples: [] });
      const g = groups.get(d.signature);
      g.count += 1;
      g.pages.add(r.id);
      if (g.examples.length < opts.examples) {
        g.examples.push({ page: r.id, html: d.html, chrome: d.chrome, engine: d.engine });
      }
    }
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].count - a[1].count);
  const knownCounts = {};
  for (const r of results) for (const id of r.known) knownCounts[id] = (knownCounts[id] || 0) + 1;
  const byKind = {};
  for (const [, g] of sorted) byKind[g.kind] = (byKind[g.kind] || 0) + g.count;

  const lines = [];
  lines.push(
    `ax-tree-differential: ${results.length} page(s), ${elements} element(s) compared` +
      (errors.length ? `, ${errors.length} page(s) failed to load` : '')
  );
  lines.push(
    `disagreements: ${opts.kinds.map((k) => `${k} ${byKind[k] || 0}`).join(', ')} ` +
      `(${sorted.length} distinct)`
  );
  for (const k of KNOWN_DIFFERENCES) {
    if (knownCounts[k.id])
      lines.push(`known, left out: ${knownCounts[k.id]}× ${k.id}: ${k.reason}`);
  }
  for (const [sig, g] of sorted) {
    lines.push('', `${g.count}× on ${g.pages.size} page(s): ${sig}`);
    for (const ex of g.examples) {
      lines.push(`    ${ex.page}`);
      lines.push(`      ${ex.html}`);
      lines.push(
        `      Chromium: ${JSON.stringify(ex.chrome)}  engine: ${JSON.stringify(ex.engine)}`
      );
    }
  }
  for (const e of errors) lines.push('', `could not compare ${e.id}: ${e.error}`);
  process.stdout.write(lines.join('\n') + '\n');

  if (opts.out) {
    const report = {
      pages: results.length,
      elements,
      byKind,
      known: KNOWN_DIFFERENCES.filter((k) => knownCounts[k.id]).map((k) => ({
        id: k.id,
        reason: k.reason,
        count: knownCounts[k.id]
      })),
      groups: sorted.map(([signature, g]) => ({
        signature,
        kind: g.kind,
        count: g.count,
        pages: [...g.pages],
        examples: g.examples
      })),
      errors
    };
    fs.writeFileSync(opts.out, JSON.stringify(report, null, 2) + '\n');
  }
  return 0;
}

if (require.main === module) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`ax-tree-differential: ${(err && err.stack) || err}\n`);
      process.exit(2);
    }
  );
}

module.exports = {
  compare,
  compareAll,
  knownRole,
  KNOWN_DIFFERENCES,
  CHROME_ROLE_TO_ARIA,
  HIDDEN_REASONS
};
