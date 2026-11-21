const P = (css, body) => [`<!doctype html><html lang=en><head><title>t</title><style>${css}</style></head><body><main><p>Intro text</p>${body}</main></body></html>`];
const MENU = '<nav class=menu><a id=t href="#a">Menu item one</a> <a href="#b">Menu item two</a></nav>';
module.exports = [
 ['ancestor opacity 0', P('.menu{opacity:0}', MENU)],
 ['ancestor opacity 0 + focus-within shows', P('.menu{opacity:0} .menu:focus-within{opacity:1}', MENU)],
 ['ancestor clip-path inset 100%', P('.menu{clip-path:inset(100%)}', MENU)],
 ['ancestor max-height 0', P('.menu{max-height:0;overflow:hidden}', MENU)],
 ['ancestor scale 0', P('.menu{transform:scale(0)}', MENU)],
 ['ancestor scaleY 0', P('.menu{transform:scaleY(0)}', MENU)],
 ['ancestor fixed translateX -100%', P('.menu{position:fixed;left:0;top:0;width:250px;height:100%;transform:translateX(-100%)}', MENU)],
 ['ancestor fixed translateX 100% right', P('.menu{position:fixed;right:0;top:0;width:250px;height:100%;transform:translateX(100%)}', MENU)],
 ['ancestor fixed right:-300px', P('.menu{position:fixed;right:-300px;top:0;width:250px;height:100%}', MENU)],
 ['ancestor content-visibility hidden', P('.menu{content-visibility:hidden}', MENU)],
 ['own color transparent', P('#t{color:transparent}', MENU)],
 ['ancestor height 0 overflow clip', P('.menu{height:0;overflow:clip}', MENU)],
 ['ancestor behind another (z-index)', P('.wrap{position:relative} .menu{position:absolute;top:0;left:0;z-index:-1} .cover{position:relative;background:#fff;height:60px}', '<div class=wrap>' + MENU + '<div class=cover>cover</div></div>')],
 ['ancestor opacity 0.01', P('.menu{opacity:.01}', MENU)],
 ['ancestor filter opacity(0)', P('.menu{filter:opacity(0)}', MENU)],
 ['ancestor visibility hidden child visible', P('.menu{visibility:hidden} .menu a{visibility:visible}', MENU)],
 ['own scale(0)', P('#t{display:inline-block;transform:scale(0)}', MENU)],
 ['own width 0 overflow hidden inline-block', P('#t{display:inline-block;width:0;height:0;overflow:hidden}', MENU)],
];
