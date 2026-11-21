const { cases, close } = require('./multi');
const R = ['css-orientation-lock'];
const page = (css) => `<style>${css}</style><main><h1>Title</h1><p>Lots of page content here for the reader.</p></main>`;
(async () => {
const L = [
 ['rotate 90deg body', page('@media (orientation:portrait){body{transform:rotate(90deg)}}')],
 ['rotate prop', page('@media (orientation:portrait){body{rotate:90deg}}')],
 ['0.25turn', page('@media (orientation:portrait){body{transform:rotate(0.25turn)}}')],
 ['rad', page('@media (orientation:portrait){body{transform:rotate(1.5708rad)}}')],
 ['matrix', page('@media (orientation:portrait){body{transform:matrix(0,1,-1,0,0,0)}}')],
 ['-90deg', page('@media (orientation:portrait){body{transform:rotate(-90deg)}}')],
 ['450deg', page('@media (orientation:portrait){body{transform:rotate(450deg)}}')],
 ['rotateZ', page('@media (orientation:portrait){body{transform:rotateZ(90deg)}}')],
 ['translate+rotate', page('@media (orientation:portrait){body{transform:translateX(100%) rotate(90deg)}}')],
 ['aspect-ratio query', page('@media (max-aspect-ratio:1/1){body{transform:rotate(90deg)}}')],
 ['rotate3d', page('@media (orientation:portrait){body{transform:rotate3d(0,0,1,90deg)}}')],
 ['nested in supports+layer', page('@layer a{@supports (display:grid){@media (orientation:portrait){body{transform:rotate(90deg)}}}}')],
 ['180deg (not lock)', page('@media (orientation:portrait){body{transform:rotate(180deg)}}')],
 ['not orientation landscape', page('@media not all and (orientation:landscape){body{transform:rotate(90deg)}}')],
];
console.log('--- portrait'); await cases(L, R, { viewport: { width: 400, height: 800 } });
console.log('--- landscape'); await cases(L.slice(0,2), R, { viewport: { width: 800, height: 400 } });
await close();
})();
