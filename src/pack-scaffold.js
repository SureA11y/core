/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * `surea11y-pack new <folder>`: a pack to start from, in a folder of its
 * own. It works as it is: one rule with its source header, an English
 * dictionary, a test through @surea11y/core/testing, an example per outcome
 * in docs/RULE_EXAMPLES.md, the safe-dom lint rules, and the scripts that
 * test, lint and document it. Its package is private until its author
 * chooses a licence and publishes it.
 */

const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../package.json');

const NAMESPACE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

// A namespace from the package name: its scope, or its first word.
function namespaceOf(name) {
  const scope = /^@([^/]+)\//.exec(name);
  const word = (scope ? scope[1] : name.replace(/^.*\//, '')).toLowerCase().split(/[^a-z0-9]+/);
  const ns = word.filter(Boolean)[0] || '';
  return NAMESPACE.test(ns) ? ns : 'pack';
}

// acme-web → acmeWeb, for dictionary keys.
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

function files({ name, namespace }) {
  const ruleId = `${namespace}-link-text-specific`;
  const key = `${camel(namespace)}LinkTextSpecific`;
  const coreRange = `^${pkg.version}`;
  const dev = pkg.devDependencies;
  return {
    'package.json':
      JSON.stringify(
        {
          name,
          version: '0.1.0',
          private: true,
          description: `Accessibility rules for @surea11y/core`,
          main: 'index.js',
          files: ['index.js', 'rules/', 'i18n/', 'docs/'],
          scripts: {
            test: 'node --test',
            lint: 'eslint .',
            docs: 'surea11y-pack docs',
            'docs:check': 'surea11y-pack docs --check'
          },
          peerDependencies: { '@surea11y/core': coreRange },
          devDependencies: {
            '@surea11y/core': coreRange,
            eslint: dev.eslint,
            jsdom: dev.jsdom,
            playwright: dev.playwright
          }
        },
        null,
        2
      ) + '\n',

    'index.js': `'use strict';

const { definePack } = require('@surea11y/core/pack');
const { name, version } = require('./package.json');

module.exports = definePack({
  name,
  version,
  namespace: '${namespace}', // every rule id starts with "${namespace}-"
  core: '${coreRange}', // the core versions the pack works with
  rules: [require('./rules/automatic/${ruleId}')],
  dictionaries: { en: require('./i18n/en.json') }
});
`,

    [`rules/automatic/${ruleId}.js`]: `'use strict';

/**
 * @check ${ruleId}
 * @atomic true
 * @summary Links don't say only "click here" or "read more"
 * @applicability
 *   Applies to every link in the accessibility tree.
 * @expectation
 *   The link's accessible name is not only a generic phrase ("click
 *   here", "here", "read more", "more", "learn more"), whatever its case
 *   and spacing.
 * @reports
 *   - \`name\`: the link's accessible name, as the rule compared it.
 */

const id = '${ruleId}';

const meta = {
  title: 'Links say where they go',
  description: 'Checks that no link is named only "click here", "read more" or the like.',
  i18n: { titleKey: '${key}_title', descriptionKey: '${key}_description' },
  helpUrl: null,
  tags: ['${namespace}', 'best-practice', 'atomic', 'automatic'],
  defaultSeverity: 'moderate',
  type: 'automatic',
  defaultConfidence: 'high'
};

// The engine writes this function into the page, so it uses only ctx: no
// variable or module from outside it.
function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const GENERIC = ['click here', 'here', 'read more', 'more', 'learn more'];

  const links = helpers.queryAllSmart('a[href]').filter((el) => {
    const included = helpers.isIncludedInAccessibilityTree(el, ctx);
    return typeof included === 'boolean' ? included : !!(included && included.eligible);
  });
  if (!links.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of links) {
    // Its name from aria-labelledby, aria-label or title, else its content.
    const author = helpers.getAccessibleNameInfo(el, ctx);
    const content = helpers.getContentNameInfo(el, ctx);
    const name = String((author && author.value) || (content && content.value) || '')
      .trim()
      .replace(/\\s+/g, ' ')
      .toLowerCase();
    if (GENERIC.includes(name)) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: \`The link is named only "\${name}".\`,
          hint: 'Name the link by where it goes, or add that to its name.',
          i18n: {
            summaryKey: '${key}_summary_fail',
            hintKey: '${key}_hint_fail',
            params: { name }
          },
          data: { details: { reasonCode: 'GENERIC_LINK_NAME', name } }
        })
      );
    }
  }

  return occurrences.length
    ? { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity, occurrences }
    : { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
`,

    'i18n/en.json':
      JSON.stringify(
        {
          [`${key}_title`]: 'Links say where they go',
          [`${key}_description`]:
            'Checks that no link is named only "click here", "read more" or the like.',
          [`${key}_summary_fail`]: 'The link is named only "{name}".',
          [`${key}_hint_fail`]: 'Name the link by where it goes, or add that to its name.'
        },
        null,
        2
      ) + '\n',

    [`tests/${ruleId}.test.js`]: `'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml, assertRule } = require('@surea11y/core/testing');
const pack = require('..');

const scan = (html) => runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] } });

test('a link named only "click here" fails', () => {
  assertRule(scan('<a href="/report">Click  here</a>'), '${ruleId}', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test('a link named by where it goes passes', () => {
  assertRule(scan('<a href="/report">The 2026 annual report</a>'), '${ruleId}', 'pass');
});

test('a page without links is not applicable', () => {
  assertRule(scan('<p>No links</p>'), '${ruleId}', 'notApplicable');
});
`,

    'docs/RULE_EXAMPLES.md': `# Rule examples

Examples of each rule's outcomes. \`npm run docs\` checks that each gives the outcome its label says, and records any that doesn't in \`scripts/data/rule-examples-outcomes.json\`.

## ${ruleId}

**Passed**
\`\`\`html
<a href="/report">The 2026 annual report</a>
\`\`\`

**Failed**
\`\`\`html
<a href="/report">Read more</a>
\`\`\`

**Not applicable**
\`\`\`html
<p>No links</p>
\`\`\`
`,

    'eslint.config.js': `'use strict';

// The lint rules core's own rules are held to: a rule runs on pages it
// doesn't control, so it reads the DOM through ctx.helpers.dom.
const safeDom = require('@surea11y/core/eslint-plugin');

module.exports = [
  { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' } },
  { files: ['rules/**'], ...safeDom.configs.recommended }
];
`,

    '.gitignore': 'node_modules/\n',

    'README.md': `# ${name}

Accessibility rules for [\`@surea11y/core\`](https://github.com/SureA11y/core), as a pack.

## Use

\`\`\`js
const { runDomRulesInPage } = require('@surea11y/core');
const pack = require('${name}');

const result = runDomRulesInPage(url, null, { packs: [pack] });
\`\`\`

In a browser page, register the pack with \`packScript([pack])\` from \`@surea11y/core/pack\` and name it in \`engineOptions.packs\` as \`${name}@<version>\`. See "Packs" in core's [\`ENGINE_OPTIONS.md\`](https://github.com/SureA11y/core/blob/main/docs/ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core).

## Develop

- \`rules/automatic/\` and \`rules/manual/\` hold the rules, one module each, listed in \`index.js\`. Every rule id starts with \`${namespace}-\`.
- \`i18n/<locale>.json\` holds the rules' messages; add a locale to \`dictionaries\` in \`index.js\`.
- \`npm test\` runs the tests in \`tests/\` in jsdom.
- \`npm run lint\` holds the rules to the lint rules core's are held to.
- \`npm run docs\` writes \`docs/RULE_CATALOG.md\` and checks \`docs/RULE_EXAMPLES.md\` in Chromium (\`npx playwright install chromium\` first); \`npm run docs:check\` fails when they are stale.

The package is \`private\` until you choose its licence and publish it.
`
  };
}

/**
 * Writes a new pack into folder, which must not exist or be empty. Returns
 * the files written, relative to it.
 */
function scaffoldPack(folder, options = {}) {
  const name = options.name || path.basename(path.resolve(folder));
  const namespace = options.namespace || namespaceOf(name);
  if (!NAMESPACE.test(namespace) || /^wcag/.test(namespace)) {
    throw new Error(
      `namespace "${namespace}": lowercase letters, digits and "-", starting with a letter, and not wcag`
    );
  }
  if (fs.existsSync(folder) && fs.readdirSync(folder).length) {
    throw new Error(`${folder} is not empty`);
  }
  const out = files({ name, namespace });
  for (const [file, text] of Object.entries(out)) {
    const full = path.join(folder, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  return Object.keys(out);
}

module.exports = { scaffoldPack, namespaceOf };
