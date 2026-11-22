const { run, page } = require('./sc.js');
run([
 ['iframe untitled no tabindex', page('<iframe src="about:blank"></iframe>'), 'iframe-name-present'],
 ['iframe untitled tabindex 0', page('<iframe tabindex="0" src="about:blank"></iframe>'), 'iframe-name-present'],
 ['iframe untitled tabindex -2147483649', page('<iframe tabindex="-2147483649" src="about:blank"></iframe>'), 'iframe-name-present'],
]);
