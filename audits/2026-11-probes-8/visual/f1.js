const { cases, close } = require('./multi');
const R = ['link-in-text-block'];
const p = (a, extra='') => `<style>${extra}</style><p style="color:#333">Read the <a href="#" style="color:#444;${a}">terms of service</a> before you continue.</p>`;
(async () => {
await cases([
 ['baseline no underline same-ish color', p('text-decoration:none')],
 ['underline transparent color', p('text-decoration:underline;text-decoration-color:transparent')],
 ['underline via rgba 0 color', p('text-decoration:underline rgba(0,0,0,0)')],
 ['border-bottom transparent', p('text-decoration:none;border-bottom:1px solid transparent')],
 ['border-bottom 0 width', p('text-decoration:none;border-bottom:0 solid #000')],
 ['box-shadow transparent', p('text-decoration:none;box-shadow:0 1px 0 transparent')],
 ['background-color same as surrounding', p('text-decoration:none;background-color:#fff')],
 ['outline none', p('text-decoration:none;outline:none')],
 ['font-weight 400 vs normal', p('text-decoration:none;font-weight:400')],
 ['font-weight 500 vs 400', p('text-decoration:none;font-weight:500')],
 ['font-style oblique 0deg', p('text-decoration:none;font-style:oblique 0deg')],
 ['bg gradient underline (fancy)', p('text-decoration:none;background-image:linear-gradient(#000,#000);background-size:100% 1px;background-repeat:no-repeat;background-position:0 100%')],
 ['bg image size 0', p('text-decoration:none;background-image:linear-gradient(#000,#000);background-size:0 0;background-repeat:no-repeat')],
 ['underline in light-dark only', p('text-decoration:none')],
 ['text-decoration-thickness 0', p('text-decoration:underline;text-decoration-thickness:0px')],
 ['underline offset off-box', p('text-decoration:underline;text-underline-offset:-30px')],
 ['link underline but text also underlined', `<p style="color:#333;text-decoration:underline">Read the <a href="#" style="color:#444">terms</a> before you continue.</p>`],
 ['link bold but text also bold', `<p style="color:#333;font-weight:bold">Read the <a href="#" style="color:#444;text-decoration:none;font-weight:bold">terms</a> before you continue.</p>`],
 ['link border transparent shorthand none', p('text-decoration:none;border:none')],
], R);
await close();
})();
