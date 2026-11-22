const { run, page } = require('./sc.js');
run([
 ['svg #aaa text on black rect', page('<svg width="200" height="40"><rect width="200" height="40" fill="#000"/><text x="10" y="25" fill="#aaaaaa">Revenue 2026</text></svg>'), 'contrast-minimum'],
 ['svg #aaa text on black rect (css fill)', page('<svg width="200" height="40"><rect width="200" height="40" style="fill:#000"/><text x="10" y="25" style="fill:#aaaaaa">Revenue 2026</text></svg>'), 'contrast-minimum'],
]);
