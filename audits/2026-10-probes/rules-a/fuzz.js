const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const OUTCOMES = new Set(['pass', 'fail', 'cantTell', 'notApplicable']);
const ARIA = ['aria-activedescendant','aria-atomic','aria-autocomplete','aria-busy','aria-checked','aria-colcount','aria-colindex','aria-colspan','aria-controls','aria-current','aria-describedby','aria-details','aria-disabled','aria-errormessage','aria-expanded','aria-flowto','aria-haspopup','aria-hidden','aria-invalid','aria-keyshortcuts','aria-label','aria-labelledby','aria-level','aria-live','aria-modal','aria-multiline','aria-multiselectable','aria-orientation','aria-owns','aria-placeholder','aria-posinset','aria-pressed','aria-readonly','aria-relevant','aria-required','aria-roledescription','aria-rowcount','aria-rowindex','aria-rowspan','aria-selected','aria-setsize','aria-sort','aria-valuemax','aria-valuemin','aria-valuenow','aria-valuetext','aria-braillelabel','aria-description','aria-foo'];
const ROLES = ['button','link','list','listitem','table','row','cell','grid','gridcell','tablist','tab','tabpanel','menu','menuitem','listbox','option','combobox','tree','treeitem','img','presentation','none','heading','dialog','region','navigation','main','banner','slider','checkbox','radio','radiogroup','textbox','searchbox','spinbutton','progressbar','meter','separator','toolbar','tooltip','feed','article','widget','foo','doc-chapter','graphics-symbol','group','rowgroup','columnheader','rowheader','scrollbar','switch','math','application','document','alert','log','status','marquee','timer','term','definition','directory'];
const GARB = ['', ' ', 'true', 'false', 'mixed', 'undefined', 'null', '-1', '0', '1e309', 'NaN', '\u0000', '<script>', 'x'.repeat(5000), 'a b c', '#id', 'id1 id1 id1', 'Ω', '\ud800', '{}', 'TRUE', '3.5', ' 2 '];
const TAGS = ['div','span','a','button','input','select','option','textarea','label','img','svg','table','tr','td','th','ul','ol','li','dl','dt','dd','h1','h2','h7','iframe','video','audio','canvas','object','embed','details','summary','dialog','form','fieldset','legend','nav','main','header','footer','section','article','aside','p','area','map','math','mi','template','slot','x-foo','select','optgroup','meter','progress','output','marquee','blink','font'];
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];

function check(name, r, doc, ms, timings) {
  const problems = [];
  for (const c of r.checksResults) {
    if (!OUTCOMES.has(c.outcome)) problems.push(`${c.ruleId}: outcome=${c.outcome}`);
    if (c.error) problems.push(`${c.ruleId}: error=${JSON.stringify(c.error).slice(0, 200)}`);
    if (c.outcome === 'fail' && !(c.occurrences || []).length) problems.push(`${c.ruleId}: fail w/o occurrences`);
    for (const o of c.occurrences || []) {
      if (!o.selector) { if (c.outcome === 'notApplicable' || c.outcome === 'pass') continue; problems.push(`${c.ruleId}: occurrence without selector`); continue; }
      let el = null; try { el = doc.querySelector(o.selector); } catch (e) { problems.push(`${c.ruleId}: bad selector ${o.selector.slice(0, 120)} (${e.message.slice(0, 60)})`); continue; }
      if (!el && !(o.selector.includes('>>>') )) problems.push(`${c.ruleId}: selector no match ${o.selector.slice(0, 160)}`);
    }
  }
  const slow = timings ? Object.entries(timings).filter(([, v]) => v > 1000).map(([k,v])=>[k,Math.round(v)]) : [];
  const top = timings ? Object.entries(timings).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+':'+Math.round(v)).join(' ') : '';
  console.log(`${name}: ${ms}ms [top ${top}] problems=${problems.length}${slow.length ? ' SLOW:' + JSON.stringify(slow).slice(0, 300) : ''}`);
  const uniq = [...new Set(problems)];
  for (const p of uniq.slice(0, 15)) console.log('   ', p);
}

function run(name, html, { contentType = 'text/html', mutate, eo = {} } = {}) {
  let dom;
  try { dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true, contentType }); } catch (e) { console.log(name, 'JSDOM parse error', e.message); return; }
  global.window = dom.window; global.document = dom.window.document;
  if (mutate) mutate(dom.window.document, dom.window);
  const engineOptions = Object.assign({ profileRules: true, perfStats: true }, eo);
  dom.window.__a11ycoreEngineOptions = engineOptions;
  const t = Date.now();
  let r;
  try { r = core.runDomRulesInPage('https://example.test/', null, engineOptions, null); } catch (e) { console.log(`${name}: THREW ${e && e.stack && e.stack.split('\n').slice(0, 4).join(' | ')}`); return; }
  const ms = Date.now() - t;
  const timings = (r.perfStats && r.perfStats.ruleTimings) || null;
  check(name, r, dom.window.document, ms, timings);
  return { r, ms, timings };
}
module.exports = { run, pick, rnd, ARIA, ROLES, GARB, TAGS };

if (require.main === module) {
  const which = process.argv[2] || 'all';
  const T = (n) => which === 'all' || which === n;
  if (T('garbage')) {
    let body = '';
    for (let i = 0; i < 1500; i++) {
      const tag = pick(TAGS);
      let attrs = ` id="${pick(['a','b','c','d','id1', 'x' + i])}" role="${pick(ROLES)} ${pick(ROLES)}"`;
      for (let k = 0; k < 6; k++) attrs += ` ${pick(ARIA)}="${pick(GARB).replace(/"/g, '&quot;').replace(/</g, '&lt;')}"`;
      if (rnd() < 0.3) attrs += ` tabindex="${pick(['-1','0','5','x',''])}"`;
      if (rnd() < 0.2) attrs += ` lang="${pick(['en','', 'zz-ZZ-', 'x', 'en_US'])}"`;
      if (rnd() < 0.2) attrs += ` style="${pick(['display:none','visibility:hidden','overflow:auto','position:absolute;left:-9999px','color:red;background:url(x)'])}"`;
      body += rnd() < 0.5 ? `<${tag}${attrs}>t${i}` : `<${tag}${attrs}>t${i}</${tag}>`;
    }
    run('garbage-1500', `<!doctype html><html lang=en><head><title>G</title></head><body>${body}</body></html>`);
  }
  if (T('nobody')) {
    run('no-head-no-body', '', { mutate: (d) => { d.documentElement.replaceChildren(); } });
    run('no-documentElement', '', { mutate: (d) => { d.removeChild(d.documentElement); } });
    run('docEl-replaced-div', '', { mutate: (d) => { const x = d.createElement('div'); x.innerHTML = '<img src=x><a href=/></a>'; d.replaceChild(x, d.documentElement); } });
    run('docEl-svg', '', { mutate: (d) => { const x = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); x.innerHTML = '<title>t</title><a href="/"><text>x</text></a>'; d.replaceChild(x, d.documentElement); } });
    run('frameset', '<!doctype html><html lang=en><head><title>F</title></head><frameset cols="50%,50%"><frame src="a.html"><frame src="b.html" title="B"></frameset></html>');
    run('xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en"><head><title>X</title></head><body><main><h1>X</h1><img src="x.png"/><a href="/"></a><svg xmlns="http://www.w3.org/2000/svg" role="img"><title>t</title></svg><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math></main></body></html>', { contentType: 'application/xhtml+xml' });
    run('svg-doc', '<svg xmlns="http://www.w3.org/2000/svg"><title>S</title><a href="/"><text>x</text></a><image href="x.png"/></svg>', { contentType: 'image/svg+xml' });
    run('xml-doc', '<root><img src="x"/><a href="/"/></root>', { contentType: 'application/xml' });
    run('template+detached', '<!doctype html><html lang=en><head><title>T</title></head><body><template><img src=x><a href=/></a></template><main><h1>x</h1></main></body></html>', { mutate: (d) => { const det = d.createElement('div'); det.innerHTML = '<img src=y>'; d.body.appendChild(det); d.body.removeChild(det); } });
    run('weird-ns', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1></main></body></html>', { mutate: (d) => { for (let i = 0; i < 50; i++) { const e = d.createElementNS('urn:x' + i, 'foo:bar' + i); e.setAttribute('role', 'button'); e.setAttribute('aria-label', ''); e.setAttribute('id', 'w"\'[]' + i); d.body.appendChild(e); const s = d.createElementNS('http://www.w3.org/2000/svg', 'g'); s.setAttribute('role', 'listitem'); s.setAttribute('tabindex', '0'); d.body.appendChild(s); const m = d.createElementNS('http://www.w3.org/1998/Math/MathML', 'mi'); m.setAttribute('href', '/'); d.body.appendChild(m); } } });
    run('odd-ids', '<!doctype html><html lang=en><head><title>T</title></head><body><main><h1>x</h1><img id="1" src=a><img id="a:b.c#d" src=a><img id="  " src=a><img id="\\" src=a><img class="x:y" src=a><label for="a b">L</label><input id="a b"><button id="--"></button><a href="/" id=" "></a><div id="ünï" role=img></div></main></body></html>');
    run('huge-attr', '', { mutate: (d) => { d.documentElement.setAttribute('lang', 'en'); d.title = 'x'; const m = d.createElement('main'); d.body.appendChild(m); for (let i = 0; i < 20; i++) { const b = d.createElement('button'); b.setAttribute('aria-label', 'x'.repeat(1e6)); b.setAttribute('aria-labelledby', Array.from({ length: 5000 }, (_, k) => 'id' + k).join(' ')); b.className = 'c '.repeat(10000); m.appendChild(b); } const img = d.createElement('img'); img.setAttribute('alt', 'y'.repeat(2e6)); m.appendChild(img); } });
    run('labelledby-chains', '', { mutate: (d) => { d.documentElement.setAttribute('lang', 'en'); d.title = 'x'; const m = d.createElement('main'); d.body.appendChild(m); for (let i = 0; i < 1000; i++) { const s = d.createElement('span'); s.id = 'l' + i; s.setAttribute('aria-labelledby', 'l' + (i + 1) + ' l' + Math.max(0, i - 1)); s.setAttribute('role', 'button'); s.textContent = 'w' + i; m.appendChild(s); } } });
    run('owns-cycles', '', { mutate: (d) => { d.documentElement.setAttribute('lang', 'en'); d.title = 'x'; const m = d.createElement('main'); d.body.appendChild(m); for (let i = 0; i < 500; i++) { const s = d.createElement('div'); s.id = 'o' + i; s.setAttribute('aria-owns', 'o' + ((i + 1) % 500) + ' o' + i); s.setAttribute('role', pick(['list','listbox','menu','tree','grid','row','tablist'])); m.appendChild(s); } } });
    run('shadow-nest', '', { mutate: (d) => { d.documentElement.setAttribute('lang', 'en'); d.title = 'x'; let host = d.body; for (let i = 0; i < 200; i++) { const h = d.createElement('div'); host.appendChild(h); const r = h.attachShadow({ mode: 'open' }); r.innerHTML = `<img src=x id=dup><a href=/ aria-labelledby=dup></a><slot></slot>`; host = r; } } });
  }
}
