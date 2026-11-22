const { four, page, close } = require('./h.js');
const ids = ['contrast-minimum','contrast-computable'];
const S=(inner, a='width="300" height="100"')=>`<svg ${a} role="img" aria-label="chart">${inner}</svg>`;
const cases = [
 ['dark rect, white text inside', S('<rect x="0" y="0" width="200" height="60" fill="#222"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['light rect, light text (should fail)', S('<rect x="0" y="0" width="200" height="60" fill="#eee"/><text x="10" y="40" fill="#aaa" font-size="20">Sales</text>')],
 ['badge circle, white text centred', S('<circle cx="50" cy="50" r="40" fill="#1a7f37"/><text x="50" y="57" text-anchor="middle" fill="#fff" font-size="20">12</text>')],
 ['text anchor middle via CSS on <g>', `<style>.lbl{text-anchor:middle}</style>`+S('<rect x="100" y="0" width="120" height="60" fill="#222"/><g class="lbl"><text x="110" y="40" fill="#fff" font-size="20">AB</text></g>')],
 ['dominant-baseline hanging via CSS', `<style>text{dominant-baseline:hanging}</style>`+S('<rect x="0" y="0" width="200" height="30" fill="#222"/><text x="10" y="22" fill="#fff" font-size="20">Sales</text>')],
 ['font-size on <g> via CSS (text bigger than 16)', `<style>.big{font-size:40px}</style>`+S('<rect x="0" y="0" width="140" height="60" fill="#222"/><g class="big"><text x="5" y="45" fill="#fff">Sales</text></g>')],
 ['font-size 2.5em on text style', S('<rect x="0" y="0" width="140" height="60" fill="#222"/><text x="5" y="45" fill="#fff" style="font-size:2.5em">Sales</text>')],
 ['font shorthand on text style', S('<rect x="0" y="0" width="140" height="60" fill="#222"/><text x="5" y="45" fill="#fff" style="font:bold 40px sans-serif">Sales</text>')],
 ['fill-opacity via stylesheet on rect', `<style>.bg{fill-opacity:.15}</style>`+S('<rect class="bg" x="0" y="0" width="300" height="100" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['opacity via stylesheet on rect', `<style>.bg{opacity:.15}</style>`+S('<rect class="bg" x="0" y="0" width="300" height="100" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect transform via stylesheet', `<style>.bg{transform:translateX(250px)}</style>`+S('<rect class="bg" x="0" y="0" width="200" height="60" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect visibility hidden attr', S('<rect visibility="hidden" x="0" y="0" width="300" height="100" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect display none via CSS', `<style>.bg{display:none}</style>`+S('<rect class="bg" x="0" y="0" width="300" height="100" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect geometry via CSS (SVG2 width)', `<style>.bg{width:20px}</style>`+S('<rect class="bg" x="0" y="0" width="300" height="100" fill="#000"/><text x="100" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['whole-svg rect 100%, text', S('<rect width="100%" height="100%" fill="#333"/><text x="10" y="40" fill="#777" font-size="20">Sales</text>')],
 ['CJK label 1em/char', S('<rect x="0" y="0" width="100" height="60" fill="#222"/><text x="2" y="40" fill="#fff" font-size="20">売上高</text>')],
 ['long Latin label fits visually but not at 1em/char', S('<rect x="0" y="0" width="130" height="40" fill="#222"/><text x="4" y="27" fill="#fff" font-size="16">Revenue 2026</text>')],
 ['rtl text direction attr', S('<rect x="0" y="0" width="300" height="60" fill="#222"/><text x="290" y="40" direction="rtl" fill="#fff" font-size="20">מכירות</text>')],
 ['rect with rx, text in corner', S('<rect x="0" y="0" width="100" height="40" rx="20" fill="#222"/><text x="2" y="28" fill="#fff" font-size="16">Hi</text>')],
 ['rect in <a> with rect under, white text', S('<a href="/x"><rect x="0" y="0" width="200" height="60" fill="#222"/></a><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect inside <symbol>/<defs> ignored', S('<defs><rect id="r" x="0" y="0" width="300" height="100" fill="#000"/></defs><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect then later partial path over text area', S('<rect x="0" y="0" width="300" height="100" fill="#222"/><path d="M0 0h50v50z" fill="#fff"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['rect fill via presentational fill + CSS fill override', `<style>.bg{fill:#f4f4f4}</style>`+S('<rect class="bg" x="0" y="0" width="300" height="100" fill="#000"/><text x="10" y="40" fill="#fff" font-size="20">Sales</text>')],
 ['text fill via currentColor, rect dark', S('<rect x="0" y="0" width="300" height="100" fill="#222"/><text x="10" y="40" fill="currentColor" font-size="20">Sales</text>','width="300" height="100" style="color:#555"')],
 ['viewBox scaled svg, text coords in user units', S('<rect x="0" y="0" width="50" height="20" fill="#222"/><text x="2" y="14" fill="#fff" font-size="10">Ok</text>','viewBox="0 0 100 40" width="300" height="120"')],
 ['tspan with own x (rejected→asked)', S('<rect x="0" y="0" width="300" height="100" fill="#222"/><text x="10" y="40" fill="#fff" font-size="20"><tspan x="10">A</tspan><tspan x="10" dy="20">B</tspan></text>')],
 ['text font-size attr smaller than CSS rule on text', `<style>text{font-size:48px}</style>`+S('<rect x="0" y="0" width="120" height="60" fill="#222"/><text x="2" y="45" fill="#fff" font-size="10">Sales</text>')],
];
(async () => { for (const [l, b] of cases) await four(l, page(b), ids); await close(); })();
