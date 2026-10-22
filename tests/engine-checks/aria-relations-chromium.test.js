'use strict';

/**
 * What Chromium's accessibility tree does with the ARIA constraints the
 * rules check, so each verdict rests on browser behaviour, not on the
 * specification alone:
 * - aria-valid-attr-value fails an aria-valuenow outside its range exactly
 *   when Chromium exposes another value (it clamps to the range, with
 *   ARIA's 0 to 100 defaults on the roles that have them);
 * - aria-owns-valid: an element named by two aria-owns is a child of one
 *   owner only, and an owner naming its ancestor gets no such child;
 * - aria-allowed-attr judges a[href], area[href], img, select, an input
 *   with a datalist and a <td> by the role Chromium gives them, and
 *   label-in-name judges a <td> in a grid as the gridcell it is;
 * - a heading marked role="none" stays a heading when it can take focus
 *   or carries a global ARIA attribute, and the heading rules count it;
 * - a <th> heading a row is a rowheader in Chromium, which the engine
 *   leaves out of aria-allowed-attr's scope (the attributes it supports
 *   are a columnheader's too);
 * - a popovertarget button has an expanded state with no aria-expanded, so
 *   a rule that ever requires aria-expanded has to count it.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('../helpers/chromium.js');

const { addBundle } = require('../helpers/browserBundle');

async function axOf(page, cdp, selector) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { node } = await cdp.send('DOM.describeNode', { nodeId });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
    backendNodeId: node.backendNodeId,
    fetchRelatives: false
  });
  const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
  const children = ax
    ? (await cdp.send('Accessibility.getChildAXNodes', { id: ax.nodeId })).nodes
    : [];
  const prop = (name) => {
    const p = ((ax && ax.properties) || []).find((x) => x.name === name);
    return p ? p.value.value : undefined;
  };
  return {
    role: ax && ax.role ? ax.role.value : null,
    ignored: !!(ax && ax.ignored),
    value: ax && ax.value ? ax.value.value : undefined,
    prop,
    childRoles: children.map((c) => c.role && c.role.value)
  };
}

async function ruleOutcome(page, ruleId) {
  await addBundle(page);
  return page.evaluate((id) => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0];
    const occ = (r.occurrences || [])[0];
    return {
      outcome: r.outcome,
      code: (occ && occ.data && occ.data.details && occ.data.details.reasonCode) || null,
      role: (occ && occ.data && occ.data.details && occ.data.details.role) || null
    };
  }, ruleId);
}

test('ARIA constraints follow Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function withPage(markup, fn) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${markup}</main></body></html>`
      );
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Accessibility.enable');
      await fn(page, cdp);
    } finally {
      await page.close();
    }
  }

  // [markup with #w, whether Chromium exposes a value other than aria-valuenow]
  const RANGES = [
    [
      '<div id="w" role="slider" tabindex="0" aria-label="v" aria-valuemin="0" aria-valuemax="10" aria-valuenow="50"></div>',
      true
    ],
    ['<div id="w" role="slider" tabindex="0" aria-label="v" aria-valuenow="150"></div>', true],
    ['<div id="w" role="progressbar" aria-label="v" aria-valuenow="150"></div>', true],
    [
      '<div id="w" role="spinbutton" tabindex="0" aria-label="v" aria-valuemax="10" aria-valuenow="50"></div>',
      true
    ],
    [
      '<div id="w" role="slider" tabindex="0" aria-label="v" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5"></div>',
      false
    ],
    ['<div id="w" role="spinbutton" tabindex="0" aria-label="v" aria-valuenow="150"></div>', false]
  ];
  for (const [markup, clamped] of RANGES) {
    await t.test(`range: ${markup}`, () =>
      withPage(markup, async (page, cdp) => {
        const ax = await axOf(page, cdp, '#w');
        const stated = await page.evaluate(() =>
          Number(document.getElementById('w').getAttribute('aria-valuenow'))
        );
        assert.equal(ax.value !== stated, clamped, `Chromium exposes ${ax.value}`);
        const got = await ruleOutcome(page, 'aria-valid-attr-value');
        assert.deepEqual(
          [got.outcome, got.code],
          clamped ? ['fail', 'ARIA_VALUENOW_OUT_OF_RANGE'] : ['pass', null]
        );
      })
    );
  }

  await t.test('aria-owns: an element named twice belongs to one owner', () =>
    withPage(
      '<div id="a" role="list" aria-label="a" aria-owns="i"></div><div id="b" role="list" aria-label="b" aria-owns="i"></div><div id="i" role="listitem">x</div>',
      async (page, cdp) => {
        const a = await axOf(page, cdp, '#a');
        const b = await axOf(page, cdp, '#b');
        const owners = [a, b].filter((n) => n.childRoles.includes('listitem')).length;
        assert.equal(owners, 1);
        assert.equal((await ruleOutcome(page, 'aria-owns-valid')).code, 'ARIA_OWNS_DUPLICATE');
      }
    )
  );

  await t.test('aria-owns: an owner naming its ancestor gets no such child', () =>
    withPage(
      '<div id="o"><div id="g" role="group" aria-label="g" aria-owns="o">x</div></div>',
      async (page, cdp) => {
        const g = await axOf(page, cdp, '#g');
        assert.deepEqual(g.childRoles, ['StaticText']);
        assert.equal((await ruleOutcome(page, 'aria-owns-valid')).code, 'ARIA_OWNS_ANCESTOR');
      }
    )
  );

  // [markup with #w, Chromium's role, the role aria-allowed-attr judges it as]
  const KEYED = [
    ['<a id="w" href="#x" aria-pressed="true">x</a>', 'link', 'link'],
    [
      '<img id="w" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Logo" aria-checked="true">',
      'image',
      'img'
    ],
    [
      '<select id="w" aria-label="s" aria-pressed="true"><option>a</option></select>',
      'combobox',
      'combobox'
    ],
    [
      '<select id="w" aria-label="s" size="3" aria-pressed="true"><option>a</option></select>',
      'listbox',
      'listbox'
    ],
    // HTML-AAM: a text-like input with a datalist is a combobox; one whose
    // list names nothing stays a textbox.
    [
      '<input id="w" list="dl" aria-label="c" aria-pressed="true"><datalist id="dl"><option>a</option></datalist>',
      'combobox',
      'combobox'
    ],
    [
      '<input id="w" type="email" list="dl" aria-label="c" aria-pressed="true"><datalist id="dl"><option>a</option></datalist>',
      'combobox',
      'combobox'
    ],
    ['<input id="w" list="nope" aria-label="c" aria-pressed="true">', 'textbox', 'textbox'],
    // A <td> takes its role from its table.
    [
      '<table><tr><th>A</th></tr><tr><td id="w" aria-pressed="true">x</td></tr></table>',
      'cell',
      'cell'
    ],
    [
      '<table role="grid" aria-label="g"><tr><td id="w" aria-pressed="true">x</td></tr></table>',
      'gridcell',
      'gridcell'
    ]
  ];
  for (const [markup, chromeRole, ruleRole] of KEYED) {
    await t.test(`role keyed on attributes: ${markup}`, () =>
      withPage(markup, async (page, cdp) => {
        assert.equal((await axOf(page, cdp, '#w')).role, chromeRole);
        const got = await ruleOutcome(page, 'aria-allowed-attr');
        assert.deepEqual([got.code, got.role], ['ARIA_ATTR_NOT_ALLOWED', ruleRole]);
      })
    );
  }

  await t.test(
    'a <td> in a grid is a gridcell, named by aria-label, so label-in-name judges it',
    () =>
      withPage(
        '<table role="grid" aria-label="g"><tr><td id="w" tabindex="0" aria-label="Remove row">Delete</td></tr></table>',
        async (page, cdp) => {
          const ax = await axOf(page, cdp, '#w');
          assert.equal(ax.role, 'gridcell');
          const got = await ruleOutcome(page, 'label-in-name');
          assert.deepEqual(
            [got.outcome, got.code],
            ['fail', 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME']
          );
        }
      )
  );

  await t.test(
    'a <th> heading a row is a rowheader, with the same attributes as a columnheader',
    () =>
      withPage(
        '<table><tr><th>Name</th><th>Age</th></tr><tr><th id="w" aria-sort="ascending">Ann</th><td>3</td></tr></table>',
        async (page, cdp) => {
          const ax = await axOf(page, cdp, '#w');
          assert.equal(ax.role, 'rowheader');
          assert.equal((await ruleOutcome(page, 'aria-allowed-attr')).outcome, 'notApplicable');
        }
      )
  );

  // Presentational roles conflict resolution: Chromium keeps the heading role
  // on a heading that can take focus or carries a global ARIA attribute.
  for (const [markup, chromeRole] of [
    ['<h2 id="w" role="none" aria-label="">Part</h2>', 'heading'],
    ['<h2 id="w" role="presentation" tabindex="0">Part</h2>', 'heading'],
    ['<h2 id="w" role="none">Part</h2>', 'none']
  ]) {
    await t.test(`role="none" on a heading: ${markup}`, () =>
      withPage(`<h1>Title</h1>${markup}<h3>Sub</h3>`, async (page, cdp) => {
        assert.equal((await axOf(page, cdp, '#w')).role, chromeRole);
        const got = await ruleOutcome(page, 'heading-order');
        assert.equal(got.outcome, chromeRole === 'heading' ? 'pass' : 'cantTell');
      })
    );
  }

  await t.test('img alt="" with nothing naming it has no role', () =>
    withPage(
      '<img id="w" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="">',
      async (page, cdp) => {
        const ax = await axOf(page, cdp, '#w');
        assert.ok(ax.ignored || ax.role === 'none' || ax.role === 'presentation', ax.role);
      }
    )
  );

  await t.test('a popovertarget button has an expanded state of its own', () =>
    withPage(
      '<button id="w" popovertarget="p">Menu</button><div id="p" popover>Items</div>',
      async (page, cdp) => {
        assert.equal((await axOf(page, cdp, '#w')).prop('expanded'), false);
        await page.evaluate(() => document.getElementById('p').showPopover());
        assert.equal((await axOf(page, cdp, '#w')).prop('expanded'), true);
      }
    )
  );
});
