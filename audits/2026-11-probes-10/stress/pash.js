const { scan, rule, close } = require('./harness.js');
const RO = ['p-as-heading'];
const P = '<p>This is ordinary paragraph text that follows the line above and runs on for a while.</p>';
const cases = {
 ingredientsList: `<p><strong>Ingredients</strong></p><ul><li>2 eggs</li><li>flour</li></ul>`,
 faqQuestion: `<p><strong>How do I reset my password?</strong></p>${P}`,
 stepColon: `<p><strong>Step 1:</strong></p>${P}`,
 byline: `<p><strong>Posted by Jane Smith</strong></p>${P}`,
 dateline: `<p><strong>March 3, 2026</strong></p>${P}`,
 cjk: `<p lang="ja"><strong>営業時間</strong></p><p lang="ja">月曜日から金曜日まで、午前九時から午後五時まで営業しています。</p>`,
 cjkSentence: `<p lang="ja"><strong>営業時間は九時からです。</strong></p><p lang="ja">月曜日から金曜日まで、午前九時から午後五時まで営業しています。</p>`,
 inTableCell: `<table><tr><td><p><b>Name</b></p><p>Jane Smith, our head of research and development.</p></td></tr></table>`,
 inListItem: `<ul><li><p><b>Fast shipping</b></p><p>We ship in two days to most addresses in the country.</p></li></ul>`,
 inBlockquote: `<blockquote><p><strong>Editor's note</strong></p>${P}</blockquote>`,
 allCapsNotBold: `<p style="text-transform:uppercase;letter-spacing:2px">Opening hours</p>${P}`,
 strongInsideSpan: `<p><span style="font-weight:700">Opening hours</span></p>${P}`,
 boldThenFigure: `<p><strong>Figure 2</strong></p><figure><img src="a.png" alt="chart"><figcaption>Sales</figcaption></figure>`,
 boldInsideHeadingLikeLabel: `<p><b>Total:</b> $29.99</p>${P}`,
 boldEndsEllipsis: `<p><strong>And then…</strong></p>${P}`,
 boldEndsExclaim: `<p><strong>Sale now on!</strong></p>${P}`,
 boldLabelNextInput: `<p><strong>Your email</strong></p><input aria-label="Your email">`,
};
(async () => {
  for (const [k, b] of Object.entries(cases)) {
    const { r } = await scan(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Page</h1>${b}</main></body></html>`, { runOnly: RO, width: 1280 });
    const c = rule(r, RO[0]);
    console.log(k.padEnd(26), c.outcome, JSON.stringify(c.occurrences.map(o => [o.data && o.data.details && o.data.details.reasonCode, o.lean && o.lean.toward])));
  }
  await close();
})();
