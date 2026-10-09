/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * `surea11y-pack new <folder>`: a pack to start from, in a folder of its
 * own, that works as it is generated. Its files are templates/pack/: common/
 * for every kind, and the kind's own folder over it.
 *
 * - checklist (the default): an organisation's own policy. Profiles choose
 *   core's rules and the pack's (by tag, by id, with exclusions and a
 *   severity), and rollups make the checklist's items.
 * - standard: a standard with requirements of its own, like a national one.
 *   A requirements table and the rules that check each requirement
 *   (ruleMappedStandard), a rollup per requirement, profiles.
 *
 * Both bring three example rules (an automatic one, a variant of a core rule
 * and a manual one), their English messages, tests, examples, the safe-dom
 * lint rules and the scripts that test, lint and document the pack. The
 * package is private until its author chooses a licence and publishes it.
 *
 * In the templates, __NAMESPACE__ is the namespace, __KEY__ its camel-case
 * form for message keys, __TITLE__ the pack's title, __PACKAGE__ its package
 * name and __CORE__ the core range; a file named gitignore becomes
 * .gitignore (npm leaves .gitignore files out of a package).
 */

const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../package.json');
const { checkPack } = require('./pack.js');

const TEMPLATES = path.join(__dirname, '..', 'templates', 'pack');
const KINDS = ['checklist', 'standard'];
const NAMESPACE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

// A namespace from the package name: its scope, or its first word.
function namespaceOf(name) {
  const scope = /^@([^/]+)\//.exec(name);
  const word = (scope ? scope[1] : name.replace(/^.*\//, '')).toLowerCase().split(/[^a-z0-9]+/);
  const ns = word.filter(Boolean)[0] || '';
  return NAMESPACE.test(ns) ? ns : 'pack';
}

// acme-web → acmeWeb, for message keys.
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

function packageJson({ name, kind }) {
  const range = `^${pkg.version}`;
  const dev = pkg.devDependencies;
  return (
    JSON.stringify(
      {
        name,
        version: '0.1.0',
        private: true,
        description: `Accessibility ${kind} for @surea11y/core`,
        main: 'index.js',
        files: ['*.js', 'rules/', 'i18n/', 'docs/'],
        scripts: {
          test: 'node --test',
          lint: 'eslint .',
          docs: 'surea11y-pack docs',
          'docs:check': 'surea11y-pack docs --check'
        },
        peerDependencies: { '@surea11y/core': range },
        devDependencies: {
          '@surea11y/core': range,
          eslint: dev.eslint,
          jsdom: dev.jsdom,
          playwright: dev.playwright
        }
      },
      null,
      2
    ) + '\n'
  );
}

// Every file under dir, as paths relative to it.
function listFiles(dir, base = dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? listFiles(path.join(dir, e.name), base)
        : [path.relative(base, path.join(dir, e.name))]
    );
}

// The pack's files: { relative path: text }, the kind's over the common ones.
function files({ name, namespace, title, kind }) {
  const tokens = {
    __NAMESPACE__: namespace,
    __KEY__: camel(namespace),
    __TITLE__: title,
    __PACKAGE__: name,
    __CORE__: `^${pkg.version}`
  };
  const fill = (text) => text.replace(/__(NAMESPACE|KEY|TITLE|PACKAGE|CORE)__/g, (t) => tokens[t]);
  const out = {};
  for (const dir of [path.join(TEMPLATES, 'common'), path.join(TEMPLATES, kind)]) {
    for (const file of listFiles(dir)) {
      const target = fill(file.split(path.sep).join('/')).replace(
        /(^|\/)gitignore$/,
        '$1.gitignore'
      );
      out[target] = fill(fs.readFileSync(path.join(dir, file), 'utf8'));
    }
  }
  out['package.json'] = packageJson({ name, kind });
  return out;
}

/**
 * Writes a new pack into folder, which must not exist or be empty. options:
 * name (the package name; the folder's by default), namespace (its scope or
 * first word by default), title, kind ('checklist' or 'standard'). Returns
 * the files written, relative to folder.
 */
function scaffoldPack(folder, options = {}) {
  const kind = options.kind || 'checklist';
  if (!KINDS.includes(kind)) throw new Error(`kind "${kind}": one of ${KINDS.join(', ')}`);
  const name = options.name || path.basename(path.resolve(folder));
  const namespace = options.namespace || namespaceOf(name);
  if (!NAMESPACE.test(namespace) || /^wcag/.test(namespace)) {
    throw new Error(
      `namespace "${namespace}": lowercase letters, digits and "-", starting with a letter, and not wcag`
    );
  }
  // The rest of what a namespace may not be, as a scan checks it: a pack
  // that would be skipped is no start.
  const clash = checkPack({ name, version: '1.0.0', namespace, core: '*' }).find(
    (p) => p.startsWith(`namespace "${namespace}"`) || p.startsWith(`name "`)
  );
  if (clash && clash.startsWith('name "')) {
    throw new Error(
      `${clash}${options.name ? '' : ' (taken from the folder)'}: choose another with --name`
    );
  }
  if (clash) {
    throw new Error(
      `${clash}${options.namespace ? '' : ' (taken from the package name)'}: choose another with --namespace`
    );
  }
  const word = namespace.charAt(0).toUpperCase() + namespace.slice(1);
  const title =
    options.title || (kind === 'standard' ? `${word} Standard` : `${word} accessibility policy`);
  if (fs.existsSync(folder) && fs.readdirSync(folder).length) {
    throw new Error(`${folder} is not empty`);
  }
  const out = files({ name, namespace, title, kind });
  for (const [file, text] of Object.entries(out)) {
    const full = path.join(folder, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  return Object.keys(out).sort();
}

module.exports = { scaffoldPack, namespaceOf, KINDS };
