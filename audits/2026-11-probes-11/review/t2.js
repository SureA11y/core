const { run, page } = require('./sc.js');
run([
 ['div tabindex 2147483648', page('<div tabindex="2147483648">Card</div>'), 'tabindex'],
 ['button tabindex 99999999999', page('<button tabindex="99999999999">Go</button>'), 'tabindex'],
 ['div tabindex 2147483647', page('<div tabindex="2147483647">Card</div>'), 'tabindex'],
 ['div tabindex 1.5', page('<div tabindex="1.5">Card</div>'), 'tabindex'],
 ['div tabindex " +2"', page('<div tabindex=" +2">Card</div>'), 'tabindex'],
 ['div tabindex nbsp1', page('<div tabindex=" 1">Card</div>'), 'tabindex'],
 ['iframe untitled tabindex -2147483649', page('<iframe tabindex="-2147483649" src="about:blank"></iframe>'), 'iframe-name-present'],
 ['iframe untitled tabindex -1x', page('<iframe tabindex="-1x" src="about:blank"></iframe>'), 'iframe-name-present'],
]);
