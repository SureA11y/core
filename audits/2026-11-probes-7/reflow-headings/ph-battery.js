const h = require('./harness');
const R = 'p-as-heading';
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const cases = [
 ['signature-br', `<p><strong>Jane Doe</strong><br>Senior Product Manager, Acme Corporation<br>jane.doe@example.com<br>+1 555 0100 extension 42</p>`],
 ['address-name-br-long', `<p><b>Acme Corporation Ltd</b><br>1234 Long Industrial Road, Unit 5<br>Springfield, IL 62704<br>United States of America</p>`],
 ['address-p-run', `<p><b>Acme Corporation</b></p><p>1234 Long Industrial Road, Springfield, IL 62704, United States of America.</p>`],
 ['label-br-value-short', `<p><b>Phone</b><br>+1 555 0100</p>`],
 ['label-br-value-long-desc', `<p><b>Description</b><br>${L}</p>`],
 ['opening-hours-p', `<p><strong>Opening hours</strong></p><p>Monday to Friday 9 to 5</p>`],
 ['faq-question', `<p><strong>How do I reset my password?</strong></p><p>${L}</p>`],
 ['note-colon-inline', `<p><strong>Note:</strong> ${L}</p>`],
 ['md-bold-line-then-list', `<p><strong>Ingredients</strong></p><ul><li>Flour</li><li>Sugar</li></ul>`],
 ['product-card-div', `<div class=card><div class=title><b>Wireless Headphones</b></div><div class=desc>${L}</div></div>`],
 ['price-div-over-desc', `<div><b>$29.99</b></div><div>${L}</div>`],
 ['price-div-text', `<div><b>From $29.99</b></div><div>${L}</div>`],
 ['badge-div-new', `<div><b>New</b></div><div>${L}</div>`],
 ['form-label-div', `<div><b>Email address</b></div><div><input type=email></div><div>We will never share your email with anyone else, as described in our privacy policy.</div>`],
 ['footer-col', `<footer><div><strong>Company</strong></div><div><a href=#>About us</a> · <a href=#>Careers</a> · <a href=#>Press</a> · <a href=#>Investors</a> · <a href=#>Contact us</a> · <a href=#>Blog</a></div></footer>`],
 ['dl-like-divs', `<div style="display:flex;flex-direction:column"><div><b>Shipping</b></div><div>${L}</div></div>`],
 ['flex-row-label', `<div style="display:flex"><div><b>Shipping</b></div><div>${L}</div></div>`],
 ['grid-cols-label', `<div style="display:grid;grid-template-columns:100px 1fr"><div><b>Shipping</b></div><div>${L}</div></div>`],
 ['grid-cols-minmax', `<div style="display:grid;grid-template-columns:minmax(0,1fr)"><div><b>Shipping</b></div><div>${L}</div></div>`],
 ['float-label', `<div style="float:left;width:100px"><b>Shipping</b></div><div>${L}</div>`],
 ['table-cell-label', `<div style="display:table"><div style="display:table-row"><div style="display:table-cell"><b>Shipping</b></div><div style="display:table-cell">${L}</div></div></div>`],
 ['chinese-p', `<p><strong>营业时间</strong></p><p>周一至周五上午九点至下午五点营业，周末及公众假期休息。</p>`],
 ['chinese-div-short-passage', `<div><strong>营业时间</strong></div><div>周一至周五上午九点至下午五点营业，周末及公众假期休息。欢迎各位顾客光临本店，我们提供优质的服务和产品。如有疑问请致电。</div>`],
 ['arabic-p', `<p dir=rtl><strong>ساعات العمل</strong></p><p dir=rtl>من الاثنين إلى الجمعة من التاسعة إلى الخامسة</p>`],
 ['thai-div', `<div><strong>เวลาทำการ</strong></div><div>วันจันทร์ถึงวันศุกร์ เก้าโมงเช้าถึงห้าโมงเย็น ปิดวันเสาร์อาทิตย์และวันหยุดนักขัตฤกษ์ทุกวัน ยินดีต้อนรับ</div>`],
 ['light-theme-large-strong', `<style>body{font-weight:300}</style><p style="font-size:24px"><strong>Our services</strong></p><p>${L}</p>`],
 ['light-theme-body-strong', `<style>body{font-weight:300}</style><p><strong>Opening hours</strong></p><p>${L}</p>`],
 ['font-shorthand-div', `<style>.t{font:700 16px/1.4 sans-serif}</style><div class=t>Shipping details</div><div>${L}</div>`],
 ['font-shorthand-large', `<style>.t{font:bold 24px/1.2 sans-serif}</style><p class=t>Our services</p><p>${L}</p>`],
 ['strong-in-bold-parent', `<div style="font-weight:700"><p><strong>Opening hours</strong></p><p>${L}</p></div>`],
 ['semibold-600-p', `<p style="font-weight:600">Opening hours</p><p>${L}</p>`],
 ['lead-line-br-in-span', `<p><span style="font-weight:bold">Opening hours<br></span>${L}</p>`],
 ['lead-line-nested-br-div', `<div><div><b>Opening hours</b><br>${L}</div></div>`],
 ['lead-line-br-in-li', `<ul><li><b>Opening hours</b><br>${L}</li></ul>`],
 ['lead-line-trailing-colon', `<p><b>Opening hours:</b><br>${L}</p>`],
 ['lead-line-label-colon-no', `<p><b>Address</b><br>12 Rue de Rivoli, 75001 Paris, France, second floor, ring the bell twice please</p>`],
 ['poem-stanza-bold-first', `<p><b>Stopping by Woods on a Snowy Evening</b><br>Whose woods these are I think I know.<br>His house is in the village though;</p>`],
 ['contact-card-many-lines', `<div><strong>Customer Service</strong><br>Phone: +1 800 555 0199<br>Email: help@example.com<br>Hours: Mon–Fri 8am–8pm EST</div>`],
 ['dateline-news', `<p><b>LONDON</b><br>${L}</p>`],
 ['br-after-everything-bold', `<p><b>Line one</b><br><b>Line two</b><br>short</p>`],
 ['strong-wraps-br', `<p><strong>Title<br></strong>${L}</p>`],
 ['hidden-br', `<p><b>Bold run</b><br style="display:none"> continued text that is long enough to be a passage of eighty or more chars ok</p>`],
];
(async () => {
  const only = process.argv[2];
  for (const [name, frag] of cases) {
    if (only && !name.includes(only)) continue;
    const html = D + frag + '</body></html>';
    const c = await h.runChromium(html, R, { width: 1024, height: 768 });
    const j = await h.runJsdom(html, R);
    const fmt = (r) => r.outcome + ' ' + r.occ.map(o => o.code + '@' + o.sel.replace('html > body > ','')).join(',');
    const same = fmt(c) === fmt(j);
    console.log((same?'  ':'!!') + name.padEnd(32), 'CR:', fmt(c), same ? '' : ' | JSDOM: ' + fmt(j));
  }
  await h.close();
})();
