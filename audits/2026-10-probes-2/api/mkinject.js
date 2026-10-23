const fs = require('fs');
const lines = fs.readFileSync('/home/user/core/src/core.js','utf8').split('\n');
const iife = lines.slice(82347, 82746).join('\n');
const core = require('/home/user/core/src/index.js');
const src = 'window.runa11yCoreInPage = ' + core.runa11yCoreInPage.toString() + ';\nvar runa11yCoreInPage = window.runa11yCoreInPage;\n' + iife + '\n';
fs.writeFileSync(__dirname + '/inject.js', src);
console.log(src.length);
