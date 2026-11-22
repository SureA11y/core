const { run, page } = require('./sc.js');
const L='color:#ccc;background:#fff';
run([
 ['contrast-minimum: button in first legend of disabled fieldset', page(`<fieldset disabled><legend><button style="${L}">Help me</button></legend><input aria-label=x></fieldset>`), 'contrast-minimum'],
 ['symbol: input value in first legend', page(`<fieldset disabled><legend><label style="${L}">★<input type=checkbox></label></legend></fieldset>`), 'symbol-graphic-contrast'],
]);
