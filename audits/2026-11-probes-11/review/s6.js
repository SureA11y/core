const { run, page } = require('./sc.js');
run([
 ['overflow var(--o) visible', page('<div id=b style="--o:visible;overflow:var(--o);height:40px;width:100px">Opening hours today and tomorrow and more text here</div>'), 'scrollable-region-focusable'],
 ['overflow var(--o) auto', page('<div id=b style="--o:auto;overflow:var(--o);height:40px;width:100px">Opening hours today and tomorrow and more text here</div>'), 'scrollable-region-focusable'],
 ['overflow-y var visible', page('<div id=b style="--o:visible;overflow-y:var(--o);height:40px;width:100px">Opening hours today and tomorrow and more text here</div>'), 'scrollable-region-focusable'],
 ['overflow overlay', page('<div id=b style="overflow:overlay;height:40px;width:100px">Opening hours today and tomorrow and more text here</div>'), 'scrollable-region-focusable'],
]);
