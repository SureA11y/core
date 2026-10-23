const XSS='<img src=x onerror=alert(1)>';
const nasty = `</script><!-- ]]> \u0000 \u001b 😀 שלום עולם "q" 'a' & ${XSS}`;
const esc = s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
module.exports = {
clean: `<!doctype html><html lang="en"><head><title>Clean</title></head><body><header><nav><a href="#m">Skip</a></nav></header><main id="m"><h1>Hello</h1><p>Text</p><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="dot"></main></body></html>`,
violations: `<!doctype html><html><head></head><body>
<img src="a.png"><img src="b.png"><input type="text"><button></button><a href="/x"></a>
<div role="button">x</div><div aria-hidden="true"><a href="/y">focusable</a></div>
<p style="color:#bbb;background:#fff">low contrast</p><select><option>1</option></select>
<table><tr><th></th></tr></table><iframe src="about:blank"></iframe><div id="d"></div><div id="d"></div>
<video src="v.mp4" autoplay></video><span tabindex="5">t</span></body></html>`,
empty: `<!doctype html><html lang="en"><head><title>E</title></head><body></body></html>`,
nasty: `<!doctype html><html lang="en"><head><title>${esc(nasty)}</title></head><body>
<img src="x.png" alt="${esc(nasty)}" title="${esc(nasty)}"><img src="y.png" data-x="${esc(nasty)}">
<button aria-label="${esc(nasty)}"></button><a href="javascript:alert(1)" class="${XSS.replace(/[<>= ]/g,'_')}" id="${esc('"><img src=x onerror=alert(2)>')}"></a>
<div id="${esc(XSS)}" role="checkbox"></div><button class="&lt;img" data-q="'&quot;"></button>
<p dir="rtl" lang="he">שלום ${'very long text '.repeat(500)}</p><input title="${esc('‮'+XSS)}">
<img src="z.png" alt="${'L'.repeat(5000)}" aria-describedby="nope">
</body></html>`,
};
