'use strict';
// Random/malformed HTML fuzzer for the full engine in jsdom.
// usage: node fuzz.js <startSeed> <count> <outFile>
// For each seed: build a document (plus random open shadow roots), scan it
// through both entry points (runa11yCoreOnHtml asserts they agree), scan a
// second time on a fresh DOM, and record throws, rule errors, nondeterminism
// and scans over 5 s. Writes JSON lines to <outFile>.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../../..');
const { createDom, runa11yCoreOnDom } = require(path.join(ROOT, 'src/testing.js'));

const [startArg, countArg, outFile] = process.argv.slice(2);
const START = Number(startArg) || 1;
const COUNT = Number(countArg) || 100;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const TAGS = ['div', 'span', 'p', 'a', 'button', 'input', 'select', 'option', 'optgroup', 'textarea',
  'label', 'form', 'fieldset', 'legend', 'img', 'svg', 'math', 'table', 'tr', 'td', 'th', 'thead',
  'tbody', 'caption', 'colgroup', 'col', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h6',
  'nav', 'main', 'header', 'footer', 'aside', 'section', 'article', 'iframe', 'video', 'audio',
  'track', 'source', 'object', 'embed', 'area', 'map', 'details', 'summary', 'dialog', 'menu',
  'output', 'meter', 'progress', 'figure', 'figcaption', 'blink', 'marquee', 'x-foo', 'my-el',
  'canvas', 'picture', 'slot', 'template', 'abbr', 'em', 'strong', 'b', 'i', 'sup', 'hr', 'br',
  'title', 'meta', 'style', 'noscript', 'search', 'hgroup', 'address', 'datalist', 'frame', 'center'];
// FUZZ_NO_MATH=1 leaves MathML out: jsdom's getComputedStyle throws inside it (see FINDINGS.md)
if (process.env.FUZZ_NO_MATH) TAGS.splice(TAGS.indexOf('math'), 1);
const SVG_TAGS = ['g', 'rect', 'circle', 'text', 'title', 'desc', 'use', 'a', 'foreignObject', 'path', 'image', 'tspan'];
const MATH_TAGS = ['mi', 'mo', 'mn', 'mrow', 'mfrac', 'msup', 'mtext', 'semantics', 'annotation'];
const ROLES = ['button', 'link', 'img', 'presentation', 'none', 'heading', 'list', 'listitem', 'menu',
  'menuitem', 'menuitemcheckbox', 'tab', 'tablist', 'tabpanel', 'grid', 'gridcell', 'row', 'rowgroup',
  'cell', 'columnheader', 'rowheader', 'table', 'treegrid', 'tree', 'treeitem', 'combobox', 'listbox',
  'option', 'textbox', 'searchbox', 'slider', 'spinbutton', 'checkbox', 'radio', 'radiogroup', 'switch',
  'dialog', 'alertdialog', 'alert', 'status', 'log', 'marquee', 'timer', 'navigation', 'main', 'banner',
  'contentinfo', 'region', 'form', 'search', 'complementary', 'article', 'document', 'application',
  'group', 'toolbar', 'separator', 'scrollbar', 'math', 'note', 'figure', 'term', 'definition',
  'doc-noteref', 'graphics-document', 'generic', 'bogus', '', ' ', 'button link', 'BUTTON', 'img none',
  'directory', 'feed', 'meter', 'progressbar', 'tooltip', 'mark', 'suggestion', 'comment'];
const ARIA = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-owns', 'aria-controls',
  'aria-hidden', 'aria-expanded', 'aria-checked', 'aria-pressed', 'aria-selected', 'aria-level',
  'aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-required', 'aria-invalid',
  'aria-live', 'aria-busy', 'aria-disabled', 'aria-haspopup', 'aria-current', 'aria-sort',
  'aria-colcount', 'aria-rowcount', 'aria-colindex', 'aria-rowindex', 'aria-colspan', 'aria-rowspan',
  'aria-setsize', 'aria-posinset', 'aria-activedescendant', 'aria-errormessage', 'aria-details',
  'aria-roledescription', 'aria-modal', 'aria-orientation', 'aria-autocomplete', 'aria-multiline',
  'aria-placeholder', 'aria-keyshortcuts', 'aria-braillelabel', 'aria-description', 'aria-flowto',
  'aria-relevant', 'aria-atomic', 'aria-dropeffect', 'aria-grabbed', 'aria-bogus', 'aria-', 'ARIA-LABEL'];
const VALS = ['', ' ', 'true', 'false', 'mixed', 'undefined', 'null', '0', '-1', '1', '2', '999999999',
  'NaN', '1e400', '3.5', 'abc', 'page', 'step', 'polite', 'assertive', 'off', 'ascending', 'other',
  'dialog', 'menu', 'grammar', 'additions text', '&amp;', '&#0;', '&#xD800;', '​', ' ',
  'Ünïcödé 名前', '<b>x</b>', '"\'', 'a'.repeat(300), 'x\ny', 'TRUE', 'True'];
const ATTRS = ['id', 'class', 'title', 'alt', 'href', 'src', 'type', 'name', 'value', 'for', 'tabindex',
  'lang', 'xml:lang', 'dir', 'hidden', 'disabled', 'readonly', 'required', 'placeholder', 'autocomplete',
  'headers', 'scope', 'colspan', 'rowspan', 'accesskey', 'contenteditable', 'inert', 'popover',
  'usemap', 'list', 'form', 'style', 'srcdoc', 'longdesc', 'summary', 'open', 'controls', 'autoplay',
  'muted', 'kind', 'label', 'multiple', 'size', 'width', 'height', 'abbr', 'role', 'slot', 'is',
  'http-equiv', 'content', 'charset', 'download', 'xlink:href', 'focusable', 'draggable', 'translate'];
const LANGS = ['en', 'EN-us', 'fr-CA', 'zh-Hant-TW', 'x-klingon', 'i-default', '', ' ', 'en_US', '123',
  'english', 'qaa', 'sgn-BE-FR', 'art-lojban', 'en-', '-en', 'en--us', 'a'.repeat(9), 'und', 'mul', 'zxx',
  'de-1996', 'es-419', 'iw', 'tl', 'en-GB-oed', 'x-', 'he', 'ar'];
const INPUT_TYPES = ['text', 'image', 'submit', 'reset', 'button', 'hidden', 'checkbox', 'radio', 'email',
  'tel', 'url', 'number', 'range', 'color', 'date', 'file', 'password', 'search', 'bogus', ''];
const AUTOCOMPLETE = ['on', 'off', 'email', 'name', 'shipping street-address', 'section-x billing tel',
  'webauthn', 'username webauthn', 'nope', 'cc-number', 'home email', 'given-name family-name', ''];
const STYLES = ['display:none', 'visibility:hidden', 'opacity:0', 'position:absolute;left:-9999px',
  'clip:rect(0 0 0 0)', 'color:#777;background:#888', 'font-size:0', 'width:0;height:0;overflow:hidden',
  'color:red', 'content-visibility:hidden', 'line-height:0.5 !important', 'letter-spacing:-1px',
  'transform:scale(0)', 'pointer-events:none', 'background-image:url(x.png)', 'text-indent:-9999px',
  'overflow:hidden;white-space:nowrap', 'color:rgba(0,0,0,0)', 'filter:blur(2px)', '{{{', 'color:'];
const TEXTS = ['', ' ', '\n\t', 'Hello', 'Click here', 'More', '&nbsp;', '&amp;&lt;&gt;', '&bogus;',
  '&#128512;', '​', '...', '1', '★', 'Read more', 'Submit', 'x'.repeat(50), '&#x202E;rtl', '<!-- c -->',
  '<![CDATA[x]]>', '</p>', '<', '&', 'Lorem ipsum dolor sit amet', '\u0000'];

function gen(seed) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const ids = [];
  const nIds = 1 + Math.floor(r() * 8);
  for (let i = 0; i < nIds; i++) ids.push(pick(['a', 'b', 'c', 'x y', '1', 'l' + i, 'dup', '', 'é', 'c:d']));
  const idref = () => {
    const k = Math.floor(r() * 3) + 1;
    const out = [];
    for (let i = 0; i < k; i++) out.push(r() < 0.85 ? pick(ids) : pick(['missing', '', 'a a', '  ']));
    return out.join(' ');
  };
  let budget = 40 + Math.floor(r() * 200);
  const maxDepth = r() < 0.1 ? 120 : 12;

  function attrs(tag) {
    const parts = [];
    const n = Math.floor(r() * 5);
    if (r() < 0.6) parts.push(`id="${pick(ids)}"`);
    if (r() < 0.35) parts.push(`role="${pick(ROLES)}"`);
    for (let i = 0; i < n; i++) {
      const roll = r();
      if (roll < 0.45) {
        const a = pick(ARIA);
        const isRef = /labelledby|describedby|owns|controls|activedescendant|errormessage|details|flowto/.test(a);
        parts.push(`${a}="${isRef && r() < 0.8 ? idref() : pick(VALS)}"`);
      } else {
        const a = pick(ATTRS);
        let v = pick(VALS);
        if (a === 'lang' || a === 'xml:lang') v = pick(LANGS);
        else if (a === 'for' || a === 'headers' || a === 'list' || a === 'form') v = idref();
        else if (a === 'type') v = pick(INPUT_TYPES);
        else if (a === 'autocomplete') v = pick(AUTOCOMPLETE);
        else if (a === 'style') v = pick(STYLES);
        else if (a === 'href') v = pick(['#', '#a', 'javascript:void(0)', 'https://x.test/', '', 'mailto:a@b']);
        else if (a === 'tabindex') v = pick(['0', '-1', '1', '32768', 'x', '']);
        else if (a === 'http-equiv') v = 'refresh';
        else if (a === 'content') v = pick(['0', '5; url=x', '0;url=', '-1', 'abc', '72001']);
        parts.push(`${a}="${String(v).replace(/"/g, '&quot;')}"`);
      }
    }
    if (tag === 'input' && r() < 0.6) parts.push(`type="${pick(INPUT_TYPES)}"`);
    if (tag === 'a' && r() < 0.7) parts.push('href="#x"');
    if (tag === 'img' && r() < 0.5) parts.push(`alt="${pick(TEXTS)}"`);
    return parts.length ? ' ' + parts.join(' ') : '';
  }

  function node(depth, ns) {
    if (budget-- <= 0) return pick(TEXTS);
    if (r() < 0.25) return pick(TEXTS);
    let tag;
    if (ns === 'svg') tag = r() < 0.8 ? pick(SVG_TAGS) : pick(TAGS);
    else if (ns === 'math') tag = r() < 0.8 ? pick(MATH_TAGS) : pick(TAGS);
    else tag = pick(TAGS);
    const nextNs = tag === 'svg' ? 'svg' : tag === 'math' ? 'math' : tag === 'foreignObject' ? null : ns;
    const voidish = ['input', 'img', 'br', 'hr', 'col', 'area', 'track', 'source', 'embed', 'meta'].includes(tag);
    if (voidish && !ns) return `<${tag}${attrs(tag)}>`;
    let inner = '';
    if (depth < maxDepth) {
      const kids = maxDepth > 20 ? 1 + Math.floor(r() * 2) : Math.floor(r() * 4);
      for (let i = 0; i < kids; i++) inner += node(depth + 1, nextNs);
    }
    const close = r() < 0.05 ? '' : `</${tag}>`; // sometimes unclosed
    return `<${tag}${attrs(tag)}>${inner}${close}`;
  }

  let body = '';
  while (budget > 0) body += node(0, null);
  const htmlLang = r() < 0.8 ? ` lang="${pick(LANGS)}"` : '';
  const head = r() < 0.7 ? `<title>${pick(TEXTS)}</title>` : '';
  const meta = r() < 0.1 ? `<meta name="viewport" content="${pick(['user-scalable=no', 'maximum-scale=1.0', 'width=device-width', 'maximum-scale=yes', ''])}">` : '';
  const doctype = r() < 0.85 ? '<!doctype html>' : '';
  // a few shadow roots: [hostIdx, innerHtml]
  const shadows = [];
  const nShadow = r() < 0.3 ? 1 + Math.floor(r() * 3) : 0;
  for (let i = 0; i < nShadow; i++) {
    budget = 15 + Math.floor(r() * 30);
    let inner = '';
    while (budget > 0) inner += node(0, null);
    if (r() < 0.5) inner += '<slot></slot>';
    shadows.push([Math.floor(r() * 1000), inner]);
  }
  return {
    html: `${doctype}<html${htmlLang}><head>${head}${meta}</head><body>${body}</body></html>`,
    shadows
  };
}

function build(doc) {
  const dom = createDom(doc.html);
  const els = Array.from(dom.window.document.body ? dom.window.document.body.querySelectorAll('*') : []);
  for (const [idx, inner] of doc.shadows) {
    if (!els.length) break;
    const host = els[idx % els.length];
    try {
      const sr = host.attachShadow({ mode: 'open' });
      sr.innerHTML = inner;
    } catch {
      // element can't host a shadow root
    }
  }
  return dom;
}

function digest(res) {
  return res.checksResults.map((c) => [c.ruleId, c.outcome,
    (c.occurrences || []).map((o) => (o.shadowHostSelectors || []).join('>') + '|' + o.selector + '|' + (o.outcome || '')).join(';'),
    c.error || ''].join('#')).join('\n');
}

function scanOnce(doc, parity) {
  const dom = build(doc);
  const t0 = performance.now();
  const res = runa11yCoreOnDom(dom, { engineOptions: { optInRules: 'all', perfStats: true, profileRules: true }, entryPointParity: parity });
  const ms = performance.now() - t0;
  try { dom.window.close(); } catch {}
  return { res, ms };
}

// Silence the engine's console noise (unknown tags etc.)
console.warn = () => {};

const out = fs.openSync(outFile, 'a');
(async () => {
for (let seed = START; seed < START + COUNT; seed++) {
  // let jsdom's pending load tasks run, or every closed document stays alive
  await new Promise((r) => setImmediate(r));
  const doc = gen(seed);
  const rec = { seed };
  try {
    const a = scanOnce(doc, true);
    const b = scanOnce(doc, false);
    rec.ms = [Math.round(a.ms), Math.round(b.ms)];
    const errs = a.res.checksResults.filter((c) => c.error && c.outcome === 'cantTell' && !(c.occurrences || []).length)
      .map((c) => ({ ruleId: c.ruleId, error: String(c.error).slice(0, 400) }));
    const notes = a.res.checksResults.filter((c) => c.error && !(c.outcome === 'cantTell' && !(c.occurrences || []).length))
      .map((c) => ({ ruleId: c.ruleId, error: String(c.error).slice(0, 200) }));
    if (errs.length) rec.ruleErrors = errs;
    if (notes.length) rec.engineNotes = notes;
    const da = digest(a.res);
    const db = digest(b.res);
    if (da !== db) {
      const la = da.split('\n');
      const lb = db.split('\n');
      rec.nondet = la.map((l, i) => (l !== lb[i] ? [l.slice(0, 300), (lb[i] || '').slice(0, 300)] : null)).filter(Boolean);
    }
    if (a.ms > 5000 || b.ms > 5000) {
      rec.slow = true;
      const t = (a.res.perfStats && a.res.perfStats.ruleTimings) || a.res.ruleTimings || {};
      rec.topRules = Object.entries(t).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => k + ':' + Math.round(v));
    }
  } catch (e) {
    rec.thrown = String((e && e.stack) || e).slice(0, 1500);
  }
  if (rec.ruleErrors || rec.nondet || rec.slow || rec.thrown || rec.engineNotes) {
    fs.writeSync(out, JSON.stringify(rec) + '\n');
  }
  if (seed % 50 === 0) process.stderr.write(`seed ${seed}\n`);
}
fs.closeSync(out);
})();
