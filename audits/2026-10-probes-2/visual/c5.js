const R=['contrast-minimum','contrast-computable'];
require('./h').run([
 ['svg rect bg + light text', `<svg width="200" height="40"><rect width="200" height="40" fill="#000"/><text x="10" y="25" fill="#ddd" font-size="16">Badge label</text></svg>`],
 ['svg rect bg + dark text (should fail)', `<svg width="200" height="40"><rect width="200" height="40" fill="#333"/><text x="10" y="25" fill="#000" font-size="16">Badge label</text></svg>`],
 ['svg with style bg', `<svg width="200" height="40" style="background:#000"><text x="10" y="25" fill="#ddd" font-size="16">Badge label</text></svg>`],
 ['first-letter drop cap', `<style>.d::first-letter{color:#ccc;font-size:3em}</style><p class=d>Once upon a time there was text</p>`],
 ['transparent color + text-fill', `<p style="color:transparent;-webkit-text-fill-color:#ccc">Low contrast via fill</p>`],
 ['visibility visible child', `<div style="visibility:hidden"><span style="visibility:visible;color:#ccc">Shown child</span></div>`],
 ['select dark', `<select style="background:#000;color:#fff"><option>Option one</option></select>`],
 ['input value text', `<input value="Typed value" style="color:#ccc">`],
],R);
