const R=['p-as-heading'];
module.exports=[
{name:'p-strong-label-colon', rules:R, html:'<main><h1>A</h1><p><strong>Note:</strong></p><p>This is a paragraph with enough words to be body text for sure.</p></main>'},
{name:'p-bold-in-li', rules:R, html:'<main><h1>A</h1><ul><li><p><b>Item</b></p><p>Body text that is long enough to be a paragraph of content here.</p></li></ul></main>'},
{name:'p-bold-last', rules:R, html:'<main><h1>A</h1><p>Body text that is long enough to be a paragraph of content here.</p><p><b>Thanks!</b></p></main>'},
{name:'p-bold-in-table', rules:R, html:'<main><h1>A</h1><table><tr><td><p><b>Price</b></p><p>Body text that is long enough to be a paragraph of content here.</p></td></tr></table></main>'},
{name:'p-bold-in-button-label', rules:R, html:'<main><h1>A</h1><label><p><b>Email</b></p><input></label><p>Body text that is long enough to be a paragraph of content here.</p></main>'},
{name:'p-italic-quote', rules:R, html:'<main><h1>A</h1><p><i>“To be or not to be”</i></p><p>Body text that is long enough to be a paragraph of content here.</p></main>'},
{name:'p-bold-whole-para-long', rules:R, html:'<main><h1>A</h1><p><b>Important: your account will be closed on Monday unless you act.</b></p><p>Body text that is long enough to be a paragraph of content here.</p></main>'},
{name:'p-bold-cjk-long', rules:R, html:'<main lang=ja><h1>A</h1><p><b>重要なお知らせ：アカウントは月曜日に閉鎖されます。手続きを行ってください。</b></p><p>本文のテキストです。十分な長さがあります。本文のテキストです。</p></main>'},
{name:'p-bold-rtl', rules:R, html:'<main lang=ar dir=rtl><h1>A</h1><p><b>الشحن</b></p><p>نقوم بشحن المنتجات إلى جميع أنحاء العالم طوال العام بسرعة.</p></main>'},
{name:'p-css-heading-class', rules:R, html:'<style>.h{font-size:28px;font-weight:700}</style><main><h1>A</h1><div class=h>Our team</div><p>Body text that is long enough to be a paragraph of content here.</p></main>'},
{name:'p-bold-inside-dialog-footer', rules:R, html:'<main><h1>A</h1><p><b>Price</b> $10</p><p>Body text that is long enough to be a paragraph of content here.</p></main>'},
];
