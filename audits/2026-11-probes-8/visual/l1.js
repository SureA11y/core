const { cases, close } = require('./multi');
const R = ['p-as-heading'];
const body = `<p>Body paragraph with quite a lot of normal text in it to read through.</p>`;
(async () => {
await cases([
 ['bold short p', `<p style="font-weight:bold">Shipping details</p>` + body],
 ['large p', `<p style="font-size:28px">Shipping details</p>` + body],
 ['p > strong only', `<p><strong>Shipping details</strong></p>` + body],
 ['p > b only, colon', `<p><b>Note:</b></p>` + body],
 ['variation wght 700', `<p style="font-variation-settings:'wght' 700">Shipping details</p>` + body],
 ['p uppercase letter-spacing small bold', `<p style="font-weight:600;text-transform:uppercase;font-size:12px;letter-spacing:.1em">Shipping details</p>` + body],
 ['bold p in table cell', `<table><tr><td><p style="font-weight:bold">Shipping details</p><p>Body cell text that goes on for a while here.</p></td></tr></table>`],
 ['bold label-ish p in form', `<form><p style="font-weight:bold">Shipping details</p><p>Enter your address below in the fields.</p></form>`],
 ['bold p, next is list', `<p style="font-weight:bold">Shipping details</p><ul><li>One</li><li>Two</li></ul>`],
 ['bold p question FAQ', `<p style="font-weight:bold">How long does shipping take?</p>` + body],
], R);
await close();
})();
