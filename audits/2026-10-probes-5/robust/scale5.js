// Scale curves under jsdom for the rules new since round 4 and the reworked name computation.
// node scale5.js [case-filter]  ; prints per-N totals and the top rules, and flags growth above ~N^1.5.
const { curve, page } = require('./sp.js');
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const C = {
  'many labels for one input': n => page(rep(n, i => `<label for="f">Part ${i}</label>`) + '<input id="f">'),
  'labelledby same id repeated': n => page(`<span id="x">Phone</span><input aria-labelledby="${'x '.repeat(n)}"><button aria-labelledby="${'x '.repeat(n)}"></button>`),
  'labelledby n distinct ids': n => page(rep(n, i => `<span id="l${i}">w${i}</span>`) + `<input aria-labelledby="${rep(n, i => 'l' + i + ' ')}">`),
  'labelledby chain depth n': n => page(rep(n, i => `<span id="c${i}" aria-labelledby="c${i + 1}">t${i}</span>`) + `<span id="c${n}">end</span><input aria-labelledby="c0">`),
  'n inputs each labelled by all n spans': n => page(rep(Math.sqrt(n) | 0, i => `<span id="s${i}">w${i}</span>`) + rep(Math.sqrt(n) | 0, () => `<input aria-labelledby="${rep(Math.sqrt(n) | 0, i => 's' + i + ' ')}">`)),
  'n inputs, each with 2 labels': n => page(rep(n, i => `<label for="i${i}">A${i}</label><label for="i${i}">B${i}</label><input id="i${i}">`)),
  'deep label nesting': n => page('<label>' + '<span>'.repeat(n) + 'Name' + '</span>'.repeat(n) + '<input></label>'),
  'n lists owning their item': n => page(rep(n, i => `<div role="list" aria-owns="it${i}"></div>`) + rep(n, i => `<div role="listitem" id="it${i}">x</div>`)),
  'one list owning n items': n => page(`<div role="list" aria-owns="${rep(n, i => 'it' + i + ' ')}"></div>` + rep(n, i => `<div role="listitem" id="it${i}">x</div>`)),
  'n owners of one element': n => page(rep(n, () => `<div role="list" aria-owns="it"></div>`) + `<div role="listitem" id="it">x</div>`),
  'owns ancestors chain': n => page(rep(n, i => `<div role="group" id="g${i}" aria-owns="g0">`) + 'x' + '</div>'.repeat(n)),
  'n buttons controlling own panel': n => page(rep(n, i => `<button aria-expanded="${i % 2 ? 'true' : 'false'}" aria-controls="p${i}">B${i}</button><div id="p${i}"${i % 3 ? ' hidden' : ''}>P</div>`)),
  'n buttons controlling one panel': n => page(rep(n, i => `<button aria-expanded="false" aria-controls="p">B${i}</button>`) + '<div id="p">P</div>'),
  'one button controlling n panels': n => page(`<button aria-expanded="true" aria-controls="${rep(n, i => 'p' + i + ' ')}">B</button>` + rep(n, i => `<div id="p${i}" hidden>P</div>`)),
  'grid table n cells': n => { const s = Math.sqrt(n) | 0; return page(`<table role="grid" aria-label="g">` + rep(s, r => '<tr>' + rep(s, c => `<td aria-selected="false" tabindex="-1">${r},${c}</td>`) + '</tr>') + '</table>'); },
  'treegrid n cells with headers': n => { const s = Math.sqrt(n) | 0; return page(`<table role="treegrid" aria-label="g"><tr>${rep(s, c => `<th id="h${c}">H${c}</th>`)}</tr>` + rep(s, r => `<tr aria-level="1" aria-expanded="false">` + rep(s, c => `<td headers="h${c}" aria-label="c${c}">${r}</td>`) + '</tr>') + '</table>'); },
  'n invalid fields with messages': n => page(rep(n, i => `<label for="f${i}">F${i}</label><input id="f${i}" aria-invalid="true" aria-errormessage="e${i}" aria-describedby="e${i}"><span id="e${i}"${i % 2 ? ' hidden' : ''}>Error ${i}</span>`)),
  'n role=button divs no tabindex': n => page(rep(n, i => `<div role="button">B${i}</div>`)),
  'listbox n options + activedescendant': n => page(`<div role="listbox" aria-label="L" aria-activedescendant="o${n - 1}">` + rep(n, i => `<div role="option" id="o${i}">O${i}</div>`) + '</div>'),
  'n onclick divs': n => page(rep(n, i => `<div role="button" tabindex="0" onclick="go(${i})">B${i}</div>`)),
  'n onclick nested in one handler': n => page(`<div onkeydown="k()">` + rep(n, i => `<span onclick="go(${i})">S${i}</span>`) + '</div>'),
  'n onfocus blur': n => page(rep(n, i => `<a href="#${i}" onfocus="this.blur()">L${i}</a>`)),
  'n title-only buttons': n => page(rep(n, i => `<button title="Close ${i}"><svg aria-hidden="true"></svg></button>`)),
  'n labels for missing ids': n => page(rep(n, i => `<label for="missing${i}">L${i}</label>`)),
  'live log n entries': n => page(`<div role="log" aria-live="polite">` + rep(n, i => `<p>Message ${i}</p>`) + '</div>'),
  'n live regions': n => page(rep(n, i => `<div aria-live="polite"${i % 2 ? ' aria-hidden="true"' : ''}>S${i}</div>`)),
  'n marquees': n => page(rep(n, i => `<marquee>M${i}</marquee>`)),
};
const only = process.argv[2];
const NS = (process.argv[3] || '250,1000,4000').split(',').map(Number);
for (const [k, mk] of Object.entries(C)) {
  if (only && !k.includes(only)) continue;
  const rows = curve(k, mk, NS, null, { top: 3 });
  const a = rows[0], z = rows[rows.length - 1]; const f = z.n / a.n;
  for (const [r, v] of z.tops) { const x = (a.tops.find(t => t[0] === r) || [r, 1])[1]; if (v > 300 && v / Math.max(x, 1) > Math.pow(f, 1.5)) console.log('  SUPERLINEAR', k, r, `${x.toFixed(0)}ms@${a.n} -> ${v.toFixed(0)}ms@${z.n}`); }
  if (z.tot > 2 * f * a.tot && z.tot > 2000) console.log('  TOTAL SUPERLINEAR', k, `${a.tot.toFixed(0)} -> ${z.tot.toFixed(0)}`);
}
