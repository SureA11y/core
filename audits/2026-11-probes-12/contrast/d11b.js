const { four, page, close } = require('./h.js');
const ids = ['contrast-minimum','contrast-computable'];
const S=(inner, a='width="300" height="100"')=>`<svg ${a} role="img" aria-label="chart">${inner}</svg>`;
const cases = [
 ['anchor middle via CSS on <g> (start-guess fits)', `<style>.lbl{text-anchor:middle}</style>`+S('<rect x="100" y="0" width="200" height="60" fill="#222"/><g class="lbl"><text x="110" y="40" fill="#fff" font-size="20">ABCDEFGH</text></g>')],
 ['anchor middle via CSS on text itself', `<style>.lbl{text-anchor:middle}</style>`+S('<rect x="100" y="0" width="200" height="60" fill="#222"/><text class="lbl" x="110" y="40" fill="#fff" font-size="20">ABCDEFGH</text>')],
 ['dominant-baseline hanging via CSS (bottom tight)', `<style>text{dominant-baseline:hanging}</style>`+S('<rect x="0" y="0" width="300" height="35" fill="#222"/><text x="10" y="25" fill="#fff" font-size="20">Sales</text>')],
 ['font-size via CSS on <g>, 16px guess fits', `<style>.big{font-size:40px}</style>`+S('<rect x="0" y="0" width="140" height="60" fill="#222"/><g class="big"><text x="60" y="45" fill="#fff">Sales</text></g>')],
 ['font-size via CSS on <svg> root', `<style>svg{font-size:40px}</style>`+S('<rect x="0" y="0" width="140" height="60" fill="#222"/><text x="60" y="45" fill="#fff">Sales</text>')],
 ['font-size inherited from HTML parent', `<div style="font-size:40px">`+S('<rect x="0" y="0" width="140" height="60" fill="#222"/><text x="60" y="45" fill="#fff">Sales</text>')+'</div>'],
 ['rect display="none" attr', S('<rect display="none" x="0" y="0" width="300" height="100" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect visibility via CSS class', `<style>.h{visibility:hidden}</style>`+S('<rect class="h" x="0" y="0" width="200" height="60" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect fill="none" + stroke huge', S('<rect x="0" y="0" width="200" height="60" fill="none" stroke="#000" stroke-width="2"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect fill-opacity attr 0.1', S('<rect x="0" y="0" width="200" height="60" fill="#000" fill-opacity="0.1"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect fill rgba alpha', S('<rect x="0" y="0" width="200" height="60" fill="rgba(0,0,0,.1)"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect fill url(#grad) fallback', S('<defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect x="0" y="0" width="200" height="60" fill="url(#g) #000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['ellipse badge', S('<ellipse cx="60" cy="30" rx="58" ry="28" fill="#b00"/><text x="60" y="36" text-anchor="middle" fill="#fff" font-size="16">New</text>')],
 ['text with letter-spacing CSS on <g>', `<style>.ls{letter-spacing:20px}</style>`+S('<rect x="0" y="0" width="140" height="60" fill="#222"/><g class="ls"><text x="5" y="40" fill="#fff" font-size="16">Sales</text></g>')],
 ['svg inside shadow root (jsdom only DSD)', '<div><template shadowrootmode="open">'+S('<rect x="0" y="0" width="200" height="60" fill="#222"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')+'</template></div>'],
 ['emoji/wide glyph labels @@@', S('<rect x="0" y="0" width="64" height="40" fill="#222"/><text x="2" y="28" fill="#fff" font-size="20">@@@</text>')],
];
(async () => { for (const [l, b] of cases) await four(l, page(b), ids); await close(); })();
