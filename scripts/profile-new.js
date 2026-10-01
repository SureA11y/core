'use strict';

/**
 * Create a new profile: a standard with verdicts of its own, built into the
 * engine from its own folder (profiles/README.md).
 *
 *   npm run profile:new -- <key> [--name "<Name>"]
 *
 * writes profiles/<key>/ with a working, empty standard, and adds it to
 * profiles/index.js:
 *
 * - index.js         the registry entry: one version, 1.0, and one profile,
 *                    `<key>-1.0`, on WCAG 2.2 A and AA plus the standard's
 *                    own rules (tag `<key>`)
 * - requirements.js  the standard's requirements, per version
 * - rule-map.js      which requirements each rule checks, per version
 * - mappings.js      the result entries and per-requirement rollups built from
 *                    those two tables, and the checks the build runs on them
 * - rules/           the standard's own rules (automatic/, manual/)
 * - i18n/            their messages, one <locale>.json per locale core has
 * - tests/           the profile's tests, starting with its entry's
 * - README.md        what to fill in, and where
 *
 * The result builds and passes every test as it is; filling it in is editing
 * the two tables and adding rules. `--root <dir>` writes into another copy of
 * the repository (the script's own tests use it).
 */

const fs = require('fs');
const path = require('path');

const KEY_RE = /^[a-z][a-z0-9-]*$/;
// Keys core's own standards use, and the WCAG tag prefix.
const RESERVED_KEYS = new Set(['wcag', 'en301549', 'best-practice', 'a11ycore']);

function parseArgs(argv) {
  const args = { key: null, name: null, root: path.join(__dirname, '..') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--name') args.name = argv[++i];
    else if (a === '--root') args.root = path.resolve(argv[++i]);
    else if (!a.startsWith('--') && !args.key) args.key = a;
  }
  return args;
}

const camel = (key) => key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

function checkKey(key, root) {
  if (!key || !KEY_RE.test(key)) {
    throw new Error(
      `"${key || ''}" is not a profile key: use lowercase letters, digits and '-', starting with a letter`
    );
  }
  if (RESERVED_KEYS.has(key) || key.startsWith('wcag')) {
    throw new Error(`"${key}" is reserved by core`);
  }
  if (fs.existsSync(path.join(root, 'profiles', key))) {
    throw new Error(`profiles/${key} already exists`);
  }
}

function indexJs({ key, name }) {
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ${name}, as a profile: its registry entry (see ENTRY SHAPE in
 * src/coverage/standards.js), its rules and its dictionaries. Created by
 * scripts/profile-new.js; README.md says what to fill in.
 */

const path = require('path');

const { VERSIONS } = require('./requirements');
const { mappingsFor, composites, validate } = require('./mappings');

// The WCAG version a profile builds on, as the tags of its A and AA rules.
const WCAG22_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

const standard = {
  key: ${JSON.stringify(key)},
  standard: ${JSON.stringify(name)},
  versions: VERSIONS.map((v) => v.version),
  // One conformance target per version: WCAG's rules, every rule the version
  // maps (mappedRules) and the standard's own rules (its tag).
  profiles: {
    ${JSON.stringify(`${key}-1.0`)}: {
      version: '1.0',
      tags: WCAG22_AA_TAGS.concat([${JSON.stringify(key)}]),
      mappedRules: true
    }
  },
  ruleTag: ${JSON.stringify(key)},
  ruleMapped: true,
  mappingsFor,
  composites,
  validate,
  report: { noteKey: ${JSON.stringify(`report_${camel(key)}Rollup_note`)} }
};

// The profile's own rules, in automatic/ and manual/, compiled with core's.
const rulesDir = path.join(__dirname, 'rules');

// Their messages, one <locale>.json per locale, added to core's.
const i18nDir = path.join(__dirname, 'i18n');

module.exports = { standard, rulesDir, i18nDir };
`;
}

function requirementsJs({ name }) {
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ${name}'s requirements, per version, as the standard publishes them.
 *
 * - VERSIONS: [{ version }], oldest first. A version needs a key in
 *   REQUIREMENTS and a profile in index.js.
 * - REQUIREMENTS[version][id]: { title, wcagSc }. \`id\` is the standard's own
 *   number ('1.2', 'B4'...), \`title\` its wording, and \`wcagSc\` the WCAG
 *   criteria the requirement corresponds to, if any (['1.4.3']).
 */

const VERSIONS = [{ version: '1.0' }];

const REQUIREMENTS = {
  '1.0': {}
};

module.exports = { VERSIONS, REQUIREMENTS };
`;
}

function ruleMapJs({ name }) {
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Which of ${name}'s requirements each rule checks, per version:
 * RULE_REQUIREMENTS[version][ruleId] = { requirements: [id...], note }.
 *
 * Any rule may be listed: a core rule (WCAG's or best practice's) or one of
 * the profile's own (rules/). A rule maps to a requirement when its failure,
 * or for a manual rule the question it raises, is direct evidence about what
 * the requirement asks. \`note\` says why, for review. The build rejects an
 * unknown rule or requirement (mappings.js, validate).
 */

const RULE_REQUIREMENTS = {
  '1.0': {}
};

module.exports = { RULE_REQUIREMENTS };
`;
}

function mappingsJs({ key, name }) {
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ${name}'s entries for a rule or a rollup, its rollups, and the checks the
 * build runs on its tables (index.js passes them to the registry).
 */

const { VERSIONS, REQUIREMENTS } = require('./requirements');
const { RULE_REQUIREMENTS } = require('./rule-map');

const STANDARD = ${JSON.stringify(name)};
const TAG = ${JSON.stringify(key)};

// Requirement ids in their natural order: '1.2' before '1.10'.
function compareIds(a, b) {
  return String(a).localeCompare(String(b), 'en', { numeric: true });
}

function requirementsOf(version, ruleId) {
  const row = (RULE_REQUIREMENTS[version] || {})[ruleId];
  return row && Array.isArray(row.requirements) ? row.requirements : [];
}

function entry(version, id) {
  const req = REQUIREMENTS[version][id];
  return {
    standard: STANDARD,
    version,
    requirement: id,
    title: req.title,
    wcagSc: Array.isArray(req.wcagSc) ? req.wcagSc.slice() : []
  };
}

// The entries for a rule ({ id }) or, given \`checksIds\`, for a rollup: the
// requirements its rules check, oldest version first.
function mappingsFor({ id, checksIds }) {
  const out = [];
  for (const { version } of VERSIONS) {
    const ids = new Set();
    for (const ruleId of Array.isArray(checksIds) ? checksIds : [id]) {
      for (const req of requirementsOf(version, ruleId)) ids.add(req);
    }
    for (const req of [...ids].sort(compareIds)) out.push(entry(version, req));
  }
  return out;
}

// One rollup per requirement a rule checks, grouping those rules. They carry
// the standard's tag, so only a run that asks for it produces them.
function composites() {
  const out = [];
  for (const { version } of VERSIONS) {
    const table = RULE_REQUIREMENTS[version] || {};
    for (const id of Object.keys(REQUIREMENTS[version]).sort(compareIds)) {
      const ruleIds = Object.keys(table)
        .filter((ruleId) => requirementsOf(version, ruleId).includes(id))
        .sort();
      if (!ruleIds.length) continue;
      out.push({
        id: \`\${TAG}-\${version}-\${id}\`,
        checksIds: ruleIds,
        meta: {
          title: REQUIREMENTS[version][id].title,
          description: '',
          wcagSc: [],
          level: null,
          standard: STANDARD,
          version,
          criterion: id,
          tags: [TAG],
          standardMappings: [entry(version, id)]
        }
      });
    }
  }
  return out;
}

// Problems with the tables, given every rule ([{ ruleId, wcagSc }]). The build
// fails on any.
function validate(rules) {
  const known = new Set(rules.map((r) => r.ruleId));
  const problems = [];
  const versions = VERSIONS.map((v) => v.version);
  for (const version of versions) {
    if (!REQUIREMENTS[version]) problems.push(\`version \${version} has no requirements table\`);
  }
  for (const [version, table] of Object.entries(RULE_REQUIREMENTS)) {
    if (!versions.includes(version)) {
      problems.push(\`rule-map.js names version \${version}, which VERSIONS does not list\`);
      continue;
    }
    for (const [ruleId, row] of Object.entries(table)) {
      if (!known.has(ruleId)) problems.push(\`\${version} \${ruleId}: no such rule\`);
      const reqs = row && Array.isArray(row.requirements) ? row.requirements : null;
      if (!reqs) {
        problems.push(\`\${version} \${ruleId}: requirements must be a list\`);
        continue;
      }
      for (const id of reqs) {
        if (!REQUIREMENTS[version] || !REQUIREMENTS[version][id]) {
          problems.push(\`\${version} \${ruleId}: no requirement \${id}\`);
        }
      }
      if (new Set(reqs).size !== reqs.length) {
        problems.push(\`\${version} \${ruleId}: a requirement is listed twice\`);
      }
    }
  }
  return problems;
}

module.exports = { mappingsFor, composites, validate };
`;
}

function entryTestJs({ key, name }) {
  return `'use strict';

/**
 * ${name}'s entry: registered, its profile selects rules, and its tables are
 * sound against the rules that exist.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../../src/index.js');
const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');
const { standard } = require('../index.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>Page</title></head>' +
  '<body><main><h1>Title</h1><img src="a.png"></main></body></html>';

test('its profile is known and selects rules', () => {
  const result = runa11yCoreOnHtml(PAGE, { engineOptions: { profile: ${JSON.stringify(`${key}-1.0`)} } });
  assert.equal(result.engine.profile, ${JSON.stringify(`${key}-1.0`)});
  assert.ok(result.checksResults.length > 0);
});

test('its tables are sound against the rules that exist', () => {
  const rules = core.getChecksCatalog().map((r) => ({ ruleId: r.ruleId, wcagSc: r.wcagSc || [] }));
  assert.deepEqual(standard.validate(rules), []);
});

test('no default or WCAG run produces its rollups', () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(PAGE, { engineOptions });
    assert.deepEqual(
      result.rulesResults.filter((r) => r.meta && r.meta.standard === standard.standard),
      []
    );
  }
});
`;
}

function readmeMd({ key, name }) {
  return `# ${name}

${name} as a profile of the engine. Created by \`npm run profile:new\`; see [\`profiles/README.md\`](../README.md) for what a profile is and what it may use.

## What to fill in

1. **Its requirements**, per version, in \`requirements.js\`: each requirement's number, title and the WCAG criteria it corresponds to.
2. **Which rules check them**, in \`rule-map.js\`: any core rule, or one of the profile's own, with the reason.
3. **Its own rules**, for requirements no core rule checks, in \`rules/automatic/\` or \`rules/manual/\`. Each one follows [\`docs/RULE_AUTHORING.md\`](../../docs/RULE_AUTHORING.md), carries the tag \`${key}\` (which makes it run only under this standard), and has a test in \`tests/rules/\` with its scenario page in \`tests/fixtures/\`.
4. **Their messages** in \`i18n/en.json\`, then \`npm run i18n:sync\` for the other locales.
5. **Their docs and records**: an example pair per rule in \`docs/RULE_EXAMPLES.md\`, then \`npm run docs:rule-catalog\`, \`fixtures:index\`, \`fixtures:markers\`, \`rule-examples:coverage\` and \`finding-ids\`, which write this profile's catalog, fixture index and records here, beside core's.
6. **Its versions and profiles**, if it has more than 1.0: \`VERSIONS\` in \`requirements.js\` and \`profiles\` in \`index.js\`.

\`npm run build && npm test\` builds the engine with it and runs its tests with everyone else's. \`tests/profile-boundary.test.js\` checks it uses only what core publishes.
`;
}

// Add the profile to the list in profiles/index.js, after the others.
function register(root, key) {
  const file = path.join(root, 'profiles', 'index.js');
  const source = fs.readFileSync(file, 'utf8');
  const re = /module\.exports\s*=\s*\[([\s\S]*?)\];/;
  const m = re.exec(source);
  if (!m) {
    throw new Error(
      `profiles/index.js has no "module.exports = [...]" list; add require('./${key}') to it by hand`
    );
  }
  const items = m[1].trim() ? `${m[1].trim()}, require('./${key}')` : `require('./${key}')`;
  fs.writeFileSync(file, source.replace(re, `module.exports = [${items}];`), 'utf8');
}

// JavaScript as the repository's Prettier settings write it, so the new
// files pass format:check as they are.
async function formatted(file, source) {
  if (!file.endsWith('.js')) return source;
  const prettier = require('prettier');
  // This repository's settings, wherever the profile is written.
  const options =
    (await prettier.resolveConfig(path.join(__dirname, '..', 'profiles', 'index.js'))) || {};
  return prettier.format(source, { ...options, filepath: file });
}

async function createProfile({ key, name, root }) {
  checkKey(key, root);
  const opts = { key, name: name || key.toUpperCase() };
  const dir = path.join(root, 'profiles', key);
  const write = async (rel, content) => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, await formatted(file, content), 'utf8');
    return file;
  };

  const written = [
    await write('index.js', indexJs(opts)),
    await write('requirements.js', requirementsJs(opts)),
    await write('rule-map.js', ruleMapJs(opts)),
    await write('mappings.js', mappingsJs(opts)),
    await write('tests/entry.test.js', entryTestJs(opts)),
    await write('README.md', readmeMd(opts))
  ];
  for (const type of ['automatic', 'manual']) {
    fs.mkdirSync(path.join(dir, 'rules', type), { recursive: true });
    written.push(await write(`rules/${type}/.gitkeep`, ''));
  }

  // One dictionary per locale core has, each holding the note above the
  // profile's rollups in the HTML report, in English until translated.
  const noteKey = `report_${camel(key)}Rollup_note`;
  const note = `One row per ${opts.name} requirement that a rule is linked to, grouping those rules.`;
  const locales = fs
    .readdirSync(path.join(root, 'src', 'i18n'))
    .filter((f) => /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(f))
    .sort();
  for (const file of locales) {
    written.push(await write(`i18n/${file}`, `${JSON.stringify({ [noteKey]: note }, null, 2)}\n`));
  }

  register(root, key);
  return { dir, written };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  try {
    const { dir, written } = await createProfile(args);
    const rel = (f) => path.relative(args.root, f);
    console.log(
      `[profile-new] created ${rel(dir)}/ (${written.length} files) and added it to profiles/index.js`
    );
    console.log(
      `[profile-new] next: fill in ${rel(path.join(dir, 'README.md'))}, then npm run build && npm test`
    );
  } catch (e) {
    console.error(`[profile-new] ${e.message}`);
    process.exitCode = 1;
  }
}

module.exports = { createProfile, checkKey };

if (require.main === module) {
  main();
}
