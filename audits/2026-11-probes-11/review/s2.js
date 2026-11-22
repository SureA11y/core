const { run, page } = require('./sc.js');
run([
 ['svg rx percent', page('<svg width="300" height="200"><rect width="300" height="200" fill="#000000"/><rect x="10" y="10" width="270" height="180" rx="50%" fill="none" stroke="#ffffff" stroke-width="20"/><text id="t" x="22" y="40" fill="#888888" font-size="14">Growth</text></svg>'), 'contrast-minimum'],
 ['svg text fill only on rect', page('<svg width="300" height="60"><rect width="300" height="60" fill="#000"/><text x="5" y="30" fill="#222">Dark text on black</text></svg>'), 'contrast-minimum'],
 ['svg text no fill attr on black rect', page('<svg width="300" height="60"><rect width="300" height="60" fill="#000"/><text x="5" y="30">Default text on black</text></svg>'), 'contrast-minimum'],
 ['svg g fill', page('<svg width="300" height="60"><rect width="300" height="60" fill="#fff"/><g fill="#eee"><text x="5" y="30">Faint grouped text</text></g></svg>'), 'contrast-minimum'],
]);
