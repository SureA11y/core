/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Regenerates the ARIA global and per-role attribute tables inside
 * src/checks/automatic/aria-allowed-attr.js from aria-query.
 *
 * Usage:
 *   node scripts/generate-aria-tables.js
 *   node scripts/generate-aria-tables.js --check    (CI: fail if stale)
 *
 * aria-query is a devDependency and the generated arrays are committed, so
 * the engine keeps zero runtime dependencies and table changes show up in
 * review diffs. The arrays live inside runInPage because build-core.js
 * inlines only that function's own source text.
 *
 * aria-query is third party. Where it disagrees with ACT or the ARIA spec,
 * the spec wins: fix the rule and record why, rather than trusting the
 * package by default.
 */

const fs = require('node:fs');
const path = require('node:path');
const { roles } = require('aria-query');

const RULE_PATH = path.join(__dirname, '..', 'src', 'checks', 'automatic', 'aria-allowed-attr.js');

const BEGIN_GLOBAL = '  // <generated:aria-global-attrs>';
const END_GLOBAL = '  // </generated:aria-global-attrs>';
const BEGIN_ROLES = '  // <generated:aria-role-attrs>';
const END_ROLES = '  // </generated:aria-role-attrs>';

// Every role inherits roletype's properties, so those are exactly the ARIA
// global states and properties. Deriving them keeps the list from drifting:
// aria-disabled, aria-haspopup, aria-invalid and aria-errormessage are
// supported by many roles but are NOT global, and treating them as global
// suppresses real violations.
// aria-query tracks ARIA 1.2, so globals added since are absent from
// roletype. They are listed here rather than dropped: omitting them makes the
// rule report a false positive on every element that uses one.
const SUPPLEMENTAL_GLOBALS = [
  'aria-braillelabel',
  'aria-brailleroledescription',
  'aria-description'
];

function globalAttrs() {
  const roletype = roles.get('roletype');
  return [...new Set([...Object.keys(roletype.props || {}), ...SUPPLEMENTAL_GLOBALS])].sort();
}

function roleAttrs(globals) {
  const globalSet = new Set(globals);
  const out = {};
  for (const [name, def] of roles.entries()) {
    if (def.abstract) continue;
    const supported = new Set([
      ...Object.keys(def.props || {}),
      ...Object.keys(def.requiredProps || {})
    ]);
    const specific = [...supported].filter((a) => !globalSet.has(a)).sort();
    out[name] = specific;
  }
  return out;
}

function renderGlobals(list) {
  return [
    BEGIN_GLOBAL,
    '  const GLOBAL_ATTRS = [',
    ...list.map((a) => `    '${a}',`),
    '  ];',
    END_GLOBAL
  ].join('\n');
}

function renderRoles(table) {
  const lines = [BEGIN_ROLES, '  const SUPPORTED_ATTRS_BY_ROLE = {'];
  for (const name of Object.keys(table).sort()) {
    const attrs = table[name];
    // DPUB and graphics roles are hyphenated, so keys are quoted when they
    // are not valid identifiers.
    const key = /^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`;
    lines.push(`    ${key}: [${attrs.map((a) => `'${a}'`).join(', ')}],`);
  }
  lines.push('  };', END_ROLES);
  return lines.join('\n');
}

function replaceBlock(source, begin, end, replacement) {
  const start = source.indexOf(begin);
  const stop = source.indexOf(end);
  if (start === -1 || stop === -1) {
    throw new Error(`Markers not found: ${begin} ... ${end}`);
  }
  return source.slice(0, start) + replacement + source.slice(stop + end.length);
}

function main() {
  const check = process.argv.includes('--check');
  const globals = globalAttrs();
  const table = roleAttrs(globals);

  let source = fs.readFileSync(RULE_PATH, 'utf8');
  const before = source;
  source = replaceBlock(source, BEGIN_GLOBAL, END_GLOBAL, renderGlobals(globals));
  source = replaceBlock(source, BEGIN_ROLES, END_ROLES, renderRoles(table));

  if (check) {
    if (before !== source) {
      console.error('ARIA tables are stale. Run: node scripts/generate-aria-tables.js');
      process.exit(1);
    }
    console.log('ARIA tables are up to date.');
    return;
  }

  fs.writeFileSync(RULE_PATH, source);
  console.log(
    `Wrote ${Object.keys(table).length} concrete role(s) and ${globals.length} global attribute(s) into ${path.relative(process.cwd(), RULE_PATH)}`
  );
}

main();
