// Cases with an expected outcome; prints both runtimes, marks mismatches with !!
const { js, cr, rule, brief, page, close } = require('./h.js');
const C = [
 // [label, rule, body, expected outcome(s) list, head]
 ['meta refresh 0 redirect via http-equiv case', 'meta-refresh-no-exceptions', '', ['pass','notApplicable'], '<meta http-equiv="REFRESH" content="0; URL=/new">'],
 ['meta refresh 5;url', 'meta-refresh-timing-absent', '', ['fail'], '<meta http-equiv="refresh" content="5;url=/x">'],
 ['meta refresh 72001 (over 20h)', 'meta-refresh-timing-absent', '', ['pass','notApplicable'], '<meta http-equiv="refresh" content="72001">'],
 ['meta refresh "5.5"', 'meta-refresh-timing-absent', '', ['fail'], '<meta http-equiv="refresh" content="5.5; url=/x">'],
 ['meta refresh ",url" invalid', 'meta-refresh-timing-absent', '', ['notApplicable','pass'], '<meta http-equiv="refresh" content="; url=/x">'],
 ['viewport user-scalable=0', 'meta-viewport-zoom-enabled', '', ['fail'], '<meta name="viewport" content="width=device-width, user-scalable=0">'],
 ['viewport user-scalable=yes max 1.0', 'meta-viewport-zoom-enabled', '', ['fail'], '<meta name="viewport" content="width=device-width,maximum-scale=1.0">'],
 ['viewport max 2 (decimals)', 'meta-viewport-zoom-enabled', '', ['pass','fail'], '<meta name="viewport" content="maximum-scale=2.0">'],
 ['viewport semicolon separator', 'meta-viewport-zoom-enabled', '', ['fail'], '<meta name="viewport" content="width=device-width; user-scalable=no">'],
 ['viewport max-scale=-1', 'meta-viewport-zoom-enabled', '', ['pass','notApplicable'], '<meta name="viewport" content="maximum-scale=-1">'],
 ['viewport max yes', 'meta-viewport-zoom-enabled', '', ['pass','notApplicable'], '<meta name="viewport" content="maximum-scale=yes">'],
 ['lang "en-US"', 'valid-lang', '<p lang="en-US">x</p>', ['pass'], ''],
 ['lang "EN_us"', 'valid-lang', '<p lang="EN_us">x</p>', ['fail','cantTell'], ''],
 ['lang "i-klingon" grandfathered', 'valid-lang', '<p lang="i-klingon">Qapla</p>', ['pass','cantTell','fail'], ''],
 ['lang "zh-yue"', 'valid-lang', '<p lang="zh-yue">x</p>', ['pass'], ''],
 ['lang "es-419"', 'valid-lang', '<p lang="es-419">x</p>', ['pass'], ''],
 ['lang "sgn-BE-FR"', 'valid-lang', '<p lang="sgn-BE-FR">x</p>', ['pass','cantTell'], ''],
 ['lang "en-GB-oed"', 'valid-lang', '<p lang="en-GB-oed">x</p>', ['pass','cantTell'], ''],
 ['lang "xx" unknown 2 letter', 'valid-lang', '<p lang="xx">x</p>', ['fail'], ''],
 ['lang "qaa" private range', 'valid-lang', '<p lang="qaa">x</p>', ['pass'], ''],
 ['xml:lang only on p', 'valid-lang', '<p xml:lang="zz">x</p>', ['notApplicable','pass'], ''],
 ['html-xml-lang mismatch en vs en-US', 'html-xml-lang-mismatch', '', ['pass'], ''],
 ['dl with template/script', 'definition-list-children-valid', '<dl><script></script><template></template><dt>a</dt><dd>b</dd></dl>', ['pass'], ''],
 ['dl with div wrapping dt dd + empty div', 'definition-list-children-valid', '<dl><div><dt>a</dt><dd>b</dd></div><div></div></dl>', ['fail'], ''],
 ['dl dd before dt', 'definition-list-children-valid', '<dl><dd>b</dd><dt>a</dt></dl>', ['pass','fail'], ''],
 ['ul with li and comment & whitespace', 'list-children-valid', '<ul> <!--c--> <li>a</li> </ul>', ['pass'], ''],
 ['ul with text node', 'list-children-valid', '<ul>stray<li>a</li></ul>', ['fail'], ''],
 ['ol with li role=presentation? ', 'list-children-valid', '<ol><li role="none">a</li></ol>', ['fail','pass'], ''],
 ['menu element', 'list-children-valid', '<menu><li><button>Cut</button></li></menu>', ['pass'], ''],
 ['ul display:none child div', 'list-children-valid', '<ul><li>a</li><div hidden>x</div></ul>', ['pass','fail'], ''],
 ['th headers td', 'table-headers-attr-valid', '<table><tr><th id=h>H</th></tr><tr><td headers="h  ">1</td></tr></table>', ['pass'], ''],
 ['td headers points to td', 'table-headers-attr-valid', '<table><tr><td id=h>H</td></tr><tr><td headers="h">1</td></tr></table>', ['pass','fail'], ''],
 ['td headers to other table', 'table-headers-attr-valid', '<table><tr><th id=h>H</th></tr></table><table><tr><td headers="h">1</td></tr></table>', ['fail'], ''],
 ['iframe title whitespace', 'iframe-name-present', '<iframe title=" " srcdoc="x"></iframe>', ['fail'], ''],
 ['iframe tabindex -1 with name none', 'iframe-name-present', '<iframe tabindex="-1" srcdoc="x"></iframe>', ['fail'], ''],
 ['iframe display none', 'iframe-name-present', '<iframe style="display:none" srcdoc="x"></iframe>', ['notApplicable'], ''],
 ['frame aria-hidden', 'iframe-name-present', '<iframe aria-hidden="true" srcdoc="x"></iframe>', ['notApplicable'], ''],
 ['img alt from aria-labelledby missing', 'img-alt-present', '<img src="x.png" aria-labelledby="nope">', ['fail'], ''],
 ['img role=presentation no alt', 'img-alt-present', '<img src="x.png" role="presentation">', ['pass','notApplicable'], ''],
 ['img role=none + aria-label (conflict) no alt', 'img-alt-present', '<img src="x.png" role="none" aria-label="Logo">', ['pass','notApplicable'], ''],
 ['img role=none tabindex 0 no alt', 'img-alt-present', '<img src="x.png" role="none" tabindex="0">', ['fail'], ''],
 ['img in picture no alt', 'img-alt-present', '<picture><source srcset="a.webp"><img src="a.png"></picture>', ['fail'], ''],
 ['img alt=" " (space)', 'img-alt-present', '<img src="x.png" alt=" ">', ['pass','fail','cantTell'], ''],
 ['img title only', 'img-alt-present', '<img src="x.png" title="Logo">', ['pass'], ''],
 ['img hidden via width 0 no alt', 'img-alt-present', '<img src="x.png" width="0" height="0">', ['fail','notApplicable'], ''],
 ['input image alt empty', 'input-image-alt-present', '<input type="image" src="go.png" alt="">', ['fail'], ''],
 ['input image value only', 'input-image-alt-present', '<input type="image" src="go.png" value="Go">', ['fail','pass'], ''],
 ['area no href no alt', 'area-alt-present', '<img src=m.png usemap="#m" alt="Map"><map name="m"><area shape="rect" coords="0,0,5,5"></map>', ['notApplicable','pass'], ''],
 ['area usemap case-insensitive name', 'area-alt-present', '<img src=m.png usemap="#MAP" alt="Map"><map name="map"><area href="/" shape="rect" coords="0,0,5,5"></map>', ['notApplicable','fail'], ''],
 ['area in map used by no img', 'area-alt-present', '<map name="m"><area href="/" shape="rect" coords="0,0,5,5"></map>', ['notApplicable'], ''],
 ['object img with aria-label', 'object-text-alternative-present', '<object data="a.png" type="image/png" aria-label="Chart"></object>', ['pass'], ''],
 ['object img with fallback text', 'object-text-alternative-present', '<object data="a.png" type="image/png">Sales chart</object>', ['pass','fail'], ''],
 ['canvas fallback text', 'canvas-text-alternative-present', '<canvas width=10 height=10>Chart of sales</canvas>', ['pass','cantTell'], ''],
 ['canvas fallback focusable only', 'canvas-text-alternative-present', '<canvas width=10 height=10><button>Play</button></canvas>', ['pass','fail','cantTell'], ''],
 ['summary empty with aria-label', 'summary-name-present', '<details><summary aria-label="More"></summary>x</details>', ['pass'], ''],
 ['summary not first summary', 'summary-name-present', '<details><summary>A</summary><summary></summary>x</details>', ['pass','notApplicable'], ''],
 ['nested interactive: a inside button', 'nested-interactive-controls-absent', '<button>Go <a href="/">x</a></button>', ['fail'], ''],
 ['nested interactive: label inside button', 'nested-interactive-controls-absent', '<button><label>x</label></button>', ['pass','notApplicable'], ''],
 ['nested interactive: summary with button', 'nested-interactive-controls-absent', '<details><summary>Sum <button>b</button></summary>x</details>', ['fail'], ''],
 ['nested interactive: a with tabindex -1 inside role=link', 'nested-interactive-controls-absent', '<div role="link" tabindex="0">x <a href="/" tabindex="-1">y</a></div>', ['fail','pass'], ''],
 ['duplicate-id-aria labelledby dup', 'duplicate-id-aria', '<span id="l">A</span><span id="l">B</span><button aria-labelledby="l"></button>', ['fail'], ''],
 ['duplicate-id-aria label for dup', 'duplicate-id-aria', '<input id="i"><input id="i"><label for="i">L</label>', ['fail','pass'], ''],
 ['duplicate id in svg use', 'duplicate-id', '<svg><defs><g id="g"></g></defs></svg><svg><defs><g id="g"></g></defs></svg>', ['fail','cantTell','pass'], ''],
];
(async () => {
  for (const [label, id, body, exp, head] of C) {
    const html = `<!doctype html><html lang="en"><head><title>Probe page for tests</title>${head}</head><body><main><h1>T</h1>${body}</main></body></html>`;
    let a, b;
    try { a = rule(js(html, [id]), id); } catch (e) { a = { outcome: 'THROW ' + e.message.slice(0,100) }; }
    try { b = rule(await cr(html, [id]), id); } catch (e) { b = { outcome: 'THROW ' + e.message.slice(0,100) }; }
    const bad = !exp.includes(a.outcome) || !exp.includes(b.outcome) || a.outcome !== b.outcome;
    console.log((bad ? '!! ' : '   ') + label.padEnd(46) + ' exp ' + exp.join('|') + '  jsdom ' + brief(a).slice(0,160) + (a.outcome !== b.outcome ? '  CHROME ' + brief(b).slice(0,160) : ''));
  }
  await close();
})();
