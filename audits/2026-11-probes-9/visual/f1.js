const links = n => Array.from({length:n}, (_, i) => `<p style="margin:0;height:40px"><a href="#l${i}" id=l${i}>Link ${i}</a></p>`).join('');
const page = (css, extra='', n=60) => `<!doctype html><html lang=en><head><title>t</title><style>body{margin:0}${css}</style></head><body>${extra}<main>${links(n)}</main></body></html>`;
const HDR = '<header id=t style="position:fixed;top:0;left:0;right:0;height:60px;background:#036;color:#fff">Site</header>';
module.exports = [
 ['fixed header baseline', page('', HDR)],
 ['scroll-padding on html', page('html{scroll-padding-top:60px}', HDR)],
 ['scroll-padding on body', page('body{scroll-padding-top:60px}', HDR)],
 ['scroll-margin on links', page('a{scroll-margin-top:60px}', HDR)],
 ['fixed in transformed ancestor', page('', '<div style="transform:translateZ(0)">' + HDR + '</div>')],
 ['fixed in filter ancestor', page('', '<div style="filter:blur(0)">' + HDR + '</div>')],
 ['fixed in will-change transform', page('', '<div style="will-change:transform">' + HDR + '</div>')],
 ['fixed contain paint ancestor', page('', '<div style="contain:paint">' + HDR + '</div>')],
 ['header opacity 0', page('', HDR.replace('height:60px', 'height:60px;opacity:0'))],
 ['header clip-path inset 100%', page('', HDR.replace('height:60px', 'height:60px;clip-path:inset(0 0 100% 0)'))],
 ['header translateY(-100%)', page('', HDR.replace('height:60px', 'height:60px;transform:translateY(-100%)'))],
 ['popover toast', page('', '<div id=t popover=manual style="inset:auto 0 0 auto;margin:0;width:300px;height:80px;background:#333;color:#fff;border:0">Saved</div>'), { before: p => p.evaluate(() => document.getElementById('t').showPopover()) }],
 ['backdrop-filter translucent', page('', HDR.replace('background:#036', 'background:rgba(255,255,255,.85);backdrop-filter:blur(10px)'))],
 ['vertical-rl page', page('html{writing-mode:vertical-rl}', HDR)],
];
