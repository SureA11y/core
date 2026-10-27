// Prototype-named page values where a table is indexed by a page value: compare each with a neutral value ("foo").
const { scan, sum } = require('./j.js');
const P = (b) => `<!doctype html><html lang="en"><head><title>Proto values</title></head><body><main><h1>Proto</h1>${b}</main></body></html>`;
const NAMES = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf', 'toLocaleString', '__defineGetter__', 'prototype'];
const T = {
  'input type': v => `<label>Name <input type="${v}" aria-expanded="true" aria-pressed="true" aria-checked="true"></label>`,
  'role': v => `<div role="${v}" aria-pressed="true" aria-checked="true" aria-level="2" tabindex="0">x<button>b</button></div>`,
  'aria-haspopup': v => `<button aria-haspopup="${v}" aria-controls="m" aria-expanded="false">Menu</button><ul id="m" hidden><li>a</li></ul>`,
  'element name': v => `<${v} aria-pressed="true" role="${'button'}">x</${v}><${v}><a href="#">x</a><button>y</button></${v}><ul><${v}>z</${v}><li>ok</li></ul>`,
  'bare element': v => `<${v}>x<a href="#">l</a></${v}>`,
  'aria-live': v => `<div aria-live="${v}" aria-hidden="true">Saved</div>`,
  'aria-current': v => `<a href="#" aria-current="${v}">x</a>`,
  'aria-invalid': v => `<input aria-label="e" aria-invalid="${v}" aria-errormessage="em"><span id="em" hidden>bad</span>`,
  'aria-expanded': v => `<button aria-expanded="${v}" aria-controls="m2">Menu</button><ul id="m2"><li>a</li></ul>`,
  'aria-sort': v => `<table><tr><th aria-sort="${v}">h</th></tr><tr><td>d</td></tr></table>`,
  'aria-autocomplete': v => `<input aria-label="q" aria-autocomplete="${v}">`,
  'aria-orientation': v => `<div role="slider" aria-label="s" tabindex="0" aria-valuenow="1" aria-orientation="${v}"></div>`,
  'autocomplete': v => `<label>Email <input autocomplete="${v}"></label><label>N <input autocomplete="section-${v} shipping ${v}"></label>`,
  'scope': v => `<table><tr><th scope="${v}">h</th><td>d</td></tr></table>`,
  'track kind': v => `<video controls src="v.mp4"><track kind="${v}" src="x.vtt" srclang="en"></video>`,
  'dir': v => `<p dir="${v}">x</p>`,
  'id+for': v => `<label for="${v}">Lbl</label><input id="${v}"><label for="${v}">Second</label>`,
  'id+owns': v => `<div role="list" aria-owns="${v}"></div><div role="list" aria-owns="${v}"></div><div role="listitem" id="${v}">i</div>`,
  'id+controls': v => `<button aria-expanded="true" aria-controls="${v}">t</button><div id="${v}" hidden>c</div>`,
  'id+activedescendant': v => `<div role="listbox" aria-label="l" aria-activedescendant="${v}"><div role="option" id="${v}">o</div></div>`,
  'id+headers': v => `<table><tr><th id="${v}">h</th></tr><tr><td headers="${v}">d</td></tr></table>`,
  'id dup': v => `<div id="${v}">a</div><div id="${v}">b</div><input aria-labelledby="${v}">`,
  'onclick': v => `<div role="button" tabindex="0" onclick="${v}()">go</div><a href="#" onfocus="${v}.blur()">x</a>`,
  'title-only': v => `<button title="${v}"><svg aria-hidden="true"></svg></button>`,
  'accesskey': v => `<button accesskey="${v}">a</button><button accesskey="${v}">b</button>`,
  'aria-keyshortcuts': v => `<button aria-keyshortcuts="${v}">a</button>`,
  'class (logo)': v => `<p class="${v}" style="color:#aaa;background:#fff">Brand</p>`,
  'name (radio group)': v => `<input type="radio" name="${v}" aria-label="a"><input type="radio" name="${v}" aria-label="b">`,
  'map name': v => `<map name="${v}"><area href="#" alt="" shape="rect" coords="0,0,1,1"></map><img usemap="#${v}" src="m.png" alt="m">`,
  'popovertarget': v => `<button popovertarget="${v}">Open</button><div id="${v}" popover>p</div>`,
  'slot name': v => `<x-host><span slot="${v}">s</span></x-host>`,
};
const strip = (s, v) => s.split(v).join('VAL').replace(/foo/g, 'VAL');
let bad = 0;
for (const [k, mk] of Object.entries(T)) {
  const base = scan(P(mk('foo')));
  const bs = strip(sum(base), 'foo');
  for (const v of NAMES) {
    let r; try { r = scan(P(mk(v))); } catch (e) { console.log(`${k}=${v}: SCAN THROWS ${e.message}`); bad++; continue; }
    const errs = r.checksResults.filter(c => c.error).map(c => c.ruleId + ': ' + String(c.error.message || c.error).slice(0, 100));
    const s = strip(sum(r), v);
    if (errs.length) { console.log(`${k}=${v}: ERR ${JSON.stringify(errs)}`); bad++; }
    if (s !== bs) {
      const a = bs.split('\n'), b = s.split('\n');
      const d = b.filter(x => !a.includes(x)), e = a.filter(x => !b.includes(x));
      console.log(`${k}=${v}: DIFFERS from "foo"\n   foo: ${e.join('\n        ')}\n   val: ${d.join('\n        ')}`); bad++;
    }
  }
}
console.log('done; differing cases', bad);
