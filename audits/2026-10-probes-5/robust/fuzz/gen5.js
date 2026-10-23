'use strict';
// Seeded grammar-based random HTML generator (round 4's gen.js, extended in round 5 with
// constructs for the rules added since: aria-owns, label[for], widgets, aria-expanded/controls,
// aria-invalid/errormessage, inline onfocus/onclick, title-only names, live regions, moving content,
// grid tables, multiple labels, repeated labelledby ids, and prototype-named values).
// gen(seed) -> { html, shadows: [{sid, mode, html, nested:[...]}] }

function rng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    f: next,
    int: (n) => Math.floor(next() * n),
    pick: (a) => a[Math.floor(next() * a.length)],
    chance: (p) => next() < p
  };
  return r;
}

const ELEMENTS = (
  'a abbr address area article aside audio b bdi bdo blockquote br button canvas caption cite code col colgroup ' +
  'data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 ' +
  'header hgroup hr i iframe img input ins kbd label legend li main map mark menu meter nav noscript object ol optgroup ' +
  'option output p picture pre progress q rp rt ruby s samp search section select slot small source span strong sub summary sup ' +
  'table tbody td template textarea tfoot th thead time tr track u ul var video wbr marquee blink center font frame frameset ' +
  'applet acronym big tt image math svg x-foo my-widget fancy-btn'
).split(' ');
const VOID = new Set('area br col embed hr img input source track wbr image frame'.split(' '));

const ROLES = (
  'alert alertdialog application article banner blockquote button caption cell checkbox code columnheader combobox ' +
  'complementary contentinfo definition deletion dialog directory document emphasis feed figure form generic grid ' +
  'gridcell group heading img insertion link list listbox listitem log main marquee math menu menubar menuitem ' +
  'menuitemcheckbox menuitemradio meter navigation none note option paragraph presentation progressbar radio radiogroup ' +
  'region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status strong subscript ' +
  'superscript switch tab table tablist tabpanel term textbox time timer toolbar tooltip tree treegrid treeitem ' +
  'doc-abstract doc-noteref graphics-document graphics-symbol image ' +
  'foo BUTTON Button  x-role button\tlink 123 __proto__ constructor toString hasOwnProperty'
).split(' ');

const ARIA_ATTRS = (
  'activedescendant atomic autocomplete braillelabel brailleroledescription busy checked colcount colindex colindextext colspan ' +
  'controls current describedby description details disabled dropeffect errormessage expanded flowto grabbed haspopup ' +
  'hidden invalid keyshortcuts label labelledby labeledby level live modal multiline multiselectable orientation owns ' +
  'placeholder posinset pressed readonly relevant required roledescription rowcount rowindex rowindextext rowspan ' +
  'selected setsize sort valuemax valuemin valuenow valuetext foo __proto__ constructor'
).split(' ');
const IDREF_ATTRS = new Set(['activedescendant', 'controls', 'describedby', 'details', 'errormessage', 'flowto', 'labelledby', 'labeledby', 'owns']);

const ARIA_VALUES = [
  'true', 'false', 'mixed', 'undefined_', '', ' ', 'TRUE', '0', '1', '-1', '1e3', '9999999999999999999', '-0', '0x10', '3.5',
  'polite', 'assertive', 'off', 'page', 'step', 'location', 'date', 'time', 'menu', 'listbox', 'tree', 'grid', 'dialog',
  'ascending', 'none', 'other', 'horizontal', 'vertical', 'additions text', 'all', 'inline', 'list', 'both',
  'grammar', 'spelling', 'Ctrl+S', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'some label', '​', 'a'.repeat(300), 'é ü 日本', '<b>x</b>', '"\'', '{{x}}'
];

const LANGS = ['en', 'EN-us', 'fr', 'de-DE', 'ja', 'zh-Hant-TW', 'x-klingon', 'i-klingon', 'xx', '', ' ', 'en_US', '123', 'en-', '-en', 'qaa', 'und', 'art-lojban', 'sgn-BE-FR', 'en-a-bbb-x-a-ccc', 'tlh', 'é', 'ar', 'he', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'en-constructor', 'prototype'];

function weirdIds(r) {
  return [
    'a', 'b', 'c', 'lbl', 'x', 'main', 'id1', 'id2', '', ' ', '  a  ', '__proto__', 'constructor', 'toString',
    'hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', '__defineGetter__', 'prototype', '1abc', '#hash', 'a.b', 'a:b', 'a[b]', 'a"b', "a'b", 'a\\b', 'a b', 'a,b', 'a>b',
    'a{b}', '-', '--', '-1', 'é', '日本', '​', 'a\nb', 'a\tb', 'a/b', 'a*b', 'a~b', 'a+b', '@', '$', '😀',
    'x'.repeat(5000), 'null', 'NaN_'
  ];
}

const STYLES = [
  'display:none', 'visibility:hidden', 'visibility:collapse', 'opacity:0', 'color:red', 'color:#fff;background:#fff',
  'color:rgba(0,0,0,0.1)', 'background:url(x.png)', 'background-image:linear-gradient(red,blue)', 'color:transparent',
  'color:var(--x)', 'color:var(--x, #000)', 'font-size:larger', 'font-size:calc(1em + 2px)', 'font-size:0',
  'font-size:-5px', 'font-size:9999999px', 'font-size:xx-large;font-weight:bold', 'line-height:0 !important',
  'letter-spacing:0.01em !important', 'word-spacing:-1px !important', 'position:absolute;left:-9999px',
  'clip:rect(0 0 0 0)', 'clip-path:inset(50%)', 'width:0;height:0;overflow:hidden', 'transform:scale(0)',
  'color:oklch(0.5 0.2 30)', 'color:color(display-p3 1 0 0)', 'color:lab(50 20 30)', 'color:color-mix(in srgb, red, blue)',
  'background-color:hsl(0 0% 100% / 50%)', 'color:#12', 'color:rgb(300,-5,NaN)', 'color:', ';;;', 'color:red !important;color:blue',
  'content:"x"', 'text-shadow:0 0 2px #000', 'mix-blend-mode:difference', 'filter:invert(1)', 'white-space:nowrap',
  'overflow-x:auto', 'pointer-events:none', 'cursor:pointer', 'orientation:portrait', 'animation:spin 1s infinite',
  'color: currentColor', 'background: inherit', 'color: initial', 'all: unset', 'display:contents', 'display:inline-grid',
  'font: 12px/1 serif', 'color:\\72 ed', 'color:/*c*/red', 'z-index:9999999999999', 'text-indent:-9999px'
];

const TEXTS = ['Hello', 'Click here', 'more', 'Submit', '', ' ', ' ', 'Read more about cats', 'x', 'Name', 'Email *',
  '日本語のテキスト', 'Ünïcödé', '&amp;', '&lt;b&gt;', '0', 'NAN', 'object', '⠁⠃', 'http://example.com/a.png', 'image.jpg',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', '🙂', '‮ rtl', 'IMG_0001.JPG', 'Heading', 'Title'];

function escAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const NEW_SPECIALS = 15;
function gen(seed, opts = {}) {
  const r = rng(seed);
  const ids = weirdIds(r);
  const shadows = [];
  let sidCounter = 0;
  let nodeBudget = opts.nodeBudget || 60 + r.int(250);
  const maxDepth = opts.maxDepth || 3 + r.int(10);

  const pickId = () => (r.chance(0.8) ? r.pick(ids.slice(0, 8)) : r.pick(ids));
  const idrefList = () => {
    const n = 1 + r.int(3);
    const a = [];
    for (let i = 0; i < n; i++) a.push(pickId());
    return a.join(r.chance(0.1) ? '  \t' : ' ');
  };

  function attrs(tag) {
    const out = [];
    const add = (k, v) => out.push(v === null ? k : `${k}="${escAttr(v)}"`);
    const n = r.int(5);
    if (r.chance(0.4)) add('id', pickId());
    if (r.chance(0.25)) add('role', r.chance(0.15) ? `${r.pick(ROLES)} ${r.pick(ROLES)}` : r.pick(ROLES));
    for (let i = 0; i < n; i++) {
      const k = r.int(16);
      if (k < 6) {
        const a = r.pick(ARIA_ATTRS);
        add('aria-' + (r.chance(0.05) ? a.toUpperCase() : a), IDREF_ATTRS.has(a) ? idrefList() : r.pick(ARIA_VALUES));
      } else if (k === 6) add('tabindex', r.pick(['0', '-1', '1', '32768', 'x', '', ' 2', '-0', '1.5']));
      else if (k === 7) add('lang', r.pick(LANGS));
      else if (k === 8) add('style', r.pick(STYLES) + (r.chance(0.3) ? ';' + r.pick(STYLES) : ''));
      else if (k === 9) add(r.pick(['hidden', 'inert', 'disabled', 'readonly', 'required', 'open', 'autofocus', 'contenteditable', 'draggable', 'multiple', 'checked', 'selected', 'controls', 'autoplay', 'muted', 'loop']), r.chance(0.5) ? null : r.pick(['', 'false', 'until-found', 'true', 'plaintext-only']));
      else if (k === 10) add('alt', r.pick(TEXTS));
      else if (k === 11) add('title', r.pick(TEXTS));
      else if (k === 12) add('for', pickId());
      else if (k === 13) add('href', r.pick(['#', '#a', '#main', 'javascript:void(0)', 'https://x.test/', '', '#__proto__', '#%', 'mailto:a@b']));
      else if (k === 14) add('type', r.pick(['text', 'checkbox', 'radio', 'submit', 'image', 'hidden', 'button', 'reset', 'email', 'date', 'range', 'color', 'file', 'password', 'search', 'number', 'bogus', '']));
      else add(r.pick(['accesskey', 'autocomplete', 'headers', 'scope', 'colspan', 'rowspan', 'name', 'value', 'placeholder', 'src', 'srcdoc', 'popover', 'dir', 'xml:lang', 'class', 'data-testid', 'label', 'summary', 'abbr', 'kind', 'srclang', 'usemap', 'list', 'form', 'onclick', 'translate', 'slot']),
        r.pick(['a', 'b', 'x', 'row', 'col', 'rowgroup', '0', '-1', '65535', '2147483648', 'on', 'off', 'email', 'username', 'cc-number', 'section-a shipping email', 'bogus token', 'nickname webauthn', '__proto__', 'constructor', 'toString', 'hasOwnProperty', '#map', 'rtl', 'auto', 'en', 'abc', 'a b c', '<p>srcdoc</p>', 'manual', 'captions', 'subtitles']));
    }
    return out.length ? ' ' + out.join(' ') : '';
  }

  function text() {
    if (r.chance(0.02)) return 'word '.repeat(2000 + r.int(20000));
    return r.pick(TEXTS);
  }

  function table(depth) {
    let s = '<table' + attrs('table') + '>';
    if (r.chance(0.5)) s += '<caption>' + text() + '</caption>';
    const rows = 1 + r.int(5), cols = 1 + r.int(5);
    for (let i = 0; i < rows; i++) {
      s += '<tr' + attrs('tr') + '>';
      for (let j = 0; j < cols; j++) {
        const tag = r.chance(0.3) ? 'th' : 'td';
        let a = attrs(tag);
        if (r.chance(0.2)) a += ` colspan="${r.pick(['0', '-1', '1000', '999999', 'x', '2', '1.5'])}"`;
        if (r.chance(0.2)) a += ` rowspan="${r.pick(['0', '-1', '65535', '70000', 'x', '3'])}"`;
        if (r.chance(0.2)) a += ` headers="${escAttr(idrefList())}"`;
        if (r.chance(0.1)) a += ` scope="${r.pick(['row', 'col', 'rowgroup', 'colgroup', 'bogus', ''])}"`;
        s += `<${tag}${a}>${depth < maxDepth && r.chance(0.2) ? node(depth + 1) : text()}</${tag}>`;
      }
      s += '</tr>';
    }
    return s + '</table>';
  }

  function svg() {
    const kids = ['<title>' + text() + '</title>', '<desc>d</desc>', '<text x="0" y="10">' + text() + '</text>', '<g role="img"><circle r="5"/></g>', '<a href="#">' + text() + '</a>', '<foreignObject><div role="button">fo</div></foreignObject>', '<use href="#a"/>', '<image href="x.png"/>'];
    let s = `<svg${attrs('svg')}${r.chance(0.5) ? ' role="img"' : ''}>`;
    for (let i = r.int(4); i > 0; i--) s += r.pick(kids);
    return s + '</svg>';
  }
  function math() {
    return `<math${attrs('math')}><mi>x</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><semantics><annotation-xml encoding="text/html"><button></button></annotation-xml></semantics></math>`;
  }
  function form(depth) {
    let s = '<form' + attrs('form') + '>';
    for (let i = 1 + r.int(4); i > 0; i--) {
      const id = pickId();
      const kind = r.int(6);
      if (kind === 0) s += `<label for="${escAttr(id)}">${text()}</label><input id="${escAttr(id)}"${attrs('input')}>`;
      else if (kind === 1) s += `<label${attrs('label')}>${text()}<input${attrs('input')}><label>nested<input></label></label>`;
      else if (kind === 2) s += `<input aria-labelledby="${escAttr(idrefList())}" id="${escAttr(id)}"${attrs('input')}><span id="${escAttr(pickId())}" aria-labelledby="${escAttr(idrefList())}">${text()}</span>`;
      else if (kind === 3) s += `<select${attrs('select')}><optgroup label="g"><option>${text()}</option></optgroup><option${attrs('option')}></option></select>`;
      else if (kind === 4) s += `<fieldset${attrs('fieldset')}><legend>${text()}</legend><input type="radio" name="r"><input type="radio" name="r"></fieldset>`;
      else s += `<div role="listbox" aria-owns="${escAttr(idrefList())}" id="${escAttr(id)}" aria-activedescendant="${escAttr(pickId())}"><div role="option" aria-owns="${escAttr(id)}">${text()}</div></div>`;
      if (depth < maxDepth && r.chance(0.2)) s += node(depth + 1);
    }
    return s + '</form>';
  }

  function custom(depth) {
    const name = r.pick(['x-card', 'my-btn', 'fz-el', 'a-b-c']);
    const sid = sidCounter++;
    const mode = r.chance(0.7) ? 'open' : 'closed';
    const inner = children(Math.min(maxDepth, depth + 2), 1 + r.int(4), true);
    shadows.push({ sid, mode, html: inner, delegatesFocus: r.chance(0.2) });
    let light = r.chance(0.6) ? `<span slot="${r.pick(['', 'a', 'b'])}">${text()}</span>` : '';
    return `<${name} data-fzsid="${sid}"${attrs(name)}>${light}</${name}>`;
  }

  function special(depth) {
    const k = r.int(14 + NEW_SPECIALS);
    switch (k) {
      case 0: return table(depth);
      case 1: return svg();
      case 2: return math();
      case 3: return form(depth);
      case 4: return custom(depth);
      case 5: return `<dialog${attrs('dialog')}${r.chance(0.5) ? ' open' : ''}>${children(depth + 1, 2)}</dialog>`;
      case 6: return `<details${attrs('details')}${r.chance(0.5) ? ' open' : ''}><summary${attrs('summary')}>${text()}</summary>${children(depth + 1, 2)}</details>`;
      case 7: return `<iframe${attrs('iframe')} srcdoc="${escAttr('<html lang=xx><button></button><img src=y>')}"${r.chance(0.5) ? ' title="f"' : ''}></iframe>`;
      case 8: return `<template${r.chance(0.5) ? ' shadowrootmode="open"' : ''}>${children(depth + 1, 2)}</template>`;
      case 9: return `<map name="map"><area${attrs('area')} href="#" shape="rect" coords="0,0,1,1"></map><img usemap="#map"${attrs('img')}>`;
      case 10: return `<video${attrs('video')}><track kind="${r.pick(['captions', 'subtitles', 'bogus'])}" src="x.vtt"></video>`;
      case 11: return `<ul${attrs('ul')}>${'<li>a</li>'.repeat(r.int(3))}<div>bad</div><li${attrs('li')}>${text()}</li></ul>`;
      case 12: return `<div role="${r.pick(['tablist', 'menu', 'tree', 'grid', 'radiogroup', 'listbox', 'list', 'table', 'row'])}"${attrs('div')}>${children(depth + 1, 3)}</div>`;
      case 13: return `<a${attrs('a')}><img${attrs('img')}></a>`;
      default: return newSpecial(k - 14, depth);
    }
  }


  // ---- round 5 additions -------------------------------------------------
  function newSpecial(k, depth) {
    const id = pickId(), id2 = pickId(), id3 = pickId();
    const e = escAttr;
    switch (k) {
      case 0: // aria-owns, duplicates and ancestors
        return `<div role="${r.pick(['list', 'listbox', 'menu', 'tree', 'grid', 'group'])}" id="${e(id)}" aria-owns="${e(idrefList())}"${attrs('div')}><div role="${r.pick(['listitem', 'option', 'menuitem', 'treeitem', 'row'])}" id="${e(id2)}" aria-owns="${e(r.chance(0.3) ? id : idrefList())}">${text()}</div></div><div aria-owns="${e(id2 + ' ' + id3)}" role="${r.pick(['list', 'group', 'none'])}"><span id="${e(id3)}">${text()}</span></div>`;
      case 1: // label[for] valid/invalid targets, multiple labels, hidden labels, nested labels
        return `<label for="${e(id)}"${r.chance(0.3) ? ' hidden' : ''}${r.chance(0.2) ? ' aria-label="' + e(r.pick(TEXTS)) + '"' : ''}>${text()}</label><label for="${e(id)}"${r.chance(0.2) ? ' style="display:none"' : ''}>${text()}<label for="${e(id2)}">${text()}</label></label><${r.pick(['input', 'div', 'select', 'textarea', 'x-field', 'output', 'meter', 'button', 'span'])} id="${e(id)}"${attrs('input')}></${'x'}><input type="${r.pick(['hidden', 'text', 'checkbox'])}" id="${e(id2)}">`;
      case 2: // widgets with/without focus, activedescendant
        return `<${r.pick(['div', 'span', 'li', 'a', 'x-w'])} role="${r.pick(['button', 'link', 'checkbox', 'switch', 'radio', 'slider', 'spinbutton', 'textbox', 'searchbox', 'combobox', 'tab', 'menuitem', 'option', 'listbox', 'grid', 'tree', 'tablist', 'menu', 'radiogroup', 'toolbar'])}"${r.chance(0.5) ? ' tabindex="' + r.pick(['0', '-1', '', 'x']) + '"' : ''}${r.chance(0.3) ? ' aria-activedescendant="' + e(id2) + '"' : ''}${r.chance(0.2) ? ' aria-disabled="true"' : ''}${attrs('div')}>${r.chance(0.5) ? `<div role="option" id="${e(id2)}" tabindex="${r.pick(['0', '-1'])}">${text()}</div>` : text()}</${'x'}>`;
      case 3: // aria-expanded vs aria-controls
        return `<button aria-expanded="${r.pick(['true', 'false', 'TRUE', '', 'undefined', 'mixed'])}" aria-controls="${e(r.chance(0.7) ? id : idrefList())}"${attrs('button')}>${text()}</button><${r.pick(['ul', 'div', 'section', 'dialog', 'details'])} id="${e(id)}"${r.pick(['', ' hidden', ' style="display:none"', ' style="visibility:hidden"', ' aria-hidden="true"', ' inert', ' open'])}><li>${text()}</li></ul>`;
      case 4: // aria-invalid + error messages
        return `<input aria-label="${e(r.pick(TEXTS))}" aria-invalid="${r.pick(['true', 'false', 'grammar', 'spelling', '', 'TRUE', 'x'])}" aria-errormessage="${e(r.chance(0.7) ? id : idrefList())}"${r.chance(0.3) ? ' aria-describedby="' + e(id) + '"' : ''}${attrs('input')}><span id="${e(id)}"${r.pick(['', ' hidden', ' style="display:none"', ' aria-hidden="true"', ' aria-live="polite"', ' role="alert"'])}>${r.chance(0.3) ? '' : text()}</span>`;
      case 5: // inline handlers: onfocus blur, onclick on non-native
        return `<${r.pick(['a href="#"', 'button', 'div', 'span', 'input', 'div tabindex="0"', 'div role="button"', 'div role="button" tabindex="0"', 'span role="link" tabindex="0"', 'div role="checkbox" tabindex="0"', 'img src="x.png" alt="x"'])} ${r.pick(['onfocus', 'onclick', 'onkeydown', 'onkeyup', 'onmousedown', 'onfocusin'])}="${e(r.pick(['this.blur()', 'blur()', 'event.target.blur()', 'window.blur()', 'go()', 'if(event.key===\'Enter\')go()', '', ' ', 'this . blur ( )', '/*blur()*/', 'el.blur()', 'document.activeElement.blur()', '__proto__', 'constructor']))}"${r.chance(0.3) ? ' onkeydown="go()"' : ''}>${text()}</${'x'}>`;
      case 6: // title-only names
        return `<${r.pick(['button', 'a href="#"', 'div role="button" tabindex="0"', 'input type="submit" value=""', 'input type="image" src="x.png"'])} title="${e(r.pick(TEXTS))}"${r.chance(0.3) ? ' aria-label="' + e(r.pick(TEXTS)) + '"' : ''}>${r.pick(['', '<svg aria-hidden="true"></svg>', '<img src="i.png" alt="">', '<img src="i.png">', '<span class="icon"></span>', text()])}</${'x'}>`;
      case 7: // live regions
        return `<div ${r.pick(['aria-live="polite"', 'aria-live="assertive"', 'aria-live="off"', 'role="status"', 'role="log"', 'role="alert"', 'role="timer"', 'aria-live="__proto__"', 'aria-live="POLITE"'])}${r.pick(['', ' aria-hidden="true"', ' inert', ' hidden', ' style="display:none"', ' aria-atomic="true"', ' aria-relevant="additions text"', ' aria-busy="true"'])}>${r.chance(0.5) ? text() : ''}</div><output${attrs('output')}>${text()}</output>`;
      case 8: // moving content
        return `<style>@keyframes fz${id.length}{from{transform:translateX(0)}to{transform:translateX(100px)}}</style><div style="animation:fz${id.length} ${r.pick(['1s', '6s', '10s', '0s', '-1s', '1e9s'])} ${r.pick(['infinite', '1', '2', '0', 'paused', 'infinite alternate'])}">${text()}</div>${r.chance(0.3) ? '<marquee>' + text() + '</marquee>' : ''}${r.chance(0.2) ? '<blink>' + text() + '</blink>' : ''}`;
      case 9: { // grid tables with td/th roles
        const role = r.pick(['grid', 'treegrid', 'table', 'presentation', 'none', '']);
        let s = `<table${role ? ' role="' + role + '"' : ''}${attrs('table')}>`;
        for (let i = 0; i < 1 + r.int(3); i++) { s += '<tr>'; for (let j = 0; j < 1 + r.int(3); j++) s += `<${r.chance(0.3) ? 'th' : 'td'}${r.chance(0.3) ? ' aria-label="' + e(r.pick(TEXTS)) + '"' : ''}${r.chance(0.2) ? ' aria-selected="true"' : ''}${r.chance(0.2) ? ' aria-sort="ascending"' : ''}${r.chance(0.2) ? ' aria-expanded="false"' : ''}${r.chance(0.2) ? ' tabindex="-1"' : ''}>${text()}</td>`; s += '</tr>'; }
        return s + '</table>';
      }
      case 10: // repeated labelledby, self reference, deep label nesting
        return `<span id="${e(id)}">${text()}</span><${r.pick(['input', 'button', 'div role="button" tabindex="0"', 'div role="dialog"', 'img src="x.png"', 'svg role="img"'])} id="${e(id2)}" aria-labelledby="${e([id, id, id2, r.chance(0.5) ? id3 : id].join(' '))}"${r.chance(0.3) ? ' aria-describedby="' + e(id + ' ' + id) + '"' : ''}></${'x'}>`;
      case 11: // inputs with HTML-AAM conditional roles
        return `<input type="${r.pick(['text', 'search', 'email', 'tel', 'url', 'number', 'password', 'date', 'color', 'file', 'range'])}"${r.chance(0.5) ? ' list="' + e(id) + '"' : ''}${r.chance(0.4) ? ' aria-expanded="' + r.pick(['true', 'false']) + '"' : ''}${r.chance(0.3) ? ' aria-autocomplete="list"' : ''}${attrs('input')}><datalist id="${e(r.chance(0.7) ? id : id2)}"><option value="a"></datalist>`;
      case 12: // presentational headings and focusable none
        return `<h${1 + r.int(6)} role="${r.pick(['none', 'presentation', 'heading', 'button'])}"${r.chance(0.5) ? ' tabindex="0"' : ''}${r.chance(0.4) ? ' aria-describedby="' + e(id) + '"' : ''}>${text()}</h1>`;
      case 13: // hidden variants
        return `<${r.pick(['span', 'div', 'a href="#"', 'button', 'p'])} ${r.pick(['hidden="until-found"', 'hidden', 'hidden style="display:inline"', 'style="content-visibility:hidden"', 'style="content-visibility:auto"', 'popover', 'popover="manual"'])}>${text()}<a href="#">${text()}</a></${'x'}>`;
      default:
        return `<dialog aria-modal="${r.pick(['true', 'false'])}"${r.chance(0.5) ? ' open' : ''}>${children(depth + 1, 2)}</dialog>`;
    }
  }

  function node(depth) {
    if (nodeBudget-- <= 0 || depth >= maxDepth) return r.chance(0.7) ? text() : '';
    if (r.chance(0.25)) return special(depth);
    if (r.chance(0.2)) return text();
    const tag = r.pick(ELEMENTS);
    const a = attrs(tag);
    if (VOID.has(tag)) return `<${tag}${a}>`;
    return `<${tag}${a}>${children(depth + 1, r.int(4))}</${tag}>`;
  }
  function children(depth, n) {
    let s = '';
    for (let i = 0; i < n; i++) s += node(depth);
    return s;
  }

  let body = children(1, 3 + r.int(8));
  if (r.chance(0.05)) {
    // deep nesting
    const d = opts.deep || 50 + r.int(350);
    const tag = r.pick(['div', 'span', 'b', 'section', 'button', 'a']);
    body += `<${tag}>`.repeat(d) + text() + `</${tag}>`.repeat(d);
  }
  const lang = r.chance(0.7) ? ` lang="${escAttr(r.pick(LANGS))}"` : '';
  const xmlLang = r.chance(0.1) ? ` xml:lang="${escAttr(r.pick(LANGS))}"` : '';
  const title = r.chance(0.7) ? `<title>${r.pick(TEXTS)}</title>` : '';
  const meta = r.chance(0.2) ? r.pick(['<meta name="viewport" content="width=device-width, user-scalable=no">', '<meta name="viewport" content="maximum-scale=1.0">', '<meta http-equiv="refresh" content="5">', '<meta http-equiv="refresh" content="0; url=x">', '<meta name="viewport" content="initial-scale=NaN, maximum-scale=-1">']) : '';
  const css = r.chance(0.3) ? `<style>${r.pick(['*{color:#777;background:#888}', '@media (orientation:portrait){body{transform:rotate(90deg)}}', 'p::before{content:"x"}', 'a{outline:none}', ':focus{outline:0}', 'body{display:none}', '.x{color:var(--c)}', '@import url(x.css);', '}}}{{{', 'html{font-size:200%}'])}</style>` : '';
  const html = `<!doctype html><html${lang}${xmlLang}><head>${title}${meta}${css}</head><body${r.chance(0.05) ? ' aria-hidden="true"' : ''}>${body}</body></html>`;
  return { html, shadows };
}

// Attach shadow roots described by gen() to a JSDOM document (BFS, closed roots included).
function attachShadows(doc, shadows) {
  const bySid = new Map(shadows.map((s) => [String(s.sid), s]));
  const queue = [...doc.querySelectorAll('[data-fzsid]')];
  let guard = 0;
  while (queue.length && guard++ < 2000) {
    const host = queue.shift();
    const s = bySid.get(host.getAttribute('data-fzsid'));
    if (!s || host.__fzDone) continue;
    host.__fzDone = true;
    try {
      const root = host.attachShadow({ mode: s.mode, delegatesFocus: s.delegatesFocus });
      root.innerHTML = s.html + '<slot></slot><slot name="a"></slot>';
      queue.push(...root.querySelectorAll('[data-fzsid]'));
    } catch (e) {}
  }
}

module.exports = { gen, rng, attachShadows };
