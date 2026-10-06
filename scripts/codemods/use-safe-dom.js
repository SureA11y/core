#!/usr/bin/env node
/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Rewrites DOM property reads and method calls to go through the safe DOM
 * accessors (src/core/safe-dom.js), so a page's named form controls and
 * images can't redirect them:
 *
 *   el.parentNode            -> dom.parentNode(el)
 *   el.getAttribute('role')  -> dom.getAttribute(el, 'role')
 *   typeof el.closest        -> typeof dom.get(el, 'closest')
 *   walker.nextSibling()     -> dom.call(walker, 'nextSibling')
 *
 * Only names that exist on DOM interfaces and nowhere else in this codebase
 * are rewritten (SAFE_DOM_GETTERS and SAFE_DOM_METHODS), so the rewrite needs
 * no type information. Writes, `new`, optional chains and a few other forms
 * are left alone and listed, for a person to look at.
 *
 * Usage:
 *   node scripts/codemods/use-safe-dom.js            rewrite in place
 *   node scripts/codemods/use-safe-dom.js --check    list what would change; exit 1 if anything would
 *
 * It is safe to run again: code already rewritten has nothing left to match.
 * eslint.config.js enforces the same rule from then on.
 */

const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');
const { SAFE_DOM_GETTERS, SAFE_DOM_METHODS } = require('../../src/core/safe-dom');
const { isUnsafeDomMember } = require('./safe-dom-rule');

const ROOT = path.join(__dirname, '..', '..');
const GETTERS = new Set(SAFE_DOM_GETTERS);
const METHODS = new Set(SAFE_DOM_METHODS);

// Core files: the functions whose bodies are rewritten, and the statement
// that gives each of them `dom`. Rule files are found automatically: their
// runInPage and applicability functions get `dom` from ctx.helpers.
const CORE_TARGETS = [
  {
    file: 'src/core/dom-helpers.js',
    functions: ['normalizeSelectorList', 'resolveContextRoots', 'createDomHelpers']
  },
  { file: 'src/core/aria-helpers.js', functions: ['createAriaHelpers'] },
  { file: 'src/core/contrast-helpers.js', functions: ['createContrastHelpers'] },
  {
    file: 'src/core/dom-runner.js',
    functions: ['readRenderingEnvironment', 'settleAnimations', 'runCore', 'runCoreSettled']
  },
  {
    file: 'src/core/frame-scan.js',
    functions: [
      'findChildFrameElements',
      'isFrameShown',
      'getFrameElementUrl',
      'runa11yCoreAcrossFrames',
      'a11yCoreEnableFrameResponder'
    ]
  },
  { file: 'src/core/margin.js', functions: ['resolveMargin'] },
  {
    file: 'src/core/frame-messaging.js',
    functions: [
      'getFrameRpcRegistry',
      'installFrameRpcListener',
      'nextFrameRpcRequestId',
      'pingFrame',
      'sendFrameRunCommand',
      'enableFrameRpcResponder'
    ]
  },
  // Integrators pass waitForPageReady to page.evaluate on its own, so it
  // can't reach createSafeDom: it declares its own `dom` by hand.
  { file: 'src/core/page-ready.js', functions: ['waitForPageReady'], init: '' }
];
const CORE_DOM_INIT = 'const dom = createSafeDom();';

function ruleFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) out.push(full);
    }
  };
  walk(path.join(ROOT, 'src/checks'));
  const profiles = path.join(ROOT, 'profiles');
  for (const p of fs.readdirSync(profiles, { withFileTypes: true })) {
    const rules = path.join(profiles, p.name, 'rules');
    if (p.isDirectory() && fs.existsSync(rules)) walk(rules);
  }
  return out;
}

function parse(src) {
  return espree.parse(src, { ecmaVersion: 'latest', sourceType: 'script', range: true });
}

function childNodes(node) {
  const out = [];
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const c of v) if (c && typeof c.type === 'string') out.push(c);
    } else if (v && typeof v.type === 'string') out.push(v);
  }
  // A shorthand property ({ helpers }) has its key and value at the same
  // place in the source; render it once.
  const seen = new Set();
  return out
    .sort((a, b) => a.range[0] - b.range[0])
    .filter((c) => {
      const k = `${c.range[0]}:${c.range[1]}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function setParents(node, parent) {
  node.parent = parent;
  for (const c of childNodes(node)) setParents(c, node);
}

/** The function nodes whose bodies get `dom`, with the statement that declares it. */
function findScopes(ast, src, relFile) {
  const scopes = [];
  const core = CORE_TARGETS.find((t) => t.file === relFile);
  const visit = (node) => {
    let fn = null;
    let name = null;
    if (node.type === 'FunctionDeclaration' && node.id) {
      fn = node;
      name = node.id.name;
    } else if (
      (node.type === 'Property' || node.type === 'MethodDefinition') &&
      node.key &&
      node.key.type === 'Identifier' &&
      node.value &&
      /Function/.test(node.value.type)
    ) {
      fn = node.value;
      name = node.key.name;
    } else if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'Identifier' &&
      node.init &&
      /Function/.test(node.init.type)
    ) {
      fn = node.init;
      name = node.id.name;
    }
    if (fn) {
      if (core && core.functions.includes(name) && node.parent && node.parent.type === 'Program') {
        scopes.push({ fn, init: core.init !== undefined ? core.init : CORE_DOM_INIT });
        return;
      }
      if (!core && (name === 'runInPage' || name === 'applicability')) {
        const param = fn.params[0];
        const ctxName = param && param.type === 'Identifier' ? param.name : null;
        scopes.push({
          fn,
          init: ctxName ? `const dom = ${ctxName}.helpers.dom;` : null,
          name
        });
        return;
      }
    }
    for (const c of childNodes(node)) visit(c);
  };
  visit(ast);
  return scopes;
}

/**
 * Renders `node` with every unsafe DOM member inside it rewritten. Returns
 * the new source text and records each rewrite and each form left alone.
 */
function render(node, src, report) {
  const r = rewrite(node, src, report);
  if (r !== null) return r;
  // No rewrite at this node: copy its source, rendering its children.
  let out = '';
  let pos = node.range[0];
  for (const c of childNodes(node)) {
    out += src.slice(pos, c.range[0]) + render(c, src, report);
    pos = c.range[1];
  }
  return out + src.slice(pos, node.range[1]);
}

function rewrite(node, src, report) {
  // A call whose callee is an unsafe member: el.getAttribute(x).
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    isUnsafeDomMember(node.callee)
  ) {
    if (node.optional || node.callee.optional) {
      report.left.push(['optional chain', node]);
      return null;
    }
    const name = node.callee.property.name;
    const obj = render(node.callee.object, src, report);
    const args = node.arguments.map((a) => render(a, src, report));
    report.count += 1;
    if (METHODS.has(name)) return `dom.${name}(${[obj, ...args].join(', ')})`;
    return `dom.call(${[obj, `'${name}'`, ...args].join(', ')})`;
  }
  if (node.type === 'MemberExpression' && isUnsafeDomMember(node)) {
    const parent = node.parent;
    if (parent && parent.type === 'CallExpression' && parent.callee === node) return null;
    if (node.optional) {
      report.left.push(['optional chain', node]);
      return null;
    }
    if (
      (parent.type === 'AssignmentExpression' && parent.left === node) ||
      parent.type === 'UpdateExpression' ||
      (parent.type === 'UnaryExpression' && parent.operator === 'delete') ||
      (parent.type === 'NewExpression' && parent.callee === node) ||
      (parent.type === 'TaggedTemplateExpression' && parent.tag === node)
    ) {
      report.left.push(['write or new', node]);
      return null;
    }
    const name = node.property.name;
    const obj = render(node.object, src, report);
    report.count += 1;
    if (GETTERS.has(name)) return `dom.${name}(${obj})`;
    return `dom.get(${obj}, '${name}')`;
  }
  return null;
}

function transformFile(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  const ast = parse(src);
  setParents(ast, null);
  const scopes = findScopes(ast, src, rel);
  const report = { count: 0, left: [], file: rel };
  if (!scopes.length) return { src, out: src, report };

  const edits = [];
  for (const scope of scopes) {
    const body = scope.fn.body;
    if (body.type !== 'BlockStatement') continue;
    const before = report.count;
    let inner = '';
    let pos = body.range[0] + 1;
    for (const stmt of body.body) {
      inner += src.slice(pos, stmt.range[0]) + render(stmt, src, report);
      pos = stmt.range[1];
    }
    inner += src.slice(pos, body.range[1] - 1);
    if (report.count === before) continue;
    const declared = new RegExp(`^\\s*const dom = `).test(inner);
    if (scope.init === null) {
      report.left.push(['no ctx parameter for dom', scope.fn]);
      continue;
    }
    // Insert the declaration after a leading 'use strict' or comment-free
    // start, on its own line, indented like the first statement.
    const firstStmt = body.body[0];
    const indent = firstStmt
      ? src.slice(src.lastIndexOf('\n', firstStmt.range[0]) + 1, firstStmt.range[0])
      : '  ';
    const decl = declared || !scope.init ? '' : `\n${indent}${scope.init}`;
    edits.push({ start: body.range[0] + 1, end: body.range[1] - 1, text: decl + inner });
  }
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return { src, out, report };
}

function lineOf(src, idx) {
  return src.slice(0, idx).split('\n').length;
}

function main() {
  const check = process.argv.includes('--check');
  const files = [...CORE_TARGETS.map((t) => path.join(ROOT, t.file)), ...ruleFiles()];
  let changed = 0;
  let total = 0;
  const left = [];
  for (const file of files) {
    const { src, out, report } = transformFile(file);
    total += report.count;
    for (const [why, node] of report.left) {
      left.push(
        `${report.file}:${lineOf(src, node.range[0])}  ${why}: ${src.slice(node.range[0], node.range[1]).slice(0, 80)}`
      );
    }
    if (out !== src) {
      changed += 1;
      if (!check) fs.writeFileSync(file, out);
    }
  }
  console.log(`${check ? 'would rewrite' : 'rewrote'} ${total} reads in ${changed} files`);
  if (left.length) {
    console.log(`left for a person to look at (${left.length}):`);
    for (const l of left) console.log('  ' + l);
  }
  if (check && changed) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { transformFile };
