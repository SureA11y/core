const P = (css, body) => [`<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.2 Arial}${css}</style></head><body><main>${body}</main></body></html>`];
module.exports = [
 ['fixed height overflow hidden', P('.c{height:40px;overflow:hidden;width:200px}', '<div class=c id=t>One two three four five six seven eight nine ten eleven twelve</div>')],
 ['text-overflow ellipsis nowrap', P('.c{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:200px}', '<div class=c id=t>Short label text here ok</div>')],
 ['button fixed height', P('button{height:20px;width:60px;overflow:hidden;font:16px/1 Arial}', '<button id=t>Submit now</button>')],
 ['vertical-rl box fixed width', P('.c{writing-mode:vertical-rl;width:40px;height:200px;overflow:hidden}', '<div class=c id=t>One two three four five six seven eight nine</div>')],
 ['rtl fixed', P('.c{direction:rtl;height:40px;overflow:hidden;width:200px}', '<div class=c id=t dir=rtl>مرحبا بالعالم هذا نص طويل يكفي لملء سطرين على الأقل في هذا الصندوق</div>')],
 ['nested in transform scale', P('.w{transform:scale(.5);transform-origin:0 0}.c{height:40px;overflow:hidden;width:200px}', '<div class=w><div class=c id=t>One two three four five six seven eight nine ten eleven twelve</div></div>')],
 ['shadow dom fixed height', P('', '<div id=host></div><script>const s=document.getElementById("host").attachShadow({mode:"open"});s.innerHTML="<style>.c{height:40px;overflow:hidden;width:200px}</style><div class=c id=t>One two three four five six seven eight nine ten eleven twelve</div>"</script>')],
 ['iframe fixed height', P('', `<iframe srcdoc="<style>body{font:16px/1.2 Arial}.c{height:40px;overflow:hidden;width:200px}</style><div class=c>One two three four five six seven eight nine ten eleven twelve</div>" style="width:400px;height:200px"></iframe>`)],
 ['grid fixed rows overlap', P('.g{display:grid;grid-template-rows:40px 40px;width:200px}', '<div class=g><div id=t>One two three four five six seven eight nine ten eleven twelve</div><div>Second row text</div></div>')],
 ['abs positioned overlap', P('.r{position:relative;width:200px}.b{position:absolute;top:40px}', '<div class=r><div id=t>One two three four five six seven eight nine ten eleven twelve</div><div class=b>Below text</div></div>')],
 ['line-clamp', P('.c{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:200px}', '<div class=c id=t>One two three four five six seven eight nine ten eleven twelve thirteen fourteen</div>')],
 ['input fixed width value', P('input{width:80px;font:16px Arial}', '<label>Name <input id=t value="Jonathan"></label>')],
 ['svg foreignObject', P('', '<svg width=300 height=100><foreignObject width=200 height=40><div xmlns="http://www.w3.org/1999/xhtml" style="font:16px/1.2 Arial">One two three four five six seven eight nine ten eleven</div></foreignObject></svg>')],
 ['container query unit height', P('.cq{container-type:size;width:200px;height:40px}.c{height:100cqh;overflow:hidden}', '<div class=cq><div class=c id=t>One two three four five six seven eight nine ten eleven twelve</div></div>')],
 ['clip-path circle', P('.c{height:40px;width:200px;clip-path:circle(60%)}', '<div class=c id=t>One two three four five six seven eight nine ten eleven twelve</div>')],
];
