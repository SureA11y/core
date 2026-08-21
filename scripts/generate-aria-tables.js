/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Regenerates the ARIA global and per-role attribute tables inside
 * src/checks/automatic/aria-allowed-attr.js, and the name-required role set
 * inside src/checks/automatic/aria-role-name-present.js, from aria-query.
 *
 * Usage:
 *   node scripts/generate-aria-tables.js
 *   node scripts/generate-aria-tables.js --check    (CI: fail if stale)
 *
 * aria-query is a devDependency and the generated arrays are committed, so
 * the engine keeps zero runtime dependencies and table changes show up in
 * review diffs. Output is run through Prettier before it is written or
 * compared, so `--check` measures the data and not the formatting. The arrays live inside runInPage because build-core.js
 * inlines only that function's own source text.
 *
 * aria-query is third party. Where it disagrees with ACT or the ARIA spec,
 * the spec wins: fix the rule and record why, rather than trusting the
 * package by default.
 */

const fs = require('node:fs');
const path = require('node:path');
const { roles, elementRoles } = require('aria-query');
// The repo formats its sources with Prettier, so the generator formats what it
// writes the same way. Without this the written file differs from the
// committed one by whitespace alone, and --check reports every run as stale.
const prettier = require('prettier');

const RULE_PATH = path.join(__dirname, '..', 'src', 'checks', 'automatic', 'aria-allowed-attr.js');
const HELPERS_PATH = path.join(__dirname, '..', 'src', 'core', 'aria-helpers.js');
const PROHIBITED_CHILDREN_RULE_PATH = path.join(
  __dirname,
  '..',
  'src',
  'checks',
  'automatic',
  'aria-prohibited-children.js'
);
const NAME_REQUIRED_RULE_PATH = path.join(
  __dirname,
  '..',
  'src',
  'checks',
  'automatic',
  'aria-role-name-present.js'
);

const BEGIN_GLOBAL = '  // <generated:aria-global-attrs>';
const END_GLOBAL = '  // </generated:aria-global-attrs>';
const BEGIN_ROLES = '  // <generated:aria-role-attrs>';
const BEGIN_IMPLICIT = '  // <generated:aria-implicit-roles>';
const END_IMPLICIT = '  // </generated:aria-implicit-roles>';
const BEGIN_ROLELESS = '  // <generated:aria-roleless-elements>';
const END_ROLELESS = '  // </generated:aria-roleless-elements>';
const BEGIN_ABSTRACT = '  // <generated:aria-abstract-roles>';
const END_ABSTRACT = '  // </generated:aria-abstract-roles>';
const BEGIN_NAME_FROM_CONTENT = '    // <generated:aria-name-from-content>';
const END_NAME_FROM_CONTENT = '    // </generated:aria-name-from-content>';
const BEGIN_CONCRETE = '  // <generated:aria-concrete-roles>';
const END_CONCRETE = '  // </generated:aria-concrete-roles>';
const BEGIN_NAME_REQUIRED = '  // <generated:aria-name-required-roles>';
const END_NAME_REQUIRED = '  // </generated:aria-name-required-roles>';
const BEGIN_ALLOWED_EXTRA = '  // <generated:aria-allowed-extra-owned-roles>';
const END_ALLOWED_EXTRA = '  // </generated:aria-allowed-extra-owned-roles>';

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
  'div',
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
  'span',
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

// Elements HTML-AAM maps to no ARIA role at all, in any context — not
// `generic`, not `presentation`: nothing. A role-specific ARIA attribute on one
// of these is supported by nothing, which is what ACT 5c01ea's failed example 2
// (`<audio controls aria-orientation="horizontal">`) turns on. Hand-listed
// because their absence is the fact being encoded, and absence cannot be read
// out of aria-query; verified below against it so a package that starts
// supplying a role for them breaks the build rather than the rule.
const ROLELESS_ELEMENTS = ['audio', 'video'];

function rolelessElements() {
  const named = new Set();
  for (const [concept] of elementRoles.entries()) named.add(concept.name);
  const nowMapped = ROLELESS_ELEMENTS.filter((e) => named.has(e));
  if (nowMapped.length) {
    throw new Error(
      `aria-query now supplies a role for elements listed as roleless: ${nowMapped.join(', ')}`
    );
  }
  return [...ROLELESS_ELEMENTS].sort();
}

function renderRoleless(list) {
  return [
    BEGIN_ROLELESS,
    '  const ROLELESS_ELEMENTS = new Set([',
    ...list.map((e) => `    '${e}',`),
    '  ]);',
    END_ROLELESS
  ].join('\n');
}

// Roles the generic aria-role-name-present rule owns: WAI-ARIA marks each one
// "Accessible Name Required: True" and names it from the author only, so an
// unnamed instance is a real SC 4.1.2 failure and not an authoring preference.
// The distinction that matters here is required vs. merely allowed: tablist,
// toolbar, menu, menubar and scrollbar are all name-from-author roles the spec
// does NOT require a name for, and the rule used to fail them anyway.
//
// Hand-listed because membership is a scope decision, not a spec fact --
// aria-query cannot say which roles another rule already owns. Every entry is
// verified against it below, so a role that stops requiring a name, or gains a
// name-from-contents path, breaks the build instead of the rule.
//
// Name-required roles deliberately absent, already owned by a dedicated rule:
//   alertdialog, dialog  dialog-name-present
//   combobox             combobox-name-present
//   img                  img-alt-present / role-img-alt-present
//   listbox              listbox-name-present
//   region               region-manual
//   searchbox            searchbox-name-present
//   slider               slider-name-present
//   spinbutton           spinbutton-name-present
//   textbox              textbox-name-present
// meter and progressbar have dedicated rules too, but those map to SC 1.1.1;
// keeping both here is what gives the two roles any 4.1.2 coverage at all.
//
// Name-required roles with no rule anywhere yet -- a real gap, tracked in
// docs/DESIGN_CHALLENGES.md rather than closed here, because each one means new
// failures on existing scans and deserves its own change:
//   application, marquee, table, tabpanel, treegrid
//   doc-biblioentry, doc-pagebreak, doc-part (DPUB), graphics-document,
//   graphics-symbol (Graphics module)
const NAME_REQUIRED_ROLES = ['grid', 'meter', 'progressbar', 'radiogroup', 'tree'];

function nameRequiredRoles() {
  for (const name of NAME_REQUIRED_ROLES) {
    const def = roles.get(name);
    if (!def) {
      throw new Error(`aria-query no longer defines the role: ${name}`);
    }
    if (!def.accessibleNameRequired) {
      throw new Error(`aria-query no longer requires an accessible name for role: ${name}`);
    }
    if ((def.nameFrom || []).includes('contents')) {
      throw new Error(
        `role ${name} now takes its name from contents; aria-role-name-present never accepts ` +
          'subtree text, so it can no longer own this role'
      );
    }
  }
  return [...NAME_REQUIRED_ROLES].sort();
}

// Roles a container may own even though they are not among its REQUIRED owned
// elements. WAI-ARIA's "Required Owned Elements" answers what a container MUST
// contain, not the exhaustive list of what it MAY contain, and
// aria-prohibited-children previously used the required set as though it were
// both -- so a separator between menu items, and a caption on a grid, were
// reported as prohibited children.
//
// Two sources, and an entry needs one of them:
//   1. ARIA gives the child role a Required Context Role naming this
//      container. That is the spec stating the child belongs here, so
//      prohibiting it contradicts ARIA's own data. `caption` (Required
//      Context Role: figure, grid, table) is the case: the engine's own
//      REQUIRED_CONTEXT_ROLE table says a caption must be in a table/grid
//      while this rule said it may not. Checked mechanically below.
//   2. The role's own spec definition says it belongs there. `separator` is
//      defined as "a divider that separates and distinguishes sections of
//      content or groups of menuitems", and the WAI-ARIA Authoring Practices
//      menu and menubar patterns use separators throughout. separator has no
//      Required Context Role at all (it may appear anywhere), so source 1
//      cannot express this and it is listed by hand.
//
// Deliberately NOT added:
//   treegrid: caption   aria-query gives caption's context as figure/grid/
//                       table only. treegrid subclasses grid, so this may
//                       well be a spec gap, but adding it would be this
//                       repo's judgement rather than ARIA's -- the validator
//                       below rejects it on purpose.
//   rowgroup: rowheader aria-query lists rowgroup in rowheader's context, but
//                       HTML has no counterpart (a <th> must live in a <tr>)
//                       and the ARIA spec's own rowheader definition is row.
//                       Per this file's header, the spec wins over the
//                       package; left out until it can be checked against the
//                       spec directly.
//   list: separator     a separator is not a legal child of <ul>/<ol>, which
//                       admit only <li> plus script-supporting elements, and
//                       no spec text extends the menuitem carve-out to lists.
const ALLOWED_EXTRA_OWNED_ROLES = {
  grid: ['caption'],
  menu: ['separator'],
  menubar: ['separator'],
  table: ['caption']
};

function allowedExtraOwnedRoles() {
  const out = {};
  for (const container of Object.keys(ALLOWED_EXTRA_OWNED_ROLES).sort()) {
    const containerDef = roles.get(container);
    if (!containerDef) {
      throw new Error(`aria-query no longer defines the container role: ${container}`);
    }
    const required = new Set(
      (containerDef.requiredOwnedElements || [])
        .map((path) => path[path.length - 1])
        .filter(Boolean)
    );
    const extras = [...ALLOWED_EXTRA_OWNED_ROLES[container]].sort();
    for (const child of extras) {
      const childDef = roles.get(child);
      if (!childDef) {
        throw new Error(`aria-query no longer defines the role: ${child}`);
      }
      if (childDef.abstract) {
        throw new Error(`abstract role listed as an allowed owned child: ${child}`);
      }
      if (required.has(child)) {
        throw new Error(
          `${child} is already a required owned element of ${container}; drop the redundant entry`
        );
      }
      // Source 1: a child that declares required context roles must name this
      // container among them. A child with no context requirement at all
      // (separator) is unconstrained by ARIA and rests on source 2 instead.
      const context = childDef.requiredContextRole || childDef.requireContextRole || [];
      if (context.length && !context.includes(container)) {
        throw new Error(
          `${child} may not be owned by ${container}: ARIA's Required Context Role for ${child} ` +
            `is ${context.join(', ')}`
        );
      }
    }
    out[container] = extras;
  }
  return out;
}

function renderAllowedExtra(table) {
  const lines = [BEGIN_ALLOWED_EXTRA, '  const ALLOWED_EXTRA_OWNED_ROLES = {'];
  for (const container of Object.keys(table)) {
    lines.push(`    ${container}: [${table[container].map((r) => `'${r}'`).join(', ')}],`);
  }
  lines.push('  };', END_ALLOWED_EXTRA);
  return lines.join('\n');
}

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

const NAMING_RULE_PATHS = [
  'src/checks/automatic/link-name-present.js',
  'src/checks/automatic/button-name-present.js'
];

async function formatted(source, filepath) {
  const options = (await prettier.resolveConfig(filepath)) || {};
  return prettier.format(source, { ...options, filepath });
}

async function main() {
  const check = process.argv.includes('--check');
  const globals = globalAttrs();
  const table = roleAttrs(globals);
  const implicit = implicitRoles();
  const nfc = nameFromContentRoles();

  // path -> { before, after }, every file this generator owns a block in.
  const files = new Map();

  let source = fs.readFileSync(RULE_PATH, 'utf8');
  const ruleBefore = source;
  source = replaceBlock(source, BEGIN_GLOBAL, END_GLOBAL, renderGlobals(globals));
  source = replaceBlock(source, BEGIN_ROLES, END_ROLES, renderRoles(table));
  source = replaceBlock(
    source,
    BEGIN_IMPLICIT,
    END_IMPLICIT,
    renderImplicit(implicit, nonGlobalAttrs(globals, table))
  );
  source = replaceBlock(source, BEGIN_ROLELESS, END_ROLELESS, renderRoleless(rolelessElements()));
  files.set(RULE_PATH, { before: ruleBefore, after: source });

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
  files.set(HELPERS_PATH, { before: helpersBefore, after: helpers });

  const nameRequiredBefore = fs.readFileSync(NAME_REQUIRED_RULE_PATH, 'utf8');
  files.set(NAME_REQUIRED_RULE_PATH, {
    before: nameRequiredBefore,
    after: replaceBlock(
      nameRequiredBefore,
      BEGIN_NAME_REQUIRED,
      END_NAME_REQUIRED,
      renderRoleSet(
        BEGIN_NAME_REQUIRED,
        END_NAME_REQUIRED,
        'NAME_REQUIRED_ROLES',
        nameRequiredRoles()
      )
    )
  });

  const prohibitedBefore = fs.readFileSync(PROHIBITED_CHILDREN_RULE_PATH, 'utf8');
  files.set(PROHIBITED_CHILDREN_RULE_PATH, {
    before: prohibitedBefore,
    after: replaceBlock(
      prohibitedBefore,
      BEGIN_ALLOWED_EXTRA,
      END_ALLOWED_EXTRA,
      renderAllowedExtra(allowedExtraOwnedRoles())
    )
  });

  // The naming rules were previously written but never checked, so a stale
  // name-from-content block could not fail --check.
  for (const rel of NAMING_RULE_PATHS) {
    const file = path.join(__dirname, '..', rel);
    const before = fs.readFileSync(file, 'utf8');
    const after = replaceBlock(
      before,
      BEGIN_NAME_FROM_CONTENT,
      END_NAME_FROM_CONTENT,
      renderNameFromContent(nfc)
    );
    files.set(file, { before, after });
  }

  for (const [file, entry] of files) {
    entry.after = await formatted(entry.after, file);
  }

  if (check) {
    const stale = [...files.entries()]
      .filter(([, entry]) => entry.before !== entry.after)
      .map(([file]) => path.relative(process.cwd(), file));
    if (stale.length) {
      console.error(
        `ARIA tables are stale in ${stale.join(', ')}. Run: node scripts/generate-aria-tables.js`
      );
      process.exit(1);
    }
    console.log('ARIA tables are up to date.');
    return;
  }

  for (const [file, entry] of files) {
    if (entry.before !== entry.after) fs.writeFileSync(file, entry.after);
  }

  console.log(`Wrote ${nfc.length} name-from-content role(s) into the naming rules`);
  console.log(
    `Wrote ${Object.keys(table).length} concrete role(s), ${globals.length} global attribute(s) and ${Object.keys(implicit).length} implicit-role mapping(s) into ${path.relative(process.cwd(), RULE_PATH)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
