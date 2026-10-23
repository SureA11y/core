const { run } = require('./fuzz.js');
const H = require('./harness');
function realistic(n) {
  // ~n elements: blocks of ~25 elements each
  let s = '<header><nav aria-label="Main"><ul>' + Array.from({ length: 10 }, (_, i) => `<li><a href="/n${i}">Nav ${i}</a></li>`).join('') + '</ul></nav></header><main><h1>Perf</h1>';
  const blocks = Math.ceil(n / 25);
  for (let i = 0; i < blocks; i++) {
    switch (i % 6) {
      case 0: s += `<section aria-labelledby="h${i}"><h2 id="h${i}">Sec ${i}</h2><p>Text <a href="/p${i}">link ${i}</a> <b>bold</b> <i>it</i></p><img src="i${i}.png" alt="${i % 12 ? 'Pic ' + i : ''}"><button><svg aria-hidden="true" viewBox="0 0 1 1"><path d="M0 0"/></svg> Act ${i}</button></section>`; break;
      case 1: s += `<form><label for="f${i}">Field ${i}</label><input id="f${i}" type="text" autocomplete="email"><label><input type="checkbox"> Opt</label><select aria-label="S${i}"><option>a</option><option>b</option></select><textarea aria-label="T${i}"></textarea></form>`; break;
      case 2: s += `<table><caption>T${i}</caption><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr></table>`; break;
      case 3: s += `<ul>${Array.from({ length: 6 }, (_, k) => `<li><a href="/l${i}-${k}" ${k === 0 ? 'aria-current="page"' : ''}>Item ${k}</a></li>`).join('')}</ul><div role="tablist" aria-label="tl${i}"><button role="tab" aria-selected="true" aria-controls="tp${i}">T</button></div><div role="tabpanel" id="tp${i}" aria-label="P">x</div>`; break;
      case 4: s += `<article><header><h3>Art ${i}</h3></header><p>${'Lorem ipsum '.repeat(5)}</p><footer><a href="/a${i}" aria-labelledby="ar${i} h${i - 4}"><span id="ar${i}">Read more</span></a></footer></article><div role="dialog" aria-label="d${i}" hidden><button>Close</button></div>`; break;
      default: s += `<div class="card"><div><div><span role="img" aria-label="star">*</span><div role="button" tabindex="0" aria-pressed="false">Like</div><a href="#t${i}" id="t${i}"><img src="x.png" alt=""></a></div></div></div>`;
    }
  }
  return `<!doctype html><html lang="en"><head><title>Perf page</title></head><body>${s}</main><footer><p>c</p></footer></body></html>`;
}
module.exports = { realistic };
if (require.main === module) {
  (async () => {
    const mode = process.argv[2];
    if (mode === 'jsdom') {
      for (const n of [2500, 5000, 10000, 20000]) {
        const html = realistic(n);
        const x = run(`realistic-${n}`, html);
        if (x && x.timings) console.log('   top10', Object.entries(x.timings).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ':' + Math.round(v)).join(' '));
      }
    }
    if (mode === 'siblings') {
      for (const n of [5000, 10000, 20000]) run(`siblings-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${'<span>a</span>'.repeat(n / 2)}${'<a href="/">l</a>'.repeat(n / 2)}</main></body></html>`);
      for (const n of [5000, 10000, 20000]) run(`li-siblings-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1><ul>${'<li>a</li>'.repeat(n)}</ul></main></body></html>`);
      for (const n of [5000, 10000, 20000]) run(`option-siblings-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1><label>x<select>${'<option>a</option>'.repeat(n)}</select></label></main></body></html>`);
      for (const n of [2000, 4000, 8000]) run(`table-rows-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1><table><tr><th>A</th><th>B</th><th>C</th></tr>${'<tr><td>1</td><td>2</td><td>3</td></tr>'.repeat(n)}</table></main></body></html>`);
      for (const n of [1000, 2000, 4000]) run(`ids-labels-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${Array.from({ length: n }, (_, i) => `<label for="i${i}">L${i}</label><input id="i${i}" aria-describedby="i${(i + 1) % n}">`).join('')}</main></body></html>`);
      for (const n of [1000, 2000, 4000]) run(`headings-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${Array.from({ length: n }, (_, i) => `<h${(i % 6) + 1}>H${i}</h${(i % 6) + 1}>`).join('')}</main></body></html>`);
      for (const n of [1000, 2000, 4000]) run(`landmarks-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${'<nav><a href="/">n</a></nav><aside>a</aside><section aria-label="s">x</section>'.repeat(n / 3)}</main></body></html>`);
      for (const n of [1000, 2000, 4000]) run(`iframes-${n}`, `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${Array.from({ length: n }, (_, i) => `<iframe srcdoc="" title="f${i % 50}"></iframe>`).join('')}</main></body></html>`);
    }
    if (mode === 'deep') {
      for (const d of [500, 1000, 2000, 5000]) {
        const html = `<!doctype html><html lang=en><head><title>D</title></head><body><main><h1>x</h1>${'<div>'.repeat(d)}<img src=x><a href="/"></a>${'</div>'.repeat(d)}</main></body></html>`;
        run(`deep-${d}`, html);
      }
      for (const d of [500, 1000, 2000]) {
        const html = `<!doctype html><html lang=en><head><title>D</title></head><body><main><h1>x</h1>${'<div role=list><div role=listitem>'.repeat(d / 2)}<a href="/">x</a>${'</div></div>'.repeat(d / 2)}</main></body></html>`;
        run(`deep-aria-${d}`, html);
      }
    }
    if (mode === 'chromium') {
      for (const n of [5000, 10000, 20000]) {
        const b = await H.runChromiumTimed({ html: realistic(n) });
        console.log(`chromium realistic-${n}: ${b.ms}ms top: ${b.top}`);
      }
      for (const d of [1000, 5000]) {
        const b = await H.runChromiumTimed({ html: `<!doctype html><html lang=en><head><title>D</title></head><body><main><h1>x</h1>${'<div>'.repeat(d)}<img src=x><a href="/"></a>${'</div>'.repeat(d)}</main></body></html>` });
        console.log(`chromium deep-${d}: ${b.ms}ms top: ${b.top} fails: ${b.fails}`);
      }
      const b = await H.runChromiumTimed({ html: `<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${'<span>a</span>'.repeat(10000)}${'<a href="/">l</a>'.repeat(10000)}</main></body></html>` });
      console.log(`chromium siblings-20000: ${b.ms}ms top: ${b.top}`);
      await H.close();
    }
  })();
}
