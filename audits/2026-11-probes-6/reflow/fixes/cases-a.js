module.exports = (page) => [
  ['start: negative margin text', page('#p{margin-left:-120px}', '<p id="p">Text that starts before the left edge of the page</p>')],
  ['start: decorative box only (no content cut)', page('.bleed{margin:0 -8px;height:40px;background:#eee}', '<div class="bleed" id="b"></div><p>Text</p>')],
  ['start: rtl mirror', page('#p{position:relative;left:120px}', '<p id="p">نص يبدأ بعد الحافة اليمنى للصفحة</p>', 'lang="ar" dir="rtl"')],
  ['start: skip link wholly off-screen', page('.skip{position:absolute;left:-9999px}', '<a class="skip" href="#m" id="s">Skip</a><main id="m">Text</main>')],
  ['start: text-indent image replacement', page('h1{text-indent:-9999px;background:#ccc;width:200px}', '<h1 id="h">Logo</h1>')],
  ['body dir=rtl under ltr html, wide', page('#w{width:600px}', '<div id="w">Wide</div>').replace('<body>', '<body dir="rtl">')],
  ['body writing-mode vertical', page('body{writing-mode:vertical-rl}', '<div id="w" style="width:600px">Wide</div>')],
  ['open shadow: wide element named', page('', '<div id="host"></div><script>document.getElementById("host").attachShadow({mode:"open"}).innerHTML="<div id=\\"inner\\" style=\\"width:600px\\">Wide in shadow</div>"</script>')],
  ['open shadow, includeShadowDom false', page('', '<div id="host"></div><script>document.getElementById("host").attachShadow({mode:"open"}).innerHTML="<div id=\\"inner\\" style=\\"width:600px\\">Wide in shadow</div>"</script>'), { engineOptions: { includeShadowDom: false } }],
  ['collapsed panel, content below', page('.panel{overflow:hidden;height:40px} .row{width:560px}', '<div class="panel"><p>Shown</p><div class="row" id="r">Below the fold of the panel</div></div>')],
  ['card: only help text cut, field whole', page('.card{overflow:hidden;width:280px} .row{display:flex;width:560px} .row>*{flex:none}', '<div class="card"><div class="row" id="r"><input style="width:200px"><span style="width:300px">Help text that is cut off by the card</span></div></div>')],
  ['card: field cut', page('.card{overflow:hidden;width:280px} .row{display:flex;width:560px} .row>*{flex:none;width:270px}', '<div class="card"><div class="row" id="r"><label>A <input></label><label>B <input></label></div></div>')],
  ['card: hidden radios in carousel', page('.card{overflow:hidden;width:280px} .row{display:flex;width:560px} .row>*{flex:none;width:270px} input{display:none}', '<div class="card"><div class="row" id="r"><div><input type="radio" name="s">One</div><div><input type="radio" name="s">Two</div></div></div>')],
  ['card: disabled fields cut', page('.card{overflow:hidden;width:280px} .row{display:flex;width:560px} .row>*{flex:none;width:270px}', '<div class="card"><div class="row" id="r"><label>A <input disabled></label><label>B <input disabled></label></div></div>')],
  ['card: buttons cut', page('.card{overflow:hidden;width:280px} .row{display:flex;width:560px} .row>*{flex:none;width:270px}', '<div class="card"><div class="row" id="r"><button>Accept</button><input type="submit" value="Reject"></div></div>')],
  ['card: contenteditable plaintext-only cut', page('.card{overflow:hidden;width:280px} .ed{width:560px}', '<div class="card"><div class="ed" id="e" contenteditable="plaintext-only">Edit me</div></div>')]
];
