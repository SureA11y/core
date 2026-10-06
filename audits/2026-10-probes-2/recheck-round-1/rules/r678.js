const {run}=require('../../visual/h.js');
const L=['link-in-text-block','contrast-minimum','contrast-computable'];
const P=(x)=>`<p style="color:#000">Some text around ${x} and more text after it here.</p>`;
const A='text-decoration:none;color:#222';
run([
 ['R-6 strong child', P(`<a href="#" style="${A}"><strong>link</strong></a>`)],
 ['R-6 em child', P(`<a href="#" style="${A}"><em>link</em></a>`)],
 ['R-6 underlined span child', P(`<a href="#" style="${A}"><span style="text-decoration:underline">link</span></a>`)],
 ['R-6 FN: link wrapped in span, colour only', P(`<span><a href="#" style="text-decoration:none;color:#333">link</a></span>`)],
 ['R-6 FN: transparent decoration colour', P(`<a href="#" style="text-decoration:underline;text-decoration-color:transparent;color:#333">link</a>`)],
 ['R-6 FN: transparent border-bottom', P(`<a href="#" style="text-decoration:none;border-bottom:1px solid transparent;color:#333">link</a>`)],
 ['R-6 control: colour-only', P(`<a href="#" style="text-decoration:none;color:#333">link</a>`)],
 ['R-7 fill black, color #eee', `<svg width="200" height="40" style="color:#eee"><text x="0" y="20" fill="#000">SVG text here</text></svg>`],
 ['R-7 fill #eee, color #000', `<svg width="200" height="40" style="color:#000"><text x="0" y="20" fill="#eee">SVG text here</text></svg>`],
],L).catch(e=>{console.error(e);process.exit(1)});
