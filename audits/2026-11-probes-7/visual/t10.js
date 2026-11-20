const { run, show, close } = require('./h');
const R = ['link-in-text-block'];
const L = (style, inner='docs') => `<a href="#" style="text-decoration:none;color:#0645ad;${style}">${inner}</a>`;
const P = (link, extra='') => `<p style="color:#222">Please read the ${link} before posting${extra}.</p>`;
const cases = {
  colorOnlyLow: P(L('color:#555')),
  colorOnly3: P(L('')),
  underlined: P(L('text-decoration:underline')),
  gradientUnderline: P(L('background-image:linear-gradient(currentColor,currentColor);background-size:100% 1px;background-position:0 100%;background-repeat:no-repeat;color:#555')),
  borderBottom: P(L('border-bottom:1px solid;color:#555')),
  boldLink: P(L('font-weight:700;color:#555')),
  ownLineBr: `<p style="color:#222">Some intro text here.<br>${L('color:#555')}</p>`,
  afterBr: `<p style="color:#222">${L('color:#555')}<br>Some text after.</p>`,
  wrapLine: `<p style="color:#222;width:200px">Some intro text that wraps onto several lines ${L('color:#555','link')} and more text.</p>`,
  sameColorInherit: P(L('color:inherit')),
  underlineViaU: `<p style="color:#222">Read the <u>${L('color:#555','docs')}</u> now.</p>`,
  underlineParentP: `<p style="color:#222;text-decoration:underline">Read the ${L('color:#555','docs')} now.</p>`,
  decoTransparent: P(L('text-decoration:underline;text-decoration-color:transparent;color:#555')),
  decoThickness0: P(L('text-decoration:underline;text-decoration-thickness:0px;color:#555')),
  rtl: `<p dir="rtl" style="color:#222">اقرأ ${L('color:#555','الوثائق')} قبل النشر.</p>`,
  footerSep: `<p style="color:#222">© 2026 Company · ${L('color:#555','Privacy')} · ${L('color:#555','Terms')}</p>`,
  darkLow: `<body style="background:#111"><p style="color:#ddd">Please read the <a href="#" style="text-decoration:none;color:#4ea1ff">docs</a> first.</p></body>`,
  nestedInSpan: `<p style="color:#222">Please <span>read the ${L('color:#555')}</span> before posting.</p>`,
  nestedInEm: `<p style="color:#222">Please read <em>the ${L('color:#555')} section</em> first.</p>`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R), true);
  await close();
})();
