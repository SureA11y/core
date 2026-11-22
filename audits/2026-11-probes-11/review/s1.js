const { run, page } = require('./sc.js');
run([
 ['color:revert in grey box', page('<div style="color:#777;background:#888"><p style="color:revert">Some readable paragraph text</p></div>'), 'contrast-minimum'],
 ['overflow var visible: scrollable region', page('<div style="--o:visible;overflow:var(--o);height:40px"><p>Long text</p><p>more</p><p>more</p><p>more</p></div>'), 'scrollable-region-focusable'],
 ['overflow var visible: contrast clip', page('<div style="--o:visible;overflow:var(--o);height:10px;width:10px"><p style="color:#eee">Overflowing faint text here</p></div>'), 'contrast-minimum'],
]);
