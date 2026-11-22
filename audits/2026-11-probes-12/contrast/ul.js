const { four, page, close } = require('./h.js');
const lk=['link-in-text-block'], cc=['contrast-computable','contrast-minimum'];
const P=(a,h='')=>h+`<p style="color:#000">Read <a href="#" style="color:#333;text-decoration:none">${a}</a> now.</p>`;
const cases = [
 ['inner <ins>', P('<ins>terms</ins>'), lk],
 ['inner span !important over style attr none', P('<span class="u" style="text-decoration:none">terms</span>','<style>.u{text-decoration:underline!important}</style>'), lk],
 ['inner span underline transparent', P('<span style="text-decoration:underline transparent">terms</span>'), lk],
 ['inner span underline color = paragraph bg (#fff)', P('<span style="text-decoration:underline #fff">terms</span>'), lk],
 ['inner <u> with text-decoration:none class', P('<u class="n">terms</u>','<style>.n{text-decoration:none}</style>'), lk],
 ['inner span in @layer underline', P('<span class="u">terms</span>','<style>@layer x{.u{text-decoration:underline}}</style>'), lk],
 ['inner span underline via var on itself', P('<span style="--d:underline;text-decoration:var(--d)">terms</span>'), lk],
 ['inner span text-decoration-thickness 0? (underline 0px)', P('<span style="text-decoration:underline;text-decoration-thickness:0px">terms</span>'), lk],
 ['inner u partial: only part of link underlined', P('<u>te</u>rms and conditions'), lk],
 ['sign over gradient bg (computable asks?)', '<p style="background:linear-gradient(#fff,#ddd)"><span style="color:#999">€</span>45</p>', cc],
 ['sign over image bg', '<p style="background:url(data:image/gif;base64,R0lGODlhAQABAAAAACw=)"><span style="color:#999">$</span>45</p>', cc],
];
(async () => { for (const [l, b, ids] of cases) await four(l, page(b), ids); await close(); })();
