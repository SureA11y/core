const p=require('./h.js');
const R=['autocomplete-valid'];
const cases=[
 '<input type="hidden" autocomplete="foo">',
 '<input autocomplete="section- email">',
 '<input autocomplete="section-a shipping home tel webauthn">',
 '<input autocomplete="  Email  ">',
 '<input autocomplete="email webauthn webauthn">',
 '<input autocomplete="webauthn">',
 '<input autocomplete="username webauthn">',
 '<select autocomplete="country"><option>a</option></select>',
 '<textarea autocomplete="street-address"></textarea>',
 '<input autocomplete="nope">',
 '<input autocomplete="new-password" type="password">',
 '<input type="range" autocomplete="xyz">',
 '<input type="color" autocomplete="xyz">',
 '<input autocomplete="email ">',
 '<input readonly autocomplete="xyz">',
 '<input aria-hidden="true" tabindex="-1" autocomplete="xyz">',
 '<input style="position:absolute;left:-9999px" autocomplete="xyz">',
 '<input autocomplete="off email">',
 '<input autocomplete="shipping">',
];
for (const h of cases) p(h,`<!doctype html><html lang="en"><head><title>t</title></head><body><form>${h}</form></body></html>`,R);
