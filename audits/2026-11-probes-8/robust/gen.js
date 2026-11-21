'use strict';
// Deterministic random page generator (seeded) + mutator for fixtures.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const PROTO = ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', 'prototype', '__defineGetter__', 'isPrototypeOf', 'then', 'length', 'size', 'get', 'set', 'has'];
const TAGS = ['div', 'span', 'p', 'a', 'button', 'img', 'input', 'label', 'select', 'option', 'textarea', 'h1', 'h2', 'h3', 'h6', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'caption', 'form', 'fieldset', 'legend', 'nav', 'main', 'header', 'footer', 'aside', 'section', 'article', 'iframe', 'svg', 'math', 'video', 'audio', 'track', 'object', 'embed', 'area', 'map', 'details', 'summary', 'dialog', 'figure', 'figcaption', 'blink', 'marquee', 'meter', 'progress', 'output', 'canvas', 'x-widget', 'my-el', 'abbr', 'b', 'i', 'em', 'strong', 'font', 'center', 'frame', 'slot', 'template', 'menu', 'search', 'hgroup', 'q', 'blockquote', 'pre', 'code', 'br', 'hr', 'wbr', 'col', 'colgroup', 'picture', 'source', 'datalist', 'optgroup', 'style', 'noscript'];
const ROLES = ['button', 'link', 'checkbox', 'menu', 'menuitem', 'menubar', 'tab', 'tablist', 'tabpanel', 'tree', 'treeitem', 'grid', 'row', 'gridcell', 'cell', 'listbox', 'option', 'combobox', 'dialog', 'alertdialog', 'img', 'presentation', 'none', 'heading', 'list', 'listitem', 'region', 'navigation', 'main', 'banner', 'slider', 'spinbutton', 'progressbar', 'scrollbar', 'switch', 'radio', 'radiogroup', 'textbox', 'searchbox', 'tooltip', 'status', 'alert', 'log', 'marquee', 'timer', 'feed', 'article', 'document', 'application', 'math', 'separator', 'directory', 'doc-noteref', 'graphics-document', 'button link', 'foo', '', ' ', 'BUTTON', 'generic', 'table', 'rowheader', 'columnheader', 'group', 'meter', 'form', 'search', 'term', 'definition', 'figure', 'note', 'toolbar', 'menuitemcheckbox', 'menuitemradio', 'treegrid', 'rowgroup', 'paragraph', 'code', 'mark', 'suggestion', 'comment'];
const ARIA = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'aria-expanded', 'aria-checked', 'aria-pressed', 'aria-selected', 'aria-level', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-live', 'aria-busy', 'aria-required', 'aria-invalid', 'aria-disabled', 'aria-haspopup', 'aria-modal', 'aria-current', 'aria-details', 'aria-errormessage', 'aria-roledescription', 'aria-braillelabel', 'aria-brailleroledescription', 'aria-colcount', 'aria-rowindex', 'aria-colspan', 'aria-rowspan', 'aria-sort', 'aria-posinset', 'aria-setsize', 'aria-orientation', 'aria-autocomplete', 'aria-placeholder', 'aria-keyshortcuts', 'aria-flowto', 'aria-dropeffect', 'aria-grabbed', 'aria-foo', 'aria-describedat', 'aria-relevant', 'aria-atomic', 'aria-multiselectable', 'aria-readonly', 'aria-multiline', 'aria-description'];
const ATTRS = ['id', 'class', 'role', 'tabindex', 'alt', 'title', 'href', 'src', 'lang', 'dir', 'style', 'type', 'name', 'for', 'value', 'placeholder', 'autocomplete', 'accesskey', 'hidden', 'inert', 'disabled', 'headers', 'scope', 'colspan', 'rowspan', 'onclick', 'onkeydown', 'onmousedown', 'onmouseover', 'contenteditable', 'draggable', 'popover', 'xml:lang', 'srcset', 'usemap', 'longdesc', 'summary', 'data-testid', 'open', 'controls', 'autoplay', 'muted', 'loop', 'kind', 'label', 'list', 'form', 'required', 'readonly', 'multiple', 'size', 'width', 'height', 'bgcolor', 'align', 'shadowrootmode', 'slot', 'is', 'translate', 'spellcheck', 'pattern', 'min', 'max', 'step', 'maxlength', 'inputmode', 'enterkeyhint', 'http-equiv', 'content', 'charset', 'sandbox', 'allow', 'loading', 'decoding'];
const INPUT_TYPES = ['text', 'image', 'submit', 'button', 'checkbox', 'radio', 'hidden', 'file', 'password', 'email', 'date', 'range', 'color', 'search', 'tel', 'url', 'number', 'reset', 'TEXT', 'bogus', ''];
const STYLES = ['color:#777', 'color:#fff;background:#fff', 'display:none', 'visibility:hidden', 'position:absolute;left:-9999px', 'font-size:8px', 'letter-spacing:0.01em !important', 'line-height:1 !important', 'word-spacing:0 !important', 'outline:none', 'opacity:0', 'clip:rect(0 0 0 0)', 'color:red;background:linear-gradient(red,blue)', 'background-image:url(x.png)', 'color:rgba(0,0,0,.2)', 'color:oklch(50% .2 40)', 'color:color(display-p3 1 0 0)', 'transform:rotate(90deg)', 'font-size:larger', 'font-size:calc(1em + 2px)', 'width:1px;height:1px;overflow:hidden', 'content-visibility:hidden', 'color:light-dark(#000,#fff)', 'color:CanvasText', 'position:fixed;top:0', 'zoom:2', 'font:bold 20px serif', 'text-shadow:0 0 2px #000', 'color: ;', '}{', 'color:var(--x)', 'background:url("javascript:alert(1)")', 'pointer-events:none', 'cursor:pointer', 'white-space:nowrap', 'overflow:hidden;text-overflow:ellipsis', 'mix-blend-mode:difference', 'filter:invert(1)', 'color-scheme:dark', '-webkit-text-fill-color:#fff'];
const WEIRD_VALUES = () => [
  '', ' ', '0', '-1', '1e9', 'NaN', 'Infinity', 'true', 'false', 'null', 'undefined', '{{x}}', '{{name}}', '${x}', '%s', '%d', '<b>x</b>', '"\'><svg/onload=1>', '\u0000', '​', '‮', '\ud800', '😀👍🏽', 'a'.repeat(5000), 'x '.repeat(3000), '#', 'javascript:void(0)', '#__proto__', '#constructor', 'mailto:', 'data:image/svg+xml,<svg><text>Hi</text></svg>', 'Click here', 'image.png', 'IMG_0001.JPG', 'Lorem ipsum', '\n\t ', 'ä ö ü 日本語 العربية', 'a b c', 'en', 'xx-YY', 'zh-Hant-TW', 'i-klingon', ...PROTO];

function make(seed, opts = {}) {
  const R = rng(seed);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const chance = (p) => R() < p;
  const ids = [...PROTO, 'a', 'b', 'main', 'x1', 'lbl', 'desc', 'dup', 'dup', ''];
  const vals = WEIRD_VALUES();
  const maxDepth = opts.maxDepth || 8;
  let budget = opts.budget || 150;
  function attrVal(name) {
    if (name === 'role') return chance(0.85) ? pick(ROLES) : pick(vals);
    if (name === 'id' || name === 'for' || name === 'aria-labelledby' || name === 'aria-describedby' || name === 'aria-controls' || name === 'aria-owns' || name === 'aria-activedescendant' || name === 'headers' || name === 'list' || name === 'form' || name === 'aria-details' || name === 'aria-errormessage' || name === 'aria-flowto')
      return chance(0.8) ? (chance(0.3) ? pick(ids) + ' ' + pick(ids) : pick(ids)) : pick(vals);
    if (name === 'class') return chance(0.7) ? pick(PROTO) + ' ' + pick(['sr-only', 'hidden', 'visually-hidden', 'btn', 'icon', 'skip']) : pick(vals);
    if (name === 'style') return chance(0.9) ? pick(STYLES) + (chance(0.3) ? ';' + pick(STYLES) : '') : pick(vals);
    if (name === 'type') return pick(INPUT_TYPES);
    if (name === 'tabindex') return pick(['0', '-1', '1', '32768', 'abc', '', '99999999999']);
    if (name === 'href') return pick(['#', '#main', '#__proto__', 'https://x.test/', 'javascript:void(0)', '', '/a.pdf', '#constructor', 'tel:1', pick(vals)]);
    if (name === 'lang' || name === 'xml:lang') return pick(['en', 'fr', 'EN-us', '', 'xx', 'zz-ZZ', 'ja', '__proto__', 'constructor', 'en-', '-', 'qaa-x-private', pick(vals)]);
    if (name === 'autocomplete') return pick(['on', 'off', 'email', 'given-name', 'section-x shipping email', 'bogus', 'cc-number webauthn', '__proto__', 'constructor', pick(vals)]);
    if (name.startsWith('aria-')) return chance(0.6) ? pick(['true', 'false', 'mixed', 'undefined', '0', '1', '5', '-3', 'polite', 'assertive', 'off', 'menu', 'listbox', 'page', 'step', 'x', 'ascending', 'inline', 'both']) : pick(vals);
    if (name === 'accesskey') return pick(['a', 'A', 's', 'ab', '', '1', pick(vals)]);
    if (name === 'http-equiv') return pick(['refresh', 'Refresh', 'content-type']);
    if (name === 'content') return pick(['0;url=x', '5', 'width=device-width, user-scalable=no', 'maximum-scale=1', 'text/html', pick(vals)]);
    if (name === 'shadowrootmode') return pick(['open', 'closed', 'bogus']);
    return pick(vals);
  }
  function text() {
    if (chance(0.05)) return 'w'.repeat(Math.floor(R() * 20000));
    return pick(['Hello', 'Click here', 'Read more', '', ' ', 'Save', '★', '日本語のテキスト', 'Submit form', 'x', '{{x}}', 'Menu', 'Lorem ipsum dolor sit amet', ' ', 'Search', 'Name', 'Email', '&amp; &lt;', 'A'.repeat(300), ...PROTO]);
  }
  function el(depth) {
    budget--;
    let tag = chance(0.05) ? pick(PROTO) + '-el' : pick(TAGS);
    if (chance(0.02)) tag = pick(PROTO);
    const nattrs = Math.floor(R() * 5);
    let s = '<' + tag;
    for (let i = 0; i < nattrs; i++) {
      const name = chance(0.3) ? pick(ARIA) : chance(0.05) ? pick(PROTO) : pick(ATTRS);
      const v = attrVal(name);
      s += ' ' + name + (chance(0.05) ? '' : '="' + String(v).replace(/"/g, '&quot;') + '"');
    }
    if (tag === 'input') s += ' type="' + pick(INPUT_TYPES) + '"';
    if (chance(0.01)) s += ' "bad attr=<>';
    s += '>';
    if (['img', 'input', 'br', 'hr', 'wbr', 'col', 'source', 'track', 'area', 'embed'].includes(tag)) return s;
    if (tag === 'svg') return s + pick(['<title>Chart</title>', '<text>Hi</text>', '<g role="img"><circle r="5"/></g>', '<a href="#"><text>link</text></a>', '<foreignObject><button></button></foreignObject>', '']) + '</svg>';
    if (tag === 'math') return s + '<mi>x</mi><mo>=</mo><mn>2</mn></math>';
    if (tag === 'iframe') return s + '</iframe>';
    if (tag === 'style') return s + pick(['a{color:#eee}', ':focus{outline:none}', '@media (orientation:portrait){html{transform:rotate(90deg)}}', '*{letter-spacing:0 !important}', '@layer x{.hidden{display:none}}', '@import "x.css";', '}}}{{{', '@supports (display:grid){.sr-only{position:absolute}}', 'body{color:#999;background:#aaa}']) + '</style>';
    let inner = '';
    const nkids = depth >= maxDepth || budget <= 0 ? 0 : Math.floor(R() * 4);
    if (chance(0.6)) inner += text();
    for (let i = 0; i < nkids; i++) inner += el(depth + 1);
    if (chance(0.05) && depth < maxDepth) inner = '<template shadowrootmode="' + pick(['open', 'closed']) + '">' + el(depth + 1) + '<slot></slot></template>' + inner;
    if (chance(0.03)) return s + inner; // unclosed
    return s + inner + '</' + tag + '>';
  }
  let head = '';
  if (chance(0.7)) head += '<title>' + pick(['Page', '', '  ', 'Untitled', 'Home', '__proto__', 'title'.repeat(100)]) + '</title>';
  if (chance(0.3)) head += '<meta name="viewport" content="' + pick(['width=device-width', 'user-scalable=no', 'maximum-scale=1.0', 'initial-scale=1']) + '">';
  if (chance(0.3)) head += '<style>' + pick(STYLES.map((x) => '.' + pick(PROTO) + '{' + x + '}')) + '</style>';
  let body = '';
  while (budget > 0) body += el(0);
  const doctype = chance(0.8) ? '<!DOCTYPE html>' : '';
  const htmlAttrs = chance(0.7) ? ' lang="' + pick(['en', '', 'xx', 'fr-CA', '__proto__', 'constructor', 'toString']) + '"' : '';
  if (chance(0.03)) return body; // fragment only
  return `${doctype}<html${htmlAttrs}><head>${head}</head><body>${body}</body></html>`;
}

// Mutate an existing HTML document textually.
function mutate(html, seed) {
  const R = rng(seed);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const ops = [
    (h) => h.replace(/id="([^"]*)"/, () => 'id="' + pick(PROTO) + '"'),
    (h) => h.replace(/class="([^"]*)"/g, (m, c) => (R() < 0.3 ? 'class="' + c + ' ' + pick(PROTO) + '"' : m)),
    (h) => h.replace(/role="([^"]*)"/g, (m) => (R() < 0.3 ? 'role="' + pick(PROTO.concat(ROLES)) + '"' : m)),
    (h) => h.replace(/aria-labelledby="([^"]*)"/g, () => 'aria-labelledby="' + pick(PROTO) + '"'),
    (h) => h.replace(/<\/([a-z]+)>/, ''), // drop a close tag
    (h) => { const i = Math.floor(R() * h.length); return h.slice(0, i) + h.slice(i + Math.floor(R() * 200)); },
    (h) => h.replace(/<body([^>]*)>/, (m) => m + '<div id="__proto__" class="constructor" role="toString" aria-label="valueOf">'.repeat(1 + Math.floor(R() * 3))),
    (h) => h.replace(/alt="([^"]*)"/g, () => 'alt="' + 'x'.repeat(Math.floor(R() * 100000)) + '"'),
    (h) => h.replace(/<button/g, '<button aria-label="{{label}}"'),
    (h) => h.replace(/<body([^>]*)>/, (m) => m + '<div>'.repeat(300) + 'deep' + '</div>'.repeat(300)),
    (h) => h.replace(/<\/body>/, '<iframe srcdoc="<button></button><img src=x>"></iframe><svg role="img"><title>t</title></svg><math><mi>x</mi></math></body>'),
    (h) => h.replace(/<\/body>/, '<div id="host"><template shadowrootmode="open"><button id="__proto__"></button><slot></slot><label for="constructor">L</label><input id="constructor"></template><span>slotted</span></div></body>'),
    (h) => h.replace(/lang="[^"]*"/, 'lang="' + pick(PROTO) + '"'),
    (h) => h.replace(/<(div|span|p)\b/g, (m) => (R() < 0.1 ? m + ' tabindex="0" onclick="x()"' : m)),
    (h) => h.replace(/style="/g, (m) => (R() < 0.3 ? m + 'color:#ccc;background:#ddd;' : m))
  ];
  let h = html;
  const n = 1 + Math.floor(R() * 4);
  for (let i = 0; i < n; i++) h = pick(ops)(h);
  return h;
}

module.exports = { make, mutate, rng, PROTO };
