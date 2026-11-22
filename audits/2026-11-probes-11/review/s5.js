const fs=require('fs');
const { run } = require('./sc.js');
const F='/home/user/r11-review/tests/fixtures/';
run([
 ['rtcl fixture', fs.readFileSync(F+'resize-text-content-loss-all-scenarios.html','utf8'), 'scrollable-region-focusable'],
 ['tscl fixture', fs.readFileSync(F+'text-spacing-content-loss-all-scenarios.html','utf8'), 'scrollable-region-focusable'],
 ['article', fs.readFileSync(__dirname+'/../bugs/pages/article.html','utf8'), 'scrollable-region-focusable'],
]);
