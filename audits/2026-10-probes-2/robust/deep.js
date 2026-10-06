const { scanHtml, close } = require('./pw');
const base = '<!doctype html><html lang="en"><head><title>Deep</title></head><body><main id="m"><h1>Deep</h1></main></body></html>';
const setups = {
  deep5000: () => { let n = document.getElementById('m'); for (let i = 0; i < 5000; i++) { const d = document.createElement(i % 2 ? 'div' : 'span'); n.appendChild(d); n = d; } n.innerHTML = '<img src=x><a href="#"></a><button></button><input>'; },
  deep20000: () => { let n = document.getElementById('m'); for (let i = 0; i < 20000; i++) { const d = document.createElement('div'); n.appendChild(d); n = d; } n.innerHTML = '<img src=x><a href="#"></a><button></button><input>text'; },
  deepShadow200: () => { let n = document.getElementById('m'); for (let i = 0; i < 200; i++) { const d = document.createElement('div'); n.appendChild(d); n = d.attachShadow({ mode: 'open' }); } n.innerHTML = '<img src=x><a href="#"></a><button></button><input>'; },
  manyShadow5000: () => { const m = document.getElementById('m'); for (let i = 0; i < 5000; i++) { const d = document.createElement('div'); m.appendChild(d); d.attachShadow({ mode: 'open' }).innerHTML = '<button>b</button><slot></slot>'; } },
  deepList: () => { let n = document.getElementById('m'); for (let i = 0; i < 3000; i++) { const ul = document.createElement('ul'); const li = document.createElement('li'); ul.appendChild(li); n.appendChild(ul); n = li; } n.textContent = 'leaf'; },
  deepTable: () => { let n = document.getElementById('m'); for (let i = 0; i < 500; i++) { const t = document.createElement('table'); t.innerHTML = '<tr><th>h</th><td></td></tr>'; n.appendChild(t); n = t.querySelector('td'); } },
  deepLabel: () => { let n = document.getElementById('m'); for (let i = 0; i < 3000; i++) { const d = document.createElement('label'); n.appendChild(d); n = d; } n.innerHTML = '<input>'; },
  deepLabelledby: () => { const m = document.getElementById('m'); for (let i = 0; i < 5000; i++) { const s = document.createElement('span'); s.id = 'l' + i; s.setAttribute('aria-labelledby', 'l' + (i + 1)); s.textContent = 'x'; m.appendChild(s); } const b = document.createElement('button'); b.setAttribute('aria-labelledby', 'l0'); m.appendChild(b); },
  ownsCycle: () => { const m = document.getElementById('m'); m.insertAdjacentHTML('beforeend', '<div role="list" id="a" aria-owns="b"><div role="listitem" id="b" aria-owns="a">x</div></div><div role="tree" aria-owns="t1"><div id="t1" role="treeitem" aria-owns="t2"></div><div id="t2" role="group" aria-owns="t1"></div></div>'); },
  deepMenus: () => { let n = document.getElementById('m'); for (let i = 0; i < 2000; i++) { const d = document.createElement('div'); d.setAttribute('role', i % 2 ? 'menu' : 'menuitem'); d.setAttribute('aria-label', 'm'); n.appendChild(d); n = d; } },
  hugeAttr: () => { const m = document.getElementById('m'); const big = 'x'.repeat(5e6); m.insertAdjacentHTML('beforeend', '<img src="a.png" alt="' + big + '"><a href="/' + big + '">' + big + '</a><div class="' + 'c '.repeat(1e5) + '" aria-label="' + big + '" role="button" tabindex=0></div><input aria-describedby="' + Array.from({length: 1e5}, (_, i) => 'x' + i).join(' ') + '">'); },
  hugeText: () => { const m = document.getElementById('m'); const p = document.createElement('p'); p.textContent = 'word '.repeat(4e6); m.appendChild(p); const h = document.createElement('h2'); h.textContent = 'H '.repeat(1e6); m.appendChild(h); },
  manyTextNodes: () => { const p = document.createElement('p'); for (let i = 0; i < 100000; i++) p.appendChild(document.createTextNode('w ')); document.getElementById('m').appendChild(p); },
  iframes200: () => { const m = document.getElementById('m'); for (let i = 0; i < 200; i++) { const f = document.createElement('iframe'); f.srcdoc = '<button></button><img src=x>'; m.appendChild(f); } },
  noBody: () => { document.body.remove(); },
  htmlReplaced: () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); document.replaceChild(s, document.documentElement); },
  htmlRemoved: () => { document.documentElement.remove(); },
  frameset: () => { document.body.remove(); const fs = document.createElement('frameset'); fs.innerHTML = '<frame src="about:blank"><frame src="about:blank" title="t">'; document.documentElement.appendChild(fs); },
  twoBodies: () => { const b2 = document.createElement('body'); b2.innerHTML = '<img src=x>'; document.documentElement.appendChild(b2); },
  slotsMany: () => { const h = document.createElement('div'); document.getElementById('m').appendChild(h); const sr = h.attachShadow({ mode: 'open' }); sr.innerHTML = Array.from({ length: 2000 }, (_, i) => `<slot name="s${i}"></slot>`).join(''); for (let i = 0; i < 2000; i++) { const b = document.createElement('button'); b.slot = 's' + i; h.appendChild(b); } },
  customThrowCtor: () => { customElements.define('x-bad', class extends HTMLElement { connectedCallback() { throw new Error('cc'); } get shadowRoot() { throw new Error('sr'); } }); document.getElementById('m').insertAdjacentHTML('beforeend', '<x-bad><button></button></x-bad><img src="q">'); },
  styleThrows: () => { const el = document.createElement('x-sty'); Object.defineProperty(el, 'style', { get() { throw new Error('st'); } }); document.getElementById('m').append(el, Object.assign(document.createElement('img'), {src:'q'})); },
};
(async () => {
  for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(setups)) {
    const t = Date.now();
    let o;
    try { o = await Promise.race([scanHtml(base, { setup: setups[name] }), new Promise(r => setTimeout(() => r({ hang: true }), 120000))]); } catch (e) { console.log(name, 'HARNESS', String(e).slice(0, 200)); continue; }
    if (o.hang) { console.log(name, 'HANG >120s'); continue; }
    if (o.err) { console.log(name, 'THROW', o.err.slice(0, 300)); continue; }
    const errs = o.r.checksResults.filter(c => c.error).map(c => c.ruleId + '!' + String(c.error).slice(0, 100));
    const fails = o.r.checksResults.filter(c => c.outcome === 'fail').map(c => c.ruleId + ':' + c.occurrences.length);
    console.log(name, (Date.now() - t) + 'ms', 'errs=' + errs.length, errs.slice(0, 5).join(' ; '), '| fails:', fails.join(' '));
  }
  await close();
})();
