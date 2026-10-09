// DOM clobbering via [LegacyOverrideBuiltIns] (form controls override form
// properties; named img/form/embed/object/iframe override document's) and
// window named access. Each name is compared with the same page using
// 'z'+name, so only the clobbering differs.
const h = require('./harness');
const CONTENT = `<button></button><img src="q.png"><label>Ok <input></label><input aria-describedby="nope">
<a href="#"></a><div role="checkbox"></div><p aria-foo="1">x</p><h1>Head</h1>`;
const FORM_NAMES = ['parentNode','parentElement','nodeType','localName','tagName','nodeName','shadowRoot','children','childNodes','firstChild','firstElementChild','lastChild','nextSibling','nextElementSibling','previousSibling','ownerDocument','getRootNode','id','className','classList','style','hidden','elements','contains','matches','closest','getBoundingClientRect','getClientRects','isConnected','textContent','innerText','querySelector','querySelectorAll','role','ariaLabel','labels','namespaceURI','attributes','getAttribute','hasAttribute','assignedSlot','tabIndex','inert','title','lang','dir','dataset','checkVisibility','computedStyleMap','getAttributeNames','hasAttributes','isSameNode','compareDocumentPosition','outerHTML','innerHTML','cloneNode','length','item','namedItem','toString','valueOf','constructor','__proto__','then','name','action','method','offsetParent','offsetWidth','clientWidth','scrollWidth','scrollHeight','focus','blur','getAnimations','animate'];
const DOC_NAMES = ['documentElement','body','head','defaultView','activeElement','querySelector','querySelectorAll','getElementById','getElementsByTagName','createTreeWalker','createRange','elementFromPoint','elementsFromPoint','title','forms','images','links','styleSheets','scrollingElement','getRootNode','contains','createElement','compatMode','contentType','characterSet','URL','documentURI','baseURI','lang','dir','fonts','getAnimations','adoptedStyleSheets','visibilityState','hidden','readyState','doctype','childNodes','firstChild','firstElementChild','nodeType','ownerDocument','evaluate','getSelection','hasFocus','fullscreenElement','pictureInPictureElement','implementation','createElementNS','createTextNode','createNodeIterator','getElementsByClassName','getElementsByName','activeViewTransition','timeline','constructor','then'];
const WIN_IDS = ['a11ycore','__a11ycoreEngineOptions','__a11ycorePerfStatsSnapshot','__a11ycoreRuleTimingsSnapshot','__a11ycoreFrameResponder','a11yCore','__a11ycore'];
const mk = (extra) => `<!doctype html><html lang="en"><head><title>t</title></head><body>${extra}${CONTENT}</body></html>`;
(async () => {
  const which = process.argv[2] || 'all';
  const out = [];
  async function cmp(kind, name, html, htmlZ) {
    const a = await h.runChromium(html, {}, { timeoutMs: 20000 });
    const b = await h.runChromium(htmlZ, {}, { timeoutMs: 20000 });
    if (a.err || b.err) { out.push({ kind, name, status: a.hung ? 'HANG' : 'THROW', err: String(a.err || b.err).slice(0, 200), zErr: b.err ? String(b.err).slice(0, 80) : null }); console.log(JSON.stringify(out[out.length - 1])); return; }
    const sa = h.summarize(a.r), sb = h.summarize(b.r);
    const diffs = Object.keys(sb).filter((k) => sa[k] !== sb[k]).map((k) => `${k}: ${sb[k]} -> ${sa[k]}`);
    if (diffs.length) { out.push({ kind, name, status: 'DIFF', n: diffs.length, diffs: diffs.slice(0, 6) }); console.log(JSON.stringify(out[out.length - 1])); }
  }
  if (which === 'all' || which === 'form') for (const n of FORM_NAMES) await cmp('form-input', n, mk(`<form><input name="${n}"></form>`), mk(`<form><input name="z${n}"></form>`));
  if (which === 'all' || which === 'form-id') for (const n of FORM_NAMES) await cmp('form-input-id', n, mk(`<form><input id="${n}"></form>`), mk(`<form><input id="z${n}"></form>`));
  if (which === 'all' || which === 'doc') for (const n of DOC_NAMES) await cmp('img-name', n, mk(`<img name="${n}" alt="x">`), mk(`<img name="z${n}" alt="x">`));
  if (which === 'all' || which === 'docform') for (const n of DOC_NAMES) await cmp('form-name', n, mk(`<form name="${n}"></form>`), mk(`<form name="z${n}"></form>`));
  if (which === 'all' || which === 'win') for (const n of WIN_IDS) await cmp('win-id', n, mk(`<div id="${n}"></div>`), mk(`<div id="z${n}"></div>`));
  console.log('DONE', which, out.length, 'issues');
  await h.closeBrowser();
})();
