'use strict';

const fs = require('node:fs');

/**
 * True when a rule's source can never report an occurrence: it does not call
 * reportOccurrence, and every `occurrences` it mentions is the literal empty
 * list. A guard that exists to police how occurrences are built or described
 * has nothing to say about such a rule.
 *
 * This gates on the property those guards care about rather than on
 * meta.deprecated: a deprecated rule normally keeps running and reporting
 * (docs/API_STABILITY.md), and one that still emits must stay under them.
 */
function emitsNothing(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('reportOccurrence')) return false;
  const mentions = src.match(/\boccurrences\b[^\n]*/g) || [];
  return mentions.every((m) => /^occurrences:\s*\[\]/.test(m));
}

module.exports = { emitsNothing };
