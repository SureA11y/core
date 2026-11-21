const links = n => Array.from({length:n}, (_, i) => `<p style="margin:0;height:40px"><a href="#l${i}" id=l${i}>Link ${i}</a></p>`).join('');
const page = (css, extra='', n=60) => `<!doctype html><html lang=en><head><title>t</title><style>body{margin:0}${css}</style></head><body>${extra}<main>${links(n)}</main></body></html>`;
module.exports = [
 ['popover toast full width bottom', page('', '<div id=t popover=manual style="inset:auto 0 0 0;margin:0;width:100%;height:80px;background:#333;color:#fff;border:0">Saved</div>'), { before: p => p.evaluate(() => document.getElementById('t').showPopover()) }],
 ['non-modal dialog fixed bottom', page('', '<dialog id=t open style="position:fixed;inset:auto 0 0 0;margin:0;width:100%;max-width:none;height:80px;background:#333;color:#fff;border:0">Cookie</dialog>')],
 ['scroll-padding 40 vs header 60', page('html{scroll-padding-top:40px}', '<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:#036">Site</header>')],
 ['header with only img child (transparent bg)', page('', '<header id=t style="position:fixed;top:0;left:0;right:0;height:60px"><img alt=logo style="display:block;width:100%;height:60px" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22%3E%3Crect width=%2210%22 height=%2210%22 fill=%22navy%22/%3E%3C/svg%3E"></header>')],
 ['header bg via ::before', page('.h::before{content:"";position:absolute;inset:0;background:#036}', '<header id=t class=h style="position:fixed;top:0;left:0;right:0;height:60px">Site</header>')],
 ['header bg via box-shadow inset', page('', '<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;box-shadow:inset 0 0 0 100px #036">Site</header>')],
 ['header bg via backdrop-filter only', page('', '<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;backdrop-filter:blur(8px)">Site</header>')],
 ['header bg gradient', page('', '<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:linear-gradient(#036,#036)">Site</header>')],
];
