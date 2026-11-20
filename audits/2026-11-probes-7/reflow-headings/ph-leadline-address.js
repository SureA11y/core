const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const cases = [
 ['postal-address-us', `<p><strong>Acme Corporation</strong><br>Suite 400, 1234 Long Industrial Parkway<br>Springfield, Illinois 62704<br>United States of America</p>`],
 ['address-element-div', `<address><div><strong>Head Office</strong><br>Suite 400, 1234 Long Industrial Parkway<br>Springfield, Illinois 62704<br>United States of America</div></address>`],
 ['staff-card', `<p><strong>Dr Jane Doe</strong><br>Head of Cardiology and Vascular Medicine<br>St Mary's Hospital, Praed Street, London W2 1NY</p>`],
 ['email-signature', `<div><b>John Smith</b><br>Senior Account Executive | Example Widgets Inc.<br>T: +44 20 7946 0000 | M: +44 7700 900000<br>john.smith@example.com</div>`],
 ['address-short-control', `<p><strong>Acme Corporation</strong><br>1234 Main St<br>Springfield, IL 62704</p>`],
 ['price-p', `<p><b>$29.99</b></p><p>Hand-made ceramic mug, dishwasher safe, holds 350 ml of your favourite drink.</p>`],
 ['price-div', `<div class=price><b>$29.99</b></div><div class=desc>Hand-made ceramic mug, dishwasher safe, holds 350 ml of your favourite drink, glazed by hand.</div>`],
 ['price-euro-div', `<div class=price><b>29,99 €</b></div><div class=desc>Hand-made ceramic mug, dishwasher safe, holds 350 ml of your favourite drink, glazed by hand.</div>`],
 ['price-pound-p', `<p><strong>£1,299.00</strong></p><p>Free delivery on this item.</p>`],
 ['number-only-control', `<div><b>29.99</b></div><div>Hand-made ceramic mug, dishwasher safe, holds 350 ml of your favourite drink, glazed by hand.</div>`],
 ['percent-p', `<p><b>45%</b></p><p>of respondents said they would recommend the product to a friend.</p>`],
];
(async () => {
  for (const [name, frag] of cases) {
    const html = D + frag + '</body></html>';
    for (const [eng, r] of [['CR', await h.runChromium(html, 'p-as-heading', { width: 1024 })], ['JS', await h.runJsdom(html, 'p-as-heading')]])
      console.log(name.padEnd(24), eng, r.outcome, r.occ.map(o => o.code + '@' + o.sel).join(','));
  }
  await h.close();
})();
