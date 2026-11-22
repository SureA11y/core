const { run, page } = require('./sc.js');
const ID='link-in-text-block';
const link = (inner, head='') => page(`<p style="color:#000">Read the <a href="/" style="color:#000;text-decoration:none">${inner}</a> before you start the work today.</p>`, head);
run([
 ['class underline', link('<span class=u>guide</span>', '<style>.u{text-decoration:underline}</style>'), ID],
 ['class underline only on :hover', link('<span class=u>guide</span>', '<style>.u:hover{text-decoration:underline}</style>'), ID],
 ['class underline in @media print', link('<span class=u>guide</span>', '<style>@media print{.u{text-decoration:underline}}</style>'), ID],
 ['class underline overridden by later none', link('<span class=u>guide</span>', '<style>.u{text-decoration:underline}.u{text-decoration:none}</style>'), ID],
 ['class underline, inline none wins', link('<span class=u style="text-decoration:none">guide</span>', '<style>.u{text-decoration:underline}</style>'), ID],
 ['class underline !important vs inline none', link('<span class=u style="text-decoration:none">guide</span>', '<style>.u{text-decoration:underline!important}</style>'), ID],
 ['underline transparent color', link('<span class=u>guide</span>', '<style>.u{text-decoration:underline transparent}</style>'), ID],
 ['underline colour = bg via longhand', link('<span class=u>guide</span>', '<style>.u{text-decoration-line:underline;text-decoration-color:#fff}</style>'), ID],
 ['partial underline (one word of three)', link('the <span class=u>full</span> guide', '<style>.u{text-decoration:underline}</style>'), ID],
 ['underline via @layer', link('<span class=u>guide</span>', '<style>@layer x{.u{text-decoration:underline}}</style>'), ID],
 ['underline var()', link('<span class=u>guide</span>', '<style>.u{--d:underline;text-decoration:var(--d)}</style>'), ID],
 ['overline only', link('<span class=u>guide</span>', '<style>.u{text-decoration:overline}</style>'), ID],
 ['line-through', link('<span class=u>guide</span>', '<style>.u{text-decoration:line-through}</style>'), ID],
 ['underline on display:none span + text', link('<span class=u style="display:none">x</span>guide', '<style>.u{text-decoration:underline}</style>'), ID],
 ['underline on visually empty span', link('<span class=u></span>guide', '<style>.u{text-decoration:underline}</style>'), ID],
 ['surrounding text also underlined', page('<p style="color:#000" class=u>Read the <a href="/" style="color:#000;text-decoration:none"><span class=u>guide</span></a> before you start the work today.</p>', '<style>.u{text-decoration:underline}</style>'), ID],
 ['<u> inside link', link('<u>guide</u>'), ID],
]);
