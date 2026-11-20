'use strict';
// One page per case. `expect` is what WCAG (and the ACT rule, where there is
// one) says about the case, as the comparison's yardstick.

const page = (body, { css = '', lang = 'en', head = '' } = {}) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Case</title>${head}<style>body{margin:8px;font:16px/1.4 sans-serif} ${css}</style></head><body><main>${body}</main></body></html>`;

const lorem =
  'We are open on weekdays and on most Saturdays, and closed on public holidays. Call ahead if you plan to visit late in the day.';

const reflow = [
  ['R01-fixed-width-wrapper', 'A 600px wide wrapper around text', page(`<div style="width:600px"><h1>News</h1><p>${lorem}</p></div>`), 'fail'],
  ['R02-responsive', 'max-width:100% layout, images scale', page(`<h1>News</h1><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="800" height="100" alt="Banner" style="max-width:100%;height:auto"><p>${lorem}</p>`), 'pass'],
  ['R03-wide-data-table', 'A 700px data table with caption and th, page scrolls', page(`<h1>Rates</h1><table style="width:700px"><caption>Rates by month</caption><tr><th>Month</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th></tr><tr><th>Rate</th><td>1.1</td><td>1.2</td><td>1.3</td><td>1.4</td><td>1.5</td></tr></table>`), 'pass (2-D exception)'],
  ['R04-long-unbroken-url', 'A long URL in a paragraph with no overflow-wrap', page(`<h1>Links</h1><p>See https://example.com/a/very/long/path/that/never/breaks/because/it/has/no/spaces/at/all/index.html for details.</p>`), 'fail'],
  ['R05-wide-image', 'An 800px photo without max-width', page(`<h1>Photo</h1><img id="photo" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="800" height="200" alt="Team photo">`), 'fail (photo can be scaled)'],
  ['R06-root-clips-nav', 'html{overflow-x:hidden} and a 600px nav cut by the edge', page(`<nav style="width:600px;display:flex;gap:20px"><a href="#">Home</a><a href="#">Products</a><a href="#">Services</a><a href="#">About us</a><a href="#">Contact</a><a href="#">Careers</a></nav><p>${lorem}</p>`, { css: 'html{overflow-x:hidden}' }), 'fail (links unreachable)'],
  ['R07-card-clips-text', 'A card with overflow:hidden around a 500px text block', page(`<div style="overflow:hidden;border:1px solid"><p style="width:500px">${lorem}</p></div>`), 'fail (text cut off)'],
  ['R08-pre-in-scroller', 'Code in an overflow-x:auto box', page(`<div style="overflow-x:auto" tabindex="0"><pre>const result = someFunction(argumentNumberOne, argumentNumberTwo, argumentNumberThree);</pre></div>`), 'pass (debated)'],
  ['R09-form-two-columns-in-scroller', 'A two-column form fixed at 600px inside an overflow-x:auto box', page(`<div style="overflow-x:auto"><form style="display:grid;grid-template-columns:300px 300px;width:600px"><label>First name <input></label><label>Last name <input></label></form></div>`), 'fail'],
  ['R10-hidden-offcanvas', 'An off-canvas menu with visibility:hidden at left:100% widens the page', page(`<p>${lorem}</p><div style="position:absolute;top:0;left:100%;width:250px;visibility:hidden"><a href="#">Menu item</a></div>`), 'debated: blank scroll, no content lost'],
  ['R12-carousel-G225', 'overflow-x:auto carousel of 280px cards (each fits, G225)', page(`<h1>Offers</h1><div style="display:flex;gap:8px;overflow-x:auto" tabindex="0" role="region" aria-label="Offers"><div style="flex:0 0 280px;border:1px solid"><p>Offer one: two for one on tea.</p></div><div style="flex:0 0 280px;border:1px solid"><p>Offer two: free cake on Friday.</p></div><div style="flex:0 0 280px;border:1px solid"><p>Offer three: coffee club.</p></div></div>`), 'pass (G225 sufficient technique)'],
  ['R13-table-in-scroller', 'a data table inside an overflow-x:auto wrapper', page(`<div style="overflow-x:auto" tabindex="0"><table style="width:700px"><tr><th>Month</th><th>Jan</th><th>Feb</th><th>Mar</th></tr><tr><th>Rate</th><td>1</td><td>2</td><td>3</td></tr></table></div>`), 'pass'],
  ['R14-map-iframe', 'a 600px map iframe', page(`<h1>Find us</h1><iframe title="Map" srcdoc="<p>map</p>" width="600" height="300"></iframe>`), 'cantTell (map may need 2-D)'],
  ['R15-wide-input', 'an input with size=80', page(`<label>Search <input size="80"></label>`), 'fail'],
  ['R16-rtl-overflow', 'RTL page with a 600px block', page(`<div style="width:600px"><p>${lorem}</p></div>`, { lang: 'ar' }).replace('<html lang="ar"', '<html lang="ar" dir="rtl"'), 'fail'],
  ['R17-sticky-header-tall', 'a fixed header 200px tall (HTMLCS-style warning case)', page(`<header style="position:fixed;top:0;left:0;right:0;height:200px;background:#eee">Site</header><div style="margin-top:210px"><p>${lorem}</p></div>`), 'pass for 320px width (height issue is 256px-high / 1.4.4 territory)'],
  ['R11-nowrap-nav', 'A nav with white-space:nowrap overflowing', page(`<nav style="white-space:nowrap"><a href="#">Home</a> | <a href="#">Products and services</a> | <a href="#">About our company</a> | <a href="#">Contact</a></nav>`), 'fail']
];

const tdHeader = [
  ['T01-2x2-no-th', '2x2 key/value table with no header cells', page(`<table><tr><td>Opens</td><td>9:00</td></tr><tr><td>Closes</td><td>17:00</td></tr></table>`), 'cantTell (fail if data table, F91)'],
  ['T02-3x3-no-th-bordered', '3x3 bordered price table with no th', page(`<table border="1"><tr><td>Item</td><td>Small</td><td>Large</td></tr><tr><td>Tea</td><td>2.00</td><td>3.00</td></tr><tr><td>Coffee</td><td>2.50</td><td>3.50</td></tr></table>`), 'fail (F91)'],
  ['T03-2x3-th-row', '2 columns, th first row', page(`<table><tr><th>Item</th><th>Price</th></tr><tr><td>Tea</td><td>2.00</td></tr><tr><td>Coffee</td><td>2.50</td></tr></table>`), 'pass'],
  ['T04-2x2-partial-th', '2x2 with one th; the top-right td has no header', page(`<table><tr><th>Item</th><td>Price</td></tr><tr><td>Tea</td><td>2.00</td></tr></table>`), 'fail'],
  ['T05-layout-presentation', '2x2 role=presentation layout table', page(`<table role="presentation"><tr><td>Logo</td><td>Menu</td></tr><tr><td>Side</td><td>Body</td></tr></table>`), 'inapplicable'],
  ['T06-single-row', 'one row of 3 cells', page(`<table><tr><td>Mon</td><td>Tue</td><td>Wed</td></tr></table>`), 'inapplicable / debated'],
  ['T07-row-headers', '3x3 with th in first column', page(`<table><tr><th>Tea</th><td>2.00</td><td>3.00</td></tr><tr><th>Coffee</th><td>2.50</td><td>3.50</td></tr><tr><th>Juice</th><td>3.00</td><td>4.00</td></tr></table>`), 'pass'],
  ['T08-bold-td-headers', '3x3 with <td><b> as visual headers (F91)', page(`<table border="1"><tr><td><b>Name</b></td><td><b>Role</b></td><td><b>Ext</b></td></tr><tr><td>Ana</td><td>Dev</td><td>101</td></tr><tr><td>Bo</td><td>QA</td><td>102</td></tr></table>`), 'fail (F91)'],
  ['T09-2x2-caption-no-th', '2x2 with caption and no th', page(`<table><caption>Opening times</caption><tr><td>Opens</td><td>9:00</td></tr><tr><td>Closes</td><td>17:00</td></tr></table>`), 'fail (clearly a data table)'],
  ['T10-headers-attr-to-td', '3x3 where headers= points at td ids (no th)', page(`<table><tr><td id="h1">Item</td><td id="h2">Small</td><td id="h3">Large</td></tr><tr><td headers="h1">Tea</td><td headers="h2">2</td><td headers="h3">3</td></tr><tr><td headers="h1">Coffee</td><td headers="h2">2.5</td><td headers="h3">3.5</td></tr></table>`), 'fail']
];

const pAsHeading = [
  ['P01-strong-line', '<p><strong>Opening hours</strong></p> over body text', page(`<p><strong>Opening hours</strong></p><p>${lorem}</p>`), 'cantTell (likely F2)'],
  ['P02-css-bold-line', 'p with font-weight:700 via CSS over body text', page(`<p class="t">Opening hours</p><p>${lorem}</p>`, { css: '.t{font-weight:700}' }), 'cantTell (likely F2)'],
  ['P03-bold-sentence', 'a bold full sentence over body text', page(`<p><strong>Please bring your ID to every visit.</strong></p><p>${lorem}</p>`), 'pass (emphasis, not a heading)'],
  ['P04-bold-address', 'a run of bold lines (address)', page(`<p><b>Acme Ltd</b></p><p><b>1 High Street</b></p><p><b>Springfield</b></p><p>${lorem}</p>`), 'pass'],
  ['P05-bold-large', 'bold 22px short p over 16px text', page(`<p style="font-weight:700;font-size:22px">Our services</p><p>${lorem}</p>`), 'fail/cantTell (F2)'],
  ['P06-bold-last', 'bold short p with nothing after it', page(`<p>${lorem}</p><p><strong>Thank you</strong></p>`), 'pass'],
  ['P07-partial-bold', 'bold lead-in inside a sentence', page(`<p><b>Step 1</b> Mix the flour and the water in a bowl.</p><p>${lorem}</p>`), 'pass'],
  ['P08-bold-italic', 'bold italic 16px short p', page(`<p style="font-weight:700;font-style:italic">Opening hours</p><p>${lorem}</p>`), 'cantTell (likely F2)'],
  ['P09-bold-div', '<div><strong>Opening hours</strong></div> over a div of text', page(`<div><strong>Opening hours</strong></div><div>${lorem}</div>`), 'cantTell (likely F2)'],
  ['P10-bold-number', '<p><strong>42</strong></p> stat', page(`<p><strong>42</strong></p><p>${lorem}</p>`), 'pass']
];

const linkOnly = [
  ['L01-click-here', '"click here" explained by the sentence', page(`<p>To read our annual report, <a href="/r">click here</a>.</p>`), 'fail 2.4.9 (passes 2.4.4)'],
  ['L02-read-more-card', '"Read more" under a card heading', page(`<article><h2>Pricing changes</h2><p>Prices change in May.</p><a href="/p">Read more</a></article>`), 'fail 2.4.9'],
  ['L03-read-more-sr-only', '"Read more" + visually hidden "about pricing"', page(`<a href="/p">Read more<span class="sr"> about pricing changes</span></a>`, { css: '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' }), 'pass'],
  ['L04-aria-label', 'aria-label gives the purpose', page(`<a href="/p" aria-label="Read more about pricing changes">Read more</a>`), 'pass (2.5.3 label-in-name ok)'],
  ['L05-descriptive', 'descriptive text', page(`<a href="/r.pdf">Annual report 2025 (PDF, 2 MB)</a>`), 'pass'],
  ['L06-here-with-title', '"here" with title="Annual report"', page(`<p>The report is <a href="/r" title="Annual report 2025">here</a>.</p>`), 'debated; title is description, not name -> fail 2.4.9'],
  ['L07-url-text', 'link text is the URL', page(`<p>Visit <a href="https://example.com/annual-report">https://example.com/annual-report</a></p>`), 'pass (usually)'],
  ['L08-more-describedby', '"More" with aria-describedby to a heading', page(`<h2 id="h">Pricing changes</h2><a href="/p" aria-describedby="h">More</a>`), 'fail 2.4.9 (description is not link text)'],
  ['L09-french', '"cliquez ici" on a French page', page(`<p>Pour lire le rapport, <a href="/r">cliquez ici</a>.</p>`, { lang: 'fr' }), 'fail 2.4.9'],
  ['L10-img-alt-click-here', 'image link alt="click here"', page(`<p>Our report: <a href="/r"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="20" height="20" alt="click here"></a></p>`), 'fail 2.4.9']
];

const headings = [
  ['H01-h1-then-h3-role', '<h1> then <h3 role=heading>', page(`<h1>Title</h1><h3 role="heading">Sub</h3><p>x</p>`), 'skip 1->3 (best practice)'],
  ['H02-h3role-then-h4', '<h1>,<h2>,<h3 role=heading>,<h4>', page(`<h1>Title</h1><h2>A</h2><h3 role="heading">B</h3><h4>C</h4>`), 'no skip'],
  ['H03-h1-role-heading-only', 'only <h1 role=heading>', page(`<h1 role="heading">Title</h1><p>x</p>`), 'has level-1 heading'],
  ['H04-h2-aria-level-1', 'only <h2 aria-level=1>', page(`<h2 aria-level="1">Title</h2><p>x</p>`), 'has level-1 heading'],
  ['H05-h1-aria-level-2', 'only <h1 aria-level=2>', page(`<h1 aria-level="2">Title</h1><p>x</p>`), 'no level-1 heading'],
  ['H06-aria-level-decimal', '<h1>, div role=heading aria-level=2.5, <h4>', page(`<h1>Title</h1><div role="heading" aria-level="2.5">Sub</div><h4>Deep</h4>`), 'per browser: 2.5 -> 2 => skip 2->4'],
  ['H07-role-heading-default', '<h1>, div role=heading (no level), <h4>', page(`<h1>Title</h1><div role="heading">Sub</div><h4>Deep</h4>`), 'default 2 => skip 2->4'],
  ['H08-h2-aria-level-4', '<h1>, <h2 aria-level=4>', page(`<h1>Title</h1><h2 aria-level="4">Sub</h2>`), 'skip 1->4'],
  ['H09-h3-aria-level-0', '<h1>, <h3 aria-level=0>', page(`<h1>Title</h1><h3 aria-level="0">Sub</h3>`), 'invalid aria-level -> tag 3 => skip'],
  ['H10-hidden-h2', '<h1>, hidden <h2>, <h3>', page(`<h1>Title</h1><h2 hidden>Gone</h2><h3>Sub</h3>`), 'skip 1->3'],
  ['H11-first-heading-h2', 'page starts with h2, h1 later', page(`<h2>Site name</h2><h1>Title</h1><p>x</p>`), 'has h1; ACT-ish best practice: start with h1'],
  ['H12-aria-level-9', '<h1>, <h2>, div role=heading aria-level=9', page(`<h1>T</h1><h2>A</h2><div role="heading" aria-level="9">Deep</div>`), 'Chromium exposes 9 => skip']
];

const exclude = [
  ['E01-img-in-banner', 'img without alt inside excluded #cookie', page(`<div id="cookie"><img src="x.png"></div><h1>T</h1>`), 'nothing reported; say so', '#cookie'],
  ['E02-heading-around-excluded', '<h1>, excluded <div id=cms><h2></div>, <h3>', page(`<h1>T</h1><div id="cms"><h2>CMS</h2></div><h3>Sub</h3>`), 'no skip (users still see h2)', '#cms'],
  ['E03-only-h1-excluded', 'the only h1 sits in excluded header', page(`<header id="hdr"><h1>Site</h1></header><h2>Section</h2>`), 'page has h1; should not fail', '#hdr'],
  ['E04-thead-excluded', 'a 3x3 table whose thead is excluded', page(`<table><thead id="th"><tr><th>A</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr></tbody></table>`), 'cells still have headers: pass', '#th'],
  ['E05-matches-nothing', 'selector matches nothing', page(`<img src="x.png"><h1>T</h1>`), 'same as no exclusion', '#nothing'],
  ['E06-link-in-excluded', '"click here" link inside excluded footer', page(`<h1>T</h1><footer id="ft"><p>To read our report, <a href="/r">click here</a>.</p></footer>`), 'nothing reported', '#ft']
];

module.exports = { reflow, tdHeader, pAsHeading, linkOnly, headings, exclude };
