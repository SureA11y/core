'use strict';
// Differential: every page built with a plain token "zzq" must scan the same as with a prototype name in its place.
const L = require('./lib.js');
console.warn = () => {};
const NAMES = ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', 'prototype', 'isPrototypeOf', '__defineGetter__', 'then', 'length', 'size', 'has', 'get', 'set', 'toJSON', 'propertyIsEnumerable', 'toLocaleString', '__lookupGetter__'];
const T = (n) => [
  `<html lang="en"><title>t</title><body><main><div id="${n}">a</div><div id="${n}">b</div><button aria-labelledby="${n}"></button></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><span id="${n}">Name</span><input aria-labelledby="${n}"><label for="${n}x">L</label><input id="${n}x"></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><table><tr><th id="${n}">H</th></tr><tr><td headers="${n}">c</td></tr></table></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><div role="${n}">x</div><input autocomplete="${n}"><p lang="${n}">bonjour</p></main></body></html>`,
  `<html lang="${n}"><title>t</title><body><main><a href="#" accesskey="${n}">a</a><a href="#x" accesskey="${n}">b</a></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><button class="${n}" aria-describedby="${n}">B</button><p id="${n}">desc</p><div aria-controls="${n}" aria-expanded="true" role="button" tabindex="0">t</div></main></body></html>`,
  `<html lang="en"><title>${n}</title><body><main><h1>${n}</h1><nav aria-label="${n}"></nav><nav aria-label="${n}"></nav><a href="/${n}">${n}</a><a href="/other">${n}</a><img alt="${n}" src="${n}.png"></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><input list="${n}"><datalist id="${n}"><option value="a"></datalist><form id="${n}f"></form><input form="${n}f" aria-errormessage="${n}" aria-invalid="true"></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><div role="listbox" aria-activedescendant="${n}" tabindex="0"><div role="option" id="${n}">o</div></div><div role="tree" aria-owns="${n}2"></div><div role="treeitem" id="${n}2">i</div></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><img src="a.png" usemap="#${n}"><map name="${n}"><area href="#" alt="" shape="rect" coords="0,0,1,1"></map><svg role="img" aria-labelledby="${n}"><title id="${n}">T</title></svg></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><x-${n.replace(/_/g, '') || 'q'}-el role="button" aria-label="${n}"></x-${n.replace(/_/g, '') || 'q'}-el><div style="--${n}: 1px">x</div><input type="${n}" aria-label="x"><button type="button" aria-haspopup="${n}">b</button></main></body></html>`,
  `<html lang="en"><title>t</title><body><main><a href="#${n}">Skip</a><div id="${n}" tabindex="-1">target</div><a href="#${n}">Skip</a><iframe title="${n}" src="/${n}"></iframe><iframe title="${n}" src="/b"></iframe></main></body></html>`
];
const norm = (r, n) => JSON.stringify(L.project(r).map((c) => ({ ...c, occ: c.occ.map((o) => o.map((s) => String(s).split(n).join('TOKEN'))) })));
let checked = 0, bad = 0;
for (const n of NAMES) {
  const plain = 'zzq';
  T(n).forEach((tpl, k) => {
    const a = L.scanJsdom(T(plain)[k]).r, b = L.scanJsdom(tpl).r;
    checked++;
    const A = JSON.parse(norm(a, plain)), B = JSON.parse(norm(b, n));
    for (let i = 0; i < A.length; i++) {
      if (JSON.stringify(A[i]) !== JSON.stringify(B[i])) {
        bad++;
        console.log(`[${n}] tpl#${k} ${A[i].ruleId}: plain ${A[i].outcome}/${A[i].occ.length} ${JSON.stringify(A[i].occ[0] || '').slice(0, 200)} | proto ${B[i].outcome}/${B[i].occ.length} ${JSON.stringify(B[i].occ[0] || '').slice(0, 200)} ${B[i].error || ''}`);
      }
    }
  });
}
console.log({ checked, bad });
