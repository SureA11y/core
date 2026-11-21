const links = n => Array.from({length:n}, (_, i) => `<p style="margin:0;height:40px"><a href="#l${i}" id=l${i}>Link ${i}</a></p>`).join('');
const page = (hdr) => `<!doctype html><html lang=en><head><title>t</title><style>body{margin:0}</style></head><body>${hdr}<main>${links(60)}</main></body></html>`;
module.exports = [
 ['rgba .9 header', page('<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:rgba(0,51,102,.9)">Site</header>')],
 ['opacity .95 header', page('<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:#036;opacity:.95">Site</header>')],
 ['rgba .99 header', page('<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:rgba(0,51,102,.99)">Site</header>')],
];
