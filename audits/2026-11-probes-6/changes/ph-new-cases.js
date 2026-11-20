const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const cases = {
  leadLine: '<p><strong>Opening hours</strong><br>Monday to Friday, from nine in the morning to five in the evening.</p>',
  leadLineB: '<p><b>Delivery</b><br>We ship to every country in the European Union within three working days.</p>',
  leadEndsColon: '<p><strong>Note:</strong><br>Bring your ticket.</p>',
  leadAddress: '<p><strong>ACME Ltd</strong><br>12 High Street<br>London</p>',
  leadPhone: '<p><b>Phone</b><br>555 123 456</p>',
  leadBoldPoem: '<p><b>Line one</b><br><b>Line two of the bold run here</b><br>end</p>',
  leadInline: '<p>Some text <b>bold</b><br>more text that is a full sentence and long enough to be read.</p>',
  leadNumber: '<p><b>2024</b><br>The year we opened our second office in the city centre.</p>',
  leadLink: '<p><a href="/x"><b>Read more</b></a><br>An article about the city, its parks and its museums.</p>',
  divTitle: '<div><b>Opening hours</b></div><div>Monday to Friday, from nine in the morning to five in the evening.</div>',
  divTitleStyle: '<div style="font-weight:700">Our story</div><p>We started in a garage in 1998 and grew to three hundred people.</p>',
  divPrice: '<div><b>Price</b></div><div>$20</div>',
  divFlexRow: '<div style="display:flex"><div><b>Shipping</b></div><div>Free shipping on every order over fifty euros, worldwide.</div></div>',
  divBadge: '<div><b>New</b></div><div>Paris</div>',
  divSentence: '<div><b>Do not stop here.</b></div><div>Something long that follows the bold text and is a passage.</div>',
  pBodySize: '<p><b>Opening hours</b></p><p>Monday to Friday, 9 to 5.</p>'
};
for (const [k, body] of Object.entries(cases)) {
  const r = runa11yCoreOnHtml(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Page</h1>${body}</main></body></html>`, { rules: { include: 'p-as-heading' } });
  const c = r.checksResults.find((x) => x.ruleId === 'p-as-heading');
  console.log(k.padEnd(15), c.outcome, JSON.stringify(c.occurrences.map((o) => o.data.details.reasonCode)));
}
