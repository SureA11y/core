const { run, page } = require('./sc.js');
run([
 ['svg white text on dark rect', page('<svg width="200" height="40"><rect width="200" height="40" fill="#1a73e8"/><text x="10" y="25" fill="#ffffff">Download</text></svg>'), 'contrast-minimum'],
 ['svg white text via g fill on dark rect', page('<svg width="200" height="40"><rect width="200" height="40" fill="#333"/><g fill="white"><text x="10" y="25">Chart label</text></g></svg>'), 'contrast-minimum'],
 ['td bgcolor dark, font white', page('<table><tr><td bgcolor="#000"><font color="#fff">Cell text here</font></td></tr></table>'), 'contrast-minimum'],
 ['body bgcolor + text', '<!doctype html><html lang="en"><head><title>t</title></head><body bgcolor="#000" text="#fff"><main><p>Body text here</p></main></body></html>', 'contrast-minimum'],
]);
