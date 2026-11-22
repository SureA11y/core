const { both, page, close } = require('./h.js');
const ID='link-in-text-block';
(async () => {
  const P = (a) => page(`<p style="color:#000">Read the <a href="/" style="color:#000;text-decoration:none">${a}</a> before you start the work today.</p>`);
  await both('inner span underline', P('<span style="text-decoration:underline">guide</span>'), ID);
  await both('inner span underline via class', page(`<p style="color:#000">Read the <a href="/" style="color:#000;text-decoration:none"><span class=u>guide</span></a> before you start the work today.</p>`, '<style>.u{text-decoration:underline}</style>'), ID);
  await both('inner strong', P('<strong>guide</strong>'), ID);
  await both('inner span border-bottom', P('<span style="border-bottom:1px solid #000">guide</span>'), ID);
  await close();
})();
