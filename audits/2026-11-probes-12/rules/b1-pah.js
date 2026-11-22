const {run4}=require('./h.js');
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title></head><body><main>${b}</main></body></html>`;
const R=['p-as-heading'];
const cases=[
 ['colon-recipe','<p><strong>Ingredients:</strong></p><ul><li>2 eggs</li></ul><p>Mix well.</p>'],
 ['colon-label-inline','<p><strong>Note:</strong> this is a sentence that continues after the bold label in the same paragraph.</p><p>More.</p>'],
 ['colon-fullwidth-ja','<p lang=ja><strong>材料：</strong></p><p lang=ja>卵を二つ使います。</p>'],
 ['colon-then-nothing','<p><b>Contact us:</b></p>'],
 ['colon-time','<p><b>10:30</b></p><p>Doors open.</p>'],
 ['colon-long-sentence','<p><b>Here is what you need to know about the new store hours this week:</b></p><p>Monday closed.</p>'],
 ['colon-ratio','<p><b>Ratio 16:9</b></p><p>Widescreen format.</p>'],
 ['colon-question-end','<p><b>What should I bring?</b></p><p>Water.</p>'],
 ['wp-block-bold','<div class="wp-block-group"><p class="has-text-align-left"><strong>Opening hours</strong></p><p>Mon-Fri 9-5</p></div>'],
 ['bold-link-only','<p><a href="/x"><strong>Read more</strong></a></p><p>Text.</p>'],
 ['address-run','<p><b>Acme Ltd</b></p><p><b>1 Road</b></p><p>Phone 123</p>'],
 ['semibold-p','<p style="font-weight:600">Opening hours</p><p>Mon-Fri</p>'],
 ['bold-in-table','<table><tr><td><p><b>Size</b></p><p>Large</p></td></tr></table>'],
 ['bold-in-li','<ul><li><p><b>Step 1:</b></p><p>Open the box.</p></li></ul>'],
 ['bold-in-blockquote','<blockquote><p><b>Editor’s note:</b></p><p>Text.</p></blockquote>'],
 ['label-colon-form','<p><b>Name:</b></p><input aria-label="Name">'],
 ['bold-rtl','<p dir=rtl lang=ar><b>ساعات العمل</b></p><p dir=rtl lang=ar>من الاثنين إلى الجمعة</p>'],
 ['bold-before-hidden','<p><b>Opening hours</b></p><p hidden>Mon</p>'],
 ['bold-last','<p>Intro.</p><p><b>Opening hours</b></p>'],
 ['h-follow','<p><b>Opening hours</b></p><h2>Next</h2>'],
 ['b-and-text-no-space','<p><b>Ingredients</b>:</p><p>eggs</p>'],
 ['colon-outside-bold','<p><strong>Ingredients</strong>:</p><p>eggs</p>'],
 ['bold-in-dialog-figcaption','<figure><img src="a.png" alt="x"><figcaption><b>Figure 1:</b></figcaption></figure><p>Text after</p>'],
 ['bold-in-button-ish','<p><span style="font-weight:bold">Total:</span></p><p>$5</p>'],
 ['bold-body-lighter','<div style="font-weight:700"><p>Title line</p><p style="font-weight:400">body</p></div>'],
 ['vertical-ja','<div style="writing-mode:vertical-rl"><p lang=ja><b>営業時間</b></p><p lang=ja>月曜から金曜まで</p></div>'],
 ['colon-emoji','<p><b>📌 Tip:</b></p><p>Use it.</p>'],
 ['wc-attr','<div class="woocommerce-product-details__short-description"><p><strong>Material:</strong> cotton</p><p><strong>Care:</strong> wash cold</p></div>'],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b)})));
