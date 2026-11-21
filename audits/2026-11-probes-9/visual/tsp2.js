const P = (css, body) => [`<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.2 Arial}${css}</style></head><body><main>${body}</main></body></html>`];
const T = 'One two three four five six seven eight nine ten'; // ~2 lines in 200px
module.exports = [
 ['fixed height 2 lines fit', P('.c{height:40px;overflow:hidden;width:200px}', `<div class=c id=t>${T}</div>`)],
 ['grid fixed rows overlap', P('.g{display:grid;grid-template-rows:40px 40px;width:200px}', `<div class=g><div id=t>${T}</div><div>Second row text</div></div>`)],
 ['abs positioned overlap', P('.r{position:relative;width:200px}.b{position:absolute;top:40px}', `<div class=r><div id=t>${T}</div><div class=b>Below text</div></div>`)],
 ['line-clamp 2 of 2', P('.c{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:200px}', `<div class=c id=t>${T}</div>`)],
 ['line-clamp 2 of 3', P('.c{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:200px}', `<div class=c id=t>${T} eleven twelve thirteen fourteen</div>`)],
 ['line-clamp 3 of 3 short', P('.c{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:220px}', `<div class=c id=t>One two three four five six seven eight nine</div>`)],
 ['line-clamp std', P('.c{line-clamp:2;overflow:hidden;width:200px}', `<div class=c id=t>${T}</div>`)],
 ['sticky header overlap after spacing', P('.h{position:sticky;top:0;background:#fff;height:30px;overflow:hidden}', `<div class=h id=t>Header title text</div><p>${T}</p>`)],
 ['negative margin pulls next', P('.a{width:200px;height:40px}.b{margin-top:0}', `<div class=a id=t>${T}</div><div class=b>Next block text</div>`)],
 ['float beside fixed height', P('.f{float:left;width:100px;height:40px;overflow:hidden}', `<div class=f id=t>One two three four five</div><p>Para text here</p>`)],
];
