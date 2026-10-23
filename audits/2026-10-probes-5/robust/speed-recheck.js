// FZ-3 (p-as-heading depth) and FZ-6 (long values) rechecks, plus close cousins.
const { curve, page } = require('./sp.js');
const which = process.argv[2] || 'all';
if (which === 'all' || which === 'fz3') {
  curve('FZ-3 div-depth p-as-heading', n => page('<div>'.repeat(n) + 'x' + '</div>'.repeat(n)), [100, 400, 800, 1600], ['p-as-heading']);
  curve('div-depth full scan', n => page('<div>'.repeat(n) + 'x' + '</div>'.repeat(n)), [200, 400, 800], null);
  curve('span-depth full', n => page('<p>' + '<span>'.repeat(n) + 'x' + '</span>'.repeat(n) + '</p>'), [200, 400, 800], null);
  curve('section-depth full', n => page('<section><h2>h</h2>'.repeat(n) + 'x' + '</section>'.repeat(n)), [200, 400, 800], null);
  curve('label-depth full', n => page('<label>'.repeat(1) + '<span>'.repeat(n) + 'Name' + '</span>'.repeat(n) + '<input></label>'), [200, 400, 800], null);
  curve('role=group depth full', n => page('<div role="group" aria-label="g">'.repeat(n) + '<button>x</button>' + '</div>'.repeat(n)), [200, 400, 800], null);
  curve('list depth full', n => page('<ul><li>'.repeat(n) + 'x' + '</li></ul>'.repeat(n)), [200, 400, 800], null);
}
if (which === 'all' || which === 'fz6') {
  const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const cases = {
    'autocomplete spaces': n => page(`<input aria-label="n" autocomplete="${'a' + ' '.repeat(n) + '!'}">`),
    'title long': n => page('<p>x</p>').replace('Speed page', 'word '.repeat(n / 5)),
    'title sep': n => page('<p>x</p>').replace('Speed page', 'a | '.repeat(n / 4) + 'x'),
    'alt digits': n => page(`<img src=a.png alt="IMG_${'1'.repeat(n)}.jpgx">`),
    'alt dots': n => page(`<img src=a.png alt="a${'.'.repeat(n)}x">`),
    'heading dots': n => page(`<h2>a${'.'.repeat(n)}x</h2>`),
    'label dots': n => page(`<label for=i>a${'.'.repeat(n)}x</label><input id=i>`),
    'link dots': n => page(`<a href=/x>a${'.'.repeat(n)}x</a>`),
    'button title-only': n => page(`<button title="${'a '.repeat(n / 2)}x"></button>`),
    'onclick long': n => page(`<div role=button tabindex=0 onclick="${'a();'.repeat(n / 4)}x(">go</div>`),
    'onfocus long': n => page(`<a href=/ onfocus="${' '.repeat(n)}this . blur ${' '.repeat(n)}(">go</a>`),
    'onfocus blur spaces': n => page(`<a href=/ onfocus="${'this.blur;'.repeat(n / 10)}">go</a>`),
    'errormessage ids': n => page(`<input aria-label=n aria-invalid=true aria-errormessage="${'x '.repeat(n / 2)}">`),
    'aria-owns ids': n => page(`<div role=list aria-owns="${'x '.repeat(n / 2)}"></div>`),
    'aria-controls ids': n => page(`<button aria-expanded=false aria-controls="${'x '.repeat(n / 2)}">go</button>`),
    'labelledby same id': n => page(`<span id=x>Phone</span><input aria-labelledby="${'x '.repeat(n / 2)}">`),
    'aria-label spaces': n => page(`<button aria-label="${'a' + ' '.repeat(n) + '!'}">Go</button>`),
    'label-in-name long': n => page(`<button aria-label="${'Go '.repeat(n / 3)}x">${'Go '.repeat(n / 3)}</button>`),
    'lang long': n => page(`<p lang="${'en-' + 'a'.repeat(n)}">x</p>`),
    'lang subtags': n => page(`<p lang="${'en' + '-abcdefgh'.repeat(n / 9)}">x</p>`),
    'aria-keyshortcuts': n => page(`<button aria-keyshortcuts="${'Control+'.repeat(n / 8)}">x</button>`),
    'roledescription': n => page(`<button aria-roledescription="${'a ' .repeat(n/2)}">x</button>`),
    'style anim': n => page(`<p style="animation: ${'a 1s infinite, '.repeat(n / 16)}b 1s">x</p>`),
    'class long': n => page(`<p class="${'logo-'.repeat(n / 5)}x" style="color:#aaa;background:#fff">Brand</p>`),
    'id long logo': n => page(`<p id="${'brand'.repeat(n / 5)}!" style="color:#aaa;background:#fff">Brand</p>`),
    'aria-live text': n => page(`<div aria-live=polite>${'word '.repeat(n / 5)}</div>`),
    'placeholder spaces': n => page(`<input placeholder="${'a' + ' '.repeat(n) + '!'}">`),
    'href long': n => page(`<a href="#${'a'.repeat(n)}">go</a><a href="javascript:${' '.repeat(n)}void(0)">x</a>`),
    'srcset': n => page(`<img alt=x srcset="${'a.png 1x, '.repeat(n / 10)}">`),
    'aria-valuetext': n => page(`<div role=slider tabindex=0 aria-label=v aria-valuenow=5 aria-valuetext="${'a '.repeat(n/2)}">x</div>`),
  };
  for (const [k, mk] of Object.entries(cases)) {
    const rows = curve(k, mk, [20000, 80000], null, { top: 3 });
    const a = rows[0], b = rows[1];
    const fl = [];
    for (const [r, v] of b.tops) { const x = (a.tops.find(t => t[0] === r) || [r, 1])[1]; if (v > 300 && v / Math.max(x, 1) > 8) fl.push(`${r} ${x.toFixed(0)}->${v.toFixed(0)}`); }
    if (fl.length) console.log('  SUPERLINEAR', k, fl.join(' '));
  }
}
