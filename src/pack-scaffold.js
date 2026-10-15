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
const os = require('node:os');
const path = require('node:path');

const pkg = require('../package.json');
const { checkPack, preparePacks } = require('./pack.js');

const ROOT = path.join(__dirname, '..');
const TEMPLATES = path.join(ROOT, 'templates', 'pack');
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

// A single-quoted JavaScript string of text, as the templates write strings.
const jsString = (text) =>
  "'" +
  text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029') +
  "'";

// The pack's files: { relative path: text }, the kind's over the common ones.
function files({ name, namespace, title, kind }) {
  const tokens = {
    __NAMESPACE__: namespace,
    __KEY__: camel(namespace),
    __PACKAGE__: name,
    __CORE__: `^${pkg.version}`
  };
  const fill = (text) => text.replace(/__(NAMESPACE|KEY|PACKAGE|CORE)__/g, (t) => tokens[t]);
  // The title is free text, written as each kind of file reads it: a string
  // literal in JavaScript, a comment that it can't end, a JSON string. It goes
  // in after the other tokens, so a title that reads like one is kept as it is.
  const fillTitle = (text, file) => {
    if (file.endsWith('.js')) {
      // One pass, so a title holding __TITLE__ is not filled in again.
      return text.replace(/'__TITLE__'|__TITLE__/g, (t) =>
        t === '__TITLE__' ? title.replace(/\*\//g, '* /') : jsString(title)
      );
    }
    if (file.endsWith('.json')) {
      return text.replace(/__TITLE__/g, () => JSON.stringify(title).slice(1, -1));
    }
    return text.replace(/__TITLE__/g, () => title);
  };
  const out = {};
  for (const dir of [path.join(TEMPLATES, 'common'), path.join(TEMPLATES, kind)]) {
    for (const file of listFiles(dir)) {
      const target = fill(file.split(path.sep).join('/')).replace(
        /(^|\/)gitignore$/,
        '$1.gitignore'
      );
      out[target] = fillTitle(fill(fs.readFileSync(path.join(dir, file), 'utf8')), file);
    }
  }
  out['package.json'] = packageJson({ name, kind });
  return out;
}

// What is wrong with the pack these files make, as a scan would find it:
// definePack's problems when its index.js loads, checkPack's, and what
// preparing it with core finds, such as a standard named as one of core's.
// The files are written to a folder of their own, with core beside them as
// the pack's own node_modules will have it, and removed after.
function generatedProblems(out) {
  const staging = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-pack-new-')));
  try {
    for (const [file, text] of Object.entries(out)) {
      const full = path.join(staging, file);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    }
    fs.mkdirSync(path.join(staging, 'node_modules', '@surea11y'), { recursive: true });
    fs.symlinkSync(ROOT, path.join(staging, 'node_modules', '@surea11y', 'core'), 'junction');
    let pack;
    try {
      pack = require(path.join(staging, 'index.js'));
    } catch (e) {
      return [e && e.message ? e.message : String(e)];
    }
    const problems = checkPack(pack);
    if (problems.length) return problems;
    try {
      preparePacks([pack], { strict: true });
    } catch (e) {
      return [String(e && e.message ? e.message : e).replace(/^engineOptions\.packs: [^:]*: /, '')];
    }
    return [];
  } finally {
    for (const id of Object.keys(require.cache)) {
      if (id.startsWith(staging + path.sep)) delete require.cache[id];
    }
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

/**
 * Writes a new pack into folder, which must not exist or be empty. options:
 * name (the package name; the folder's by default), namespace (its scope or
 * first word by default), title, kind ('checklist' or 'standard'). Returns
 * the files written, relative to folder.
 */
function scaffoldPack(folder, options = {}) {
  // The folder to write into, never the current one by default.
  if (typeof folder !== 'string' || !folder.trim()) {
    throw new Error('scaffoldPack needs the folder to write the pack into');
  }
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
    (p) => p.startsWith(`namespace "${namespace}"`) || p.startsWith('name ')
  );
  if (clash && clash.startsWith('name ')) {
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
  // A title is a name on one line.
  const control = (c) => {
    const n = c.codePointAt(0);
    return n < 32 || n === 127 || n === 0x2028 || n === 0x2029;
  };
  if ([...title].some(control)) {
    throw new Error(`title ${JSON.stringify(title)}: one line, with no control characters`);
  }
  if (fs.existsSync(folder) && fs.readdirSync(folder).length) {
    throw new Error(`${folder} is not empty`);
  }
  const out = files({ name, namespace, title, kind });
  // Nothing is written for a pack that wouldn't load, or that a scan would skip.
  const problems = generatedProblems(out);
  if (problems.length) {
    throw new Error(`the pack would not be valid: ${problems.join('; ')}`);
  }
  for (const [file, text] of Object.entries(out)) {
    const full = path.join(folder, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  return Object.keys(out).sort();
}

module.exports = { scaffoldPack, namespaceOf, KINDS };
