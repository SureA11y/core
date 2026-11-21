const M = (css, extra='') => [`<!doctype html><html lang=en><head><title>t</title><style>${css}</style>${extra}</head><body><main id=main><h1>Title</h1><p>${'Lots of page content here. '.repeat(20)}</p></main></body></html>`];
const C = (name, css, extra) => [name, ...M(css, extra)];
module.exports = [
 C('baseline rotate(90deg)', '@media (orientation: portrait){ main{transform:rotate(90deg)} }'),
 C('rotate property', '@media (orientation: portrait){ main{rotate:90deg} }'),
 C('0.25turn', '@media (orientation: portrait){ main{transform:rotate(0.25turn)} }'),
 C('100grad', '@media (orientation: portrait){ main{transform:rotate(100grad)} }'),
 C('1.5708rad', '@media (orientation: portrait){ main{transform:rotate(1.5708rad)} }'),
 C('matrix', '@media (orientation: portrait){ main{transform:matrix(0,1,-1,0,0,0)} }'),
 C('rotateZ', '@media (orientation: portrait){ main{transform:rotateZ(90deg)} }'),
 C('rotate3d', '@media (orientation: portrait){ main{transform:rotate3d(0,0,1,90deg)} }'),
 C('translate+rotate', '@media (orientation: portrait){ main{transform:translate(-50%,-50%) rotate(-90deg)} }'),
 C('two rotates 45+45', '@media (orientation: portrait){ main{transform:rotate(45deg) rotate(45deg)} }'),
 C('in @layer', '@layer base { @media (orientation: portrait){ main{transform:rotate(90deg)} } }'),
 C('in @supports', '@supports (transform: rotate(1deg)) { @media (orientation: portrait){ main{transform:rotate(90deg)} } }'),
 C('nested css', 'main { @media (orientation: portrait){ transform:rotate(90deg) } }'),
 C('style media attr', '', '<style media="(orientation: portrait)">main{transform:rotate(90deg)}</style>'),
 C('aspect-ratio query', '@media (max-aspect-ratio: 1/1){ main{transform:rotate(90deg)} }'),
 C('not landscape', '@media not all and (orientation: landscape){ main{transform:rotate(90deg)} }'),
 C('landscape on body var', ':root{--r:90deg} @media (orientation: landscape){ body{transform:rotate(var(--r))} }'),
 C('html rotate', '@media (orientation: portrait){ html{transform:rotate(90deg)} }'),
 C('range syntax', '@media (width < height){ main{transform:rotate(90deg)} }'),
 C('import media', '', '<style>@import url("data:text/css,main{transform:rotate(90deg)}") (orientation: portrait);</style>'),
];
