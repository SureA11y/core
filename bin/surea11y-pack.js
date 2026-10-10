#!/usr/bin/env node
/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Tools for a pack's own repository (see ENGINE_OPTIONS.md, "Packs"):
 *
 *   surea11y-pack new <folder> [--kind checklist|standard] [--name <package name>] [--namespace <ns>] [--title <title>]
 *   surea11y-pack docs [--check] [--no-examples] [--pack <file>]
 *
 * new writes a pack that works as it is into a new folder (src/pack-scaffold.js):
 * a checklist (an organisation's policy: profiles and items) or a standard
 * (requirements of its own and the rules that check them), with example
 * rules, messages, tests, examples, lint and scripts. The package name is the
 * folder's by default, and the namespace its scope or first word.
 *
 * docs writes the pack's docs/RULE_CATALOG.md and the records of its
 * docs/RULE_EXAMPLES.md (src/pack-docs.js); --check writes nothing and exits
 * 1 when one is stale; --no-examples doesn't run the examples in Chromium.
 * The pack is the module --pack names, or the folder's package.json main.
 *
 * A flag's value may follow it or an "=" (--kind=standard). An unknown flag,
 * a value missing or an argument too many is an error naming it; --help or
 * -h, after any command or none, prints the usage and exits 0.
 */

const path = require('node:path');

const USAGE = `Usage:
  surea11y-pack new <folder> [--kind checklist|standard] [--name <package name>] [--namespace <ns>] [--title <title>]
  surea11y-pack docs [--check] [--no-examples] [--pack <file>]`;

// What each command takes: flags with a value (--kind standard or
// --kind=standard), flags alone, and how many positional arguments.
const COMMANDS = {
  new: { values: ['kind', 'name', 'namespace', 'title'], flags: [], positional: 1 },
  docs: { values: ['pack'], flags: ['check', 'no-examples'], positional: 0 }
};

// { command, flags, values, positional, help } or { error }: an unknown flag,
// a value missing, or an argument too many is an error, not ignored.
function parseArgs(argv) {
  const command = argv[0];
  const out = { command, flags: new Set(), values: {}, positional: [], help: false };
  if (command === undefined || command === '--help' || command === '-h') {
    out.help = true;
    return out;
  }
  const spec = COMMANDS[command];
  if (!spec) return { error: `unknown command "${command}"` };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      out.help = true;
      continue;
    }
    if (a.startsWith('-')) {
      const eq = a.indexOf('=');
      const name = (eq === -1 ? a : a.slice(0, eq)).replace(/^--?/, '');
      if (spec.values.includes(name)) {
        const value = eq === -1 ? argv[++i] : a.slice(eq + 1);
        if (value === undefined || value === '' || (eq === -1 && value.startsWith('--'))) {
          return { error: `--${name} needs a value` };
        }
        out.values[name] = value;
      } else if (spec.flags.includes(name) && eq === -1 && a.startsWith('--')) {
        out.flags.add(a);
      } else {
        return { error: `${command} has no option ${a}` };
      }
    } else {
      out.positional.push(a);
    }
  }
  if (!out.help && out.positional.length > spec.positional) {
    return {
      error: `${command} takes ${spec.positional ? 'one folder' : 'no arguments'}, and was given ${out.positional.join(' ')}`
    };
  }
  return out;
}

// A folder as a shell reads it, quoted when it needs to be.
function shellPath(p) {
  return /^[\w./@+-]+$/.test(p) ? p : `'${p.replace(/'/g, `'\\''`)}'`;
}

function create(args) {
  const { scaffoldPack } = require('../src/pack-scaffold.js');
  const folder = args.positional[0];
  if (!folder) {
    console.error(`[surea11y-pack] new needs the folder to write the pack into.\n\n${USAGE}`);
    return 1;
  }
  let written;
  try {
    written = scaffoldPack(folder, {
      name: args.values.name,
      namespace: args.values.namespace,
      kind: args.values.kind,
      title: args.values.title
    });
  } catch (err) {
    console.error(`[surea11y-pack] ${err.message}`);
    return 1;
  }
  for (const file of written) console.log(`[surea11y-pack] wrote ${path.join(folder, file)}`);
  console.log(`\nNext: cd ${shellPath(folder)} && npm install && npm test`);
  return 0;
}

async function docs(args) {
  const { packDocs } = require('../src/pack-docs.js');
  const root = process.cwd();
  const file = path.resolve(root, args.values.pack || '.');
  let pack;
  try {
    pack = require(file);
  } catch (err) {
    console.error(`[surea11y-pack] Could not load the pack ${file}: ${firstLine(err)}`);
    return 1;
  }
  const check = args.flags.has('--check');
  const examples = !args.flags.has('--no-examples');
  let result;
  try {
    result = await packDocs(pack, { root, check, examples });
  } catch (err) {
    const message = firstLine(err);
    const noBrowser =
      /Executable doesn't exist|playwright install|Cannot find module 'playwright'/.test(
        String(err && err.message)
      );
    console.error(
      `[surea11y-pack] ${
        noBrowser
          ? "Running the examples needs Playwright's Chromium: run npx playwright install chromium, or leave the examples out with --no-examples"
          : message
      }. Nothing was written.`
    );
    return 1;
  }
  const { written, problems } = result;
  for (const file of written) console.log(`[surea11y-pack] wrote ${file}`);
  if (problems.length) {
    console.error(`[surea11y-pack] ${problems.join('\n')}`);
    return 1;
  }
  if (check) console.log('[surea11y-pack] docs are up to date.');
  return 0;
}

// An error's first line, without the stack.
function firstLine(err) {
  return String((err && err.message) || err).split('\n')[0];
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.error) {
    console.error(`[surea11y-pack] ${args.error}.\n\n${USAGE}`);
    return 1;
  }
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.command === 'new') return create(args);
  return docs(args);
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[surea11y-pack] ${firstLine(err)}`);
    process.exit(1);
  }
);
