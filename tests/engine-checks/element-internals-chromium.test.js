'use strict';

/**
 * A custom element can give itself a name or a state through
 * ElementInternals (this.attachInternals().ariaLabel = 'Save'). Browsers
 * expose them as its default semantics, which its own aria-* attributes
 * override, so the name is programmatically determined and 4.1.2 is met;
 * but no page script can read them back, so the name rules failed such an
 * element. A component that keeps its internals on a property the engine
 * can reach (_internals, internals, internals_) is read through it: named,
 * it passes; unnamed, it fails. For any other defined custom element the
 * rule asks (name_internals, state_internals) instead of failing. Built-in
 * elements, custom elements that aren't defined, and an author attribute
 * that overrides the internals fail as before.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

const NAME_RULE = {
  button: 'button-name-present',
  img: 'role-img-text-alternative-present',
  textbox: 'textbox-name-present',
  checkbox: 'binary-control-name-present',
  slider: 'slider-name-present'
};

// A state each role needs, so the name cases don't hinge on it.
const STATE = {
  button: '',
  img: '',
  textbox: '',
  checkbox: "i.ariaChecked = 'false';",
  slider: "i.ariaValueNow = '5';"
};

function define(tag, storage, body) {
  // storage: 'private' keeps internals in a #private field; 'public' on this._internals.
  if (storage === 'private') {
    return `customElements.define('${tag}', class extends HTMLElement {
      #internals;
      constructor() { super(); const i = this.attachInternals(); this.#internals = i; ${body} }
    });`;
  }
  return `customElements.define('${tag}', class extends HTMLElement {
    constructor() { super(); const i = this.attachInternals(); this._internals = i; ${body} }
  });`;
}

function page(markup, script) {
  return `<!doctype html><html lang="en"><head><title>Internals</title></head><body><main><h1>Internals</h1>${markup}</main><script>${script || ''}</script></body></html>`;
}

const cases = [];
for (const role of Object.keys(NAME_RULE)) {
  const rule = NAME_RULE[role];
  const st = STATE[role];
  cases.push({
    label: `${role}: #private internals label`,
    rule,
    expect: 'cantTell',
    html: page(
      `<x-${role} role="${role}"></x-${role}>`,
      define(`x-${role}`, 'private', `i.ariaLabel = 'Save'; ${st}`)
    )
  });
  cases.push({
    label: `${role}: _internals label`,
    rule,
    expect: 'pass',
    html: page(
      `<x-${role} role="${role}"></x-${role}>`,
      define(`x-${role}`, 'public', `i.ariaLabel = 'Save'; ${st}`)
    )
  });
  cases.push({
    label: `${role}: _internals, no label`,
    rule,
    expect: 'fail',
    html: page(`<x-${role} role="${role}"></x-${role}>`, define(`x-${role}`, 'public', st))
  });
  cases.push({
    label: `${role}: aria-label="" over internals label`,
    rule,
    expect: 'fail',
    html: page(
      `<x-${role} role="${role}" aria-label=""></x-${role}>`,
      define(`x-${role}`, 'public', `i.ariaLabel = 'Save'; ${st}`)
    )
  });
  cases.push({
    label: `${role}: undefined custom element, no name`,
    rule,
    expect: 'fail',
    html: page(
      `<x-${role} role="${role}"${role === 'checkbox' ? ' aria-checked="false"' : role === 'slider' ? ' aria-valuenow="5"' : ''}></x-${role}>`
    )
  });
}
cases.push({
  label: 'built-in <button></button>',
  rule: 'button-name-present',
  expect: 'fail',
  html: page('<button></button>')
});
for (const [role, attr, set] of [
  ['checkbox', 'aria-checked', "i.ariaChecked = 'false';"],
  ['slider', 'aria-valuenow', "i.ariaValueNow = '5';"]
]) {
  cases.push({
    label: `${role}: ${attr} via _internals`,
    rule: 'aria-required-attr',
    expect: 'pass',
    html: page(
      `<x-${role} role="${role}" aria-label="Volume"></x-${role}>`,
      define(`x-${role}`, 'public', set)
    )
  });
  cases.push({
    label: `${role}: ${attr} via #private`,
    rule: 'aria-required-attr',
    expect: 'cantTell',
    html: page(
      `<x-${role} role="${role}" aria-label="Volume"></x-${role}>`,
      define(`x-${role}`, 'private', set)
    )
  });
  cases.push({
    label: `${role}: ${attr} unset, _internals`,
    rule: 'aria-required-attr',
    expect: 'fail',
    html: page(
      `<x-${role} role="${role}" aria-label="Volume"></x-${role}>`,
      define(`x-${role}`, 'public', '')
    )
  });
}

for (const c of cases) {
  test(`ElementInternals, in Chromium: ${c.label}`, { skip }, async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await browser.newPage();
      await p.setContent(c.html);
      await p.addScriptTag({ content: BUNDLE });
      const outcome = await p.evaluate(
        (ruleId) =>
          window.a11ycore
            .runa11yCoreInPage(location.href, null, {}, { includeRuleIds: [ruleId] })
            .checksResults.find((r) => r.ruleId === ruleId).outcome,
        c.rule
      );
      assert.equal(outcome, c.expect);
    } finally {
      await browser.close();
    }
  });
}
