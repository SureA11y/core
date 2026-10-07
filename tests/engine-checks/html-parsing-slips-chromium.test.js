'use strict';

/**
 * Four places where rules read markup as HTML does (#152), each checked
 * against Chromium:
 * - an image map is used when usemap is "#" and the map's id or name,
 *   matched exactly (Chromium moves focus into the map's area);
 * - autocomplete tokens are split on ASCII whitespace, and "section-" alone
 *   is a section token (Chromium's autocomplete getter, HTML's autofill
 *   processing, returns "" for an invalid value);
 * - scope is read on <th> only, in any case and untrimmed (the header role
 *   Chromium gives the cell);
 * - text directly inside a <ul> belongs to no list item.
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
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

test(
  'rules read usemap, autocomplete, scope and list text as HTML does, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    async function withPage(body, fn) {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
        );
        return await fn(page);
      } finally {
        await page.close();
      }
    }
    const outcomeOf = async (page, ruleId) => {
      await page.addScriptTag({ content: BUNDLE });
      return page.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0].outcome,
        ruleId
      );
    };

    // [usemap, map attributes, whether Chromium uses the map]
    for (const [usemap, attrs, used] of [
      ['#map', 'name="map"', true],
      ['#m2', 'id="m2" name="other"', true],
      ['#Map', 'name="map"', false],
      ['map', 'name="map"', false],
      ['#map ', 'name="map"', false]
    ]) {
      await t.test(`usemap=${JSON.stringify(usemap)} with <map ${attrs}>`, async () => {
        await withPage(
          `<img src="${IMG}" width="100" height="100" alt="Plan" usemap="${usemap}"><map ${attrs}><area shape="rect" coords="0,0,50,50" href="/a"></map>`,
          async (page) => {
            await page.keyboard.press('Tab');
            const focused = await page.evaluate(() => document.activeElement.tagName);
            assert.equal(focused === 'AREA', used, 'Chromium');
            assert.equal(
              await outcomeOf(page, 'area-alt-present'),
              used ? 'fail' : 'notApplicable'
            );
          }
        );
      });
    }

    // [autocomplete value, whether it is valid]
    for (const [value, valid] of [
      ['section- email', true],
      ['email ', false],
      [' email', false]
    ]) {
      await t.test(`autocomplete=${JSON.stringify(value)}`, async () => {
        await withPage(`<label>E <input id="f" autocomplete="${value}"></label>`, async (page) => {
          const idl = await page.evaluate(() => document.getElementById('f').autocomplete);
          assert.equal(idl !== '', valid, 'Chromium');
          assert.equal(await outcomeOf(page, 'autocomplete-valid'), valid ? 'pass' : 'fail');
        });
      });
    }

    // [header cell, the role Chromium gives it, the rule's outcome]
    for (const [cell, role, outcome] of [
      ['<th scope="col">H</th>', 'columnheader', 'pass'],
      ['<th scope=" col ">H</th>', 'rowheader', 'cantTell'],
      ['<td scope="foo">H</td>', 'cell', 'notApplicable']
    ]) {
      await t.test(cell, async () => {
        await withPage(
          `<table><tr>${cell}<td>x</td></tr><tr><td>a</td><td>b</td></tr></table>`,
          async (page) => {
            const cdp = await page.context().newCDPSession(page);
            const { nodes } = await cdp.send('Accessibility.getFullAXTree');
            const first = nodes.find((n) => !n.ignored && /cell|header/i.test(n.role.value));
            assert.equal(first.role.value, role, 'Chromium');
            assert.equal(await outcomeOf(page, 'scope-attr-valid'), outcome);
          }
        );
      });
    }

    await t.test('text directly inside a <ul>', async () => {
      await withPage('<ul>Fruits<li>Apple</li></ul>', async (page) => {
        assert.equal(await outcomeOf(page, 'list-children-valid'), 'fail');
      });
    });
  }
);
