const { cases, close } = require('./multi');
(async () => {
await cases([
 ['svg text fill attr light', `<svg width="300" height="40"><text x="0" y="25" fill="#bbb" font-size="16">Chart label light</text></svg>`],
 ['svg text fill black on black rect', `<svg width="300" height="40"><rect width="300" height="40" fill="#000"/><text x="5" y="25" fill="#222" font-size="16">Dark on dark rect</text></svg>`],
 ['svg text white on black rect', `<svg width="300" height="40"><rect width="300" height="40" fill="#000"/><text x="5" y="25" fill="#fff" font-size="16">White on dark rect</text></svg>`],
 ['svg text color css but fill attr', `<svg width="300" height="40" style="color:#000"><text x="0" y="25" fill="#ccc" font-size="16">fill wins</text></svg>`],
 ['svg text fill-opacity', `<svg width="300" height="40"><text x="0" y="25" fill="#000" fill-opacity=".2" font-size="16">fill opacity</text></svg>`],
 ['svg text fill none stroke only', `<svg width="300" height="40"><text x="0" y="25" fill="none" stroke="#ccc" font-size="30">stroke only</text></svg>`],
 ['svg text fill url gradient', `<svg width="300" height="40"><defs><linearGradient id="g"><stop stop-color="#eee"/><stop offset="1" stop-color="#ddd"/></linearGradient></defs><text x="0" y="25" fill="url(#g)" font-size="16">gradient fill</text></svg>`],
 ['svg text fill currentColor', `<svg width="300" height="40" style="color:#ccc"><text x="0" y="25" fill="currentColor" font-size="16">current</text></svg>`],
 ['svg scaled viewBox', `<svg width="600" height="80" viewBox="0 0 300 40"><text x="0" y="25" fill="#949494" font-size="12">viewBox 2x large</text></svg>`],
], undefined);
await close();
})();
