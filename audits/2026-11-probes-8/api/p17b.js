const core = require('/home/user/core-r8/src/index.js');
console.warn = () => {};
const ids = Array.from({ length: 40000 }, (_, i) => i ? 'nope' + i : 'img-alt-present');
core.getChecksForRunOnly({ includeRuleIds: ids });
