const items = (n, mk) => Array.from({length:n}, (_, i) => `<p style="margin:0;height:40px">${mk(i)}</p>`).join('');
const page = (inner) => `<!doctype html><html lang=en><head><title>t</title><style>body{margin:0}</style></head><body><header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:#036">Site</header><main>${inner}</main></body></html>`;
module.exports = [
 ['tabindex -1 only', page(items(60, i => `<span tabindex=-1>Item ${i}</span>`))],
 ['disabled buttons only', page(items(60, i => `<button disabled>Item ${i}</button>`))],
 ['inert links', page(`<div inert>${items(60, i => `<a href=#>Item ${i}</a>`)}</div>`)],
 ['links without href', page(items(60, i => `<a>Item ${i}</a>`))],
 ['input hidden', page(items(60, i => `<input type=hidden value=${i}>x`))],
 ['visibility hidden links', page(items(60, i => `<a href=# style="visibility:hidden">Item ${i}</a>`))],
 ['radio group (one tab stop)', page(`<div>${items(60, i => `<label><input type=radio name=g>Opt ${i}</label>`)}</div>`)],
 ['contenteditable false', page(items(60, i => `<span contenteditable=false>Item ${i}</span>`))],
 ['iframe tabindex -1', page(items(20, i => `<iframe tabindex=-1 style="height:30px;width:100px;border:0" srcdoc="x"></iframe>`))],
];
