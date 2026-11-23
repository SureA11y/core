'use strict';

// A node:test reporter that writes each test file's time, in milliseconds, as
// one JSON object keyed by file. scripts/run-tests.js --record-timings uses it.

module.exports = async function* timingsReporter(source) {
  const byFile = {};
  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    const { nesting, file, details } = event.data;
    if (nesting !== 0 || !file) continue;
    byFile[file] = (byFile[file] || 0) + details.duration_ms;
  }
  yield JSON.stringify(byFile);
};
