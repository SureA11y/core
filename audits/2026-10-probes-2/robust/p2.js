const { scan, errs } = require('./h');
const cases = {
  empty: '',
  noHeadBody: '<p>hi</p>',
  frameset: '<!doctype html><html><frameset><frame src="a.html"><frame src="b.html" title="b"></frameset></html>',
  svgRoot: ['<svg xmlns="http://www.w3.org/2000/svg"><text>Hi</text><a href="#"><circle r="5"/></a></svg>', 'image/svg+xml'],
  xhtml: ['<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head><title>x</title></head><body><img src="a"/><a href="#">x</a><button></button></body></html>', 'application/xhtml+xml'],
  xmlNoHtml: ['<?xml version="1.0"?><root><item>hi</item></root>', 'application/xml'],
  foreignNs: ['<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><body><x:img xmlns:x="urn:x" src="a"/><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math></body></html>', 'application/xhtml+xml'],
  clobberForm: '<html lang="en"><body><form id="f" aria-label="x"><input name="id"><input name="attributes"><input name="children"><input name="nodeName"><input name="tagName"><input name="getAttribute"><input name="parentNode"><input name="localName"><input name="nodeType"><input name="style"><input name="hasAttribute"><input name="querySelectorAll"><input name="ownerDocument"><input name="textContent"><input name="firstChild"><input name="elements"><input name="action"><input name="method"><input name="className"><input name="classList"><input name="shadowRoot"><input name="getRootNode"><input name="matches"><input name="closest"><input name="contains"><input name="getBoundingClientRect"><input name="namespaceURI"><input name="length"><input name="name"><label>x<input name="labels"></label></form></body></html>',
  protoIds: '<html lang="en"><body><div id="__proto__">a</div><div id="constructor">b</div><div id="hasOwnProperty">c</div><div id="toString">d</div><label for="__proto__">x</label><input id="valueOf" aria-labelledby="constructor __proto__"><div aria-describedby="hasOwnProperty" id="x"></div><input id="constructor"></body></html>',
  windowClobber: '<html lang="en"><body><img id="getComputedStyle" alt=""><a id="Node" href="#">n</a><form name="document"></form><img name="Element" alt=""><div id="Array"></div><div id="Map"></div><div id="Set"></div><div id="JSON"></div><div id="Object"></div><div id="CSS"></div><div id="NodeFilter"></div><div id="HTMLElement"></div><div id="ShadowRoot"></div><div id="location"></div><div id="navigator"></div><embed name="getSelection"><img name="matchMedia" alt=""></body></html>',
  htmlRemoved: null,
};
for (const [k, v] of Object.entries(cases)) {
  let html = v, ct; if (Array.isArray(v)) [html, ct] = v;
  const before = k === 'htmlRemoved' ? (w) => { w.document.documentElement.remove(); } : undefined;
  for (const inPage of [false, true]) {
    const r = scan(html || '', { contentType: ct, before, inPage });
    console.log(k, inPage ? 'inPage' : 'node', r.err ? 'THROW ' + r.err.stack.split('\n').slice(0,4).join(' | ') : 'ok', r.ms + 'ms', errs(r.r).slice(0, 10));
  }
}
