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
const { roles, elementRoles } = require('aria-query');

const RULE_PATH = path.join(__dirname, '..', 'src', 'checks', 'automatic', 'aria-allowed-attr.js');
const HELPERS_PATH = path.join(__dirname, '..', 'src', 'core', 'aria-helpers.js');

const BEGIN_GLOBAL = '  // <generated:aria-global-attrs>';
const END_GLOBAL = '  // </generated:aria-global-attrs>';
const BEGIN_ROLES = '  // <generated:aria-role-attrs>';
const BEGIN_IMPLICIT = '  // <generated:aria-implicit-roles>';
const END_IMPLICIT = '  // </generated:aria-implicit-roles>';
const BEGIN_ABSTRACT = '  // <generated:aria-abstract-roles>';
const END_ABSTRACT = '  // </generated:aria-abstract-roles>';
const BEGIN_NAME_FROM_CONTENT = '    // <generated:aria-name-from-content>';
const END_NAME_FROM_CONTENT = '    // </generated:aria-name-from-content>';
const BEGIN_CONCRETE = '  // <generated:aria-concrete-roles>';
const END_CONCRETE = '  // </generated:aria-concrete-roles>';

// ARIA 1.3 roles aria-query does not carry yet. Dropping them would report a
// valid role as unrecognised.
const SUPPLEMENTAL_CONCRETE_ROLES = ['comment', 'suggestion', 'text'];

function roleSets() {
  const concrete = new Set(SUPPLEMENTAL_CONCRETE_ROLES);
  const abstract = new Set();
  for (const [name, def] of roles.entries()) (def.abstract ? abstract : concrete).add(name);
  return { concrete, abstract };
}

function renderRoleSet(begin, end, name, values) {
  return [
    begin,
    `  const ${name} = new Set([`,
    ...[...values].sort().map((v) => `    '${v}',`),
    '  ]);',
    end
  ].join('\n');
}
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

// Elements whose implicit role is the same in every context, each confirmed
// against Chrome's accessibility tree. aria-query supplies the role value;
// this list gates which elements are allowed through, so a package update
// cannot silently widen the rule.
//
// Deliberately absent, with the condition that rules them out:
//   a          role depends on href (link vs generic)
//   aside      complementary only outside sectioning content
//   section    generic until it has an accessible name, then region
//   select     combobox, or listbox with multiple/size>1
//   li         listitem only inside ul/ol/menu
//   img        role depends on alt
//   header     banner only outside sectioning content, same for footer
//   table, tbody, thead, tfoot, tr, th, td
//              HTML-AAM assigns table roles, but browsers drop them for
//              layout tables, so the role is not context-free in practice
//   datalist   not exposed at all (Chrome reports no role)
const CONTEXT_FREE_ELEMENTS = [
  'article',
  'blockquote',
  'button',
  'caption',
  'code',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'dt',
  'em',
  'fieldset',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'ins',
  'main',
  'mark',
  'menu',
  'meter',
  'nav',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'progress',
  'strong',
  'sub',
  'sup',
  'textarea',
  'time',
  'ul'
];

// input roles are keyed by type. Only types with a stable ARIA role are
// listed: color, date, time, month, week, datetime-local and file report
// browser-internal names with no ARIA equivalent, and hidden is not exposed.
const INPUT_ROLES = {
  text: 'textbox',
  tel: 'textbox',
  url: 'textbox',
  email: 'textbox',
  password: 'textbox',
  search: 'searchbox',
  number: 'spinbutton',
  range: 'slider',
  checkbox: 'checkbox',
  radio: 'radio',
  button: 'button',
  submit: 'button',
  reset: 'button',
  image: 'button'
};

function implicitRoles() {
  const allowed = new Set(CONTEXT_FREE_ELEMENTS);
  const bySource = new Map();
  for (const [concept, roleSet] of elementRoles.entries()) {
    if (!allowed.has(concept.name)) continue;
    if ((concept.attributes && concept.attributes.length) || concept.constraints) continue;
    const list = [...roleSet];
    if (list.length !== 1) continue;
    bySource.set(concept.name, list[0]);
  }
  const missing = CONTEXT_FREE_ELEMENTS.filter((e) => !bySource.has(e));
  if (missing.length) {
    throw new Error(
      `aria-query no longer supplies a single unconditional role for: ${missing.join(', ')}`
    );
  }
  const out = {};
  for (const name of CONTEXT_FREE_ELEMENTS) out[name] = bySource.get(name);
  for (const [type, role] of Object.entries(INPUT_ROLES)) out[`input[type=${type}]`] = role;
  return out;
}

function renderImplicit(table, nonGlobalAttrs) {
  const lines = [BEGIN_IMPLICIT, '  const IMPLICIT_ROLE_BY_ELEMENT = {'];
  for (const key of Object.keys(table)) {
    const k = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`;
    lines.push(`    ${k}: '${table[key]}',`);
  }
  lines.push('  };');
  // Only a non-global attribute can ever be disallowed, so the rule looks for
  // elements carrying one instead of walking every node on the page.
  lines.push('  const NON_GLOBAL_ARIA_ATTR_SELECTOR =');
  const sel = nonGlobalAttrs.map((a) => `[${a}]`).join(', ');
  lines.push(`    '${sel}';`);
  lines.push(END_IMPLICIT);
  return lines.join('\n');
}

// Every ARIA property any concrete role supports, minus the globals.
function nonGlobalAttrs(globals, table) {
  const globalSet = new Set(globals);
  const all = new Set();
  for (const attrs of Object.values(table)) for (const a of attrs) all.add(a);
  return [...all].filter((a) => !globalSet.has(a)).sort();
}

// Roles whose accessible name may come from their own content. Derived from
// nameFrom rather than the ARIA 5.2.8.5 list alone, so module roles that
// inherit it are included: doc-noteref inherits from link and Chrome names
// <a role="doc-noteref"><sup>1</sup></a> "1".
function nameFromContentRoles() {
  const out = [];
  for (const [name, def] of roles.entries()) {
    if (def.abstract) continue;
    if ((def.nameFrom || []).includes('contents')) out.push(name);
  }
  return out.sort();
}

function renderNameFromContent(list) {
  return [
    BEGIN_NAME_FROM_CONTENT,
    '    const NAME_FROM_CONTENT_ROLES = [',
    ...list.map((r) => `      '${r}',`),
    '    ];',
    END_NAME_FROM_CONTENT
  ].join('\n');
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
  const implicit = implicitRoles();

  let source = fs.readFileSync(RULE_PATH, 'utf8');
  const before = source;
  source = replaceBlock(source, BEGIN_GLOBAL, END_GLOBAL, renderGlobals(globals));
  source = replaceBlock(source, BEGIN_ROLES, END_ROLES, renderRoles(table));
  source = replaceBlock(
    source,
    BEGIN_IMPLICIT,
    END_IMPLICIT,
    renderImplicit(implicit, nonGlobalAttrs(globals, table))
  );

  let helpers = fs.readFileSync(HELPERS_PATH, 'utf8');
  const helpersBefore = helpers;
  const sets = roleSets();
  helpers = replaceBlock(
    helpers,
    BEGIN_ABSTRACT,
    END_ABSTRACT,
    renderRoleSet(BEGIN_ABSTRACT, END_ABSTRACT, 'ABSTRACT_ROLES', sets.abstract)
  );
  helpers = replaceBlock(
    helpers,
    BEGIN_CONCRETE,
    END_CONCRETE,
    renderRoleSet(BEGIN_CONCRETE, END_CONCRETE, 'CONCRETE_ROLES', sets.concrete)
  );

  if (check) {
    if (before !== source || helpersBefore !== helpers) {
      console.error('ARIA tables are stale. Run: node scripts/generate-aria-tables.js');
      process.exit(1);
    }
    console.log('ARIA tables are up to date.');
    return;
  }

  fs.writeFileSync(RULE_PATH, source);
  fs.writeFileSync(HELPERS_PATH, helpers);

  const nfc = nameFromContentRoles();
  for (const rel of [
    'src/checks/automatic/link-name-present.js',
    'src/checks/automatic/button-name-present.js'
  ]) {
    const file = path.join(__dirname, '..', rel);
    const before = fs.readFileSync(file, 'utf8');
    const after = replaceBlock(
      before,
      BEGIN_NAME_FROM_CONTENT,
      END_NAME_FROM_CONTENT,
      renderNameFromContent(nfc)
    );
    fs.writeFileSync(file, after);
  }
  console.log(`Wrote ${nfc.length} name-from-content role(s) into the naming rules`);
  console.log(
    `Wrote ${Object.keys(table).length} concrete role(s), ${globals.length} global attribute(s) and ${Object.keys(implicit).length} implicit-role mapping(s) into ${path.relative(process.cwd(), RULE_PATH)}`
  );
}

main();
