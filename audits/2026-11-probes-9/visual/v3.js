const LOW = 'style="color:#eee;font:16px Arial"';
module.exports = [
 ['canvas fallback', `<canvas width=100 height=50 style="background:#fff"><p id=t ${LOW}>Fallback text in canvas</p></canvas>`],
 ['video fallback', `<video width=100 height=50><p id=t ${LOW}>Your browser does not support video</p></video>`],
 ['object fallback with data image', `<object data="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22/%3E" type="image/svg+xml" width=50 height=50><p id=t ${LOW}>Fallback</p></object>`],
 ['slot fallback when assigned', `<div id=host><span>Assigned content</span></div><script>document.getElementById("host").attachShadow({mode:"open"}).innerHTML='<slot><p id=t ${LOW.replace(/"/g, "&quot;")}>Slot fallback text</p></slot>'</script>`],
 ['iframe inner text', `<iframe srcdoc="<p>hi</p>"><p id=t ${LOW}>iframe fallback</p></iframe>`],
 ['aria-hidden visible', `<p id=t aria-hidden=true ${LOW}>Aria hidden but visible</p>`],
 ['noscript', `<noscript><p id=t ${LOW}>Enable JS</p></noscript>`],
 ['audio no controls', `<audio><p id=t ${LOW}>Audio fallback</p></audio>`],
 ['picture/img alt broken', `<img id=t alt="Broken image alt text" src="data:image/png;base64,xxxx" ${LOW}>`],
 ['input type hidden value', `<input type=hidden value="Hidden" ${LOW}>`],
 ['svg title/desc', `<svg width=50 height=50 style="background:#fff"><title>Svg title</title><desc id=t>Svg desc text</desc><rect width=10 height=10 fill="#eee"/></svg>`],
 ['svg text in defs', `<svg width=50 height=50><defs><text id=t fill="#eee">Def text</text></defs></svg>`],
 ['svg text display none symbol', `<svg width=50 height=50><symbol id=s><text fill="#eee" y=20>Sym text</text></symbol></svg>`],
 ['math', `<math><mi ${LOW}>xyz</mi></math>`],
];
