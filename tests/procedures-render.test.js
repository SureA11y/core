'use strict';

// Procedures as a document (src/procedures-render.js, docs/PROCEDURES.md
// "Rendering them"): what listProcedures, procedureChecklist and
// proceduresFor give, as an HTML page or Markdown. The pages are held to
// core's own rules, in jsdom and, where Playwright's Chromium is installed,
// in Chromium in light and dark mode; a worksheet's script is run in jsdom.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const {
  listProcedures,
  procedureChecklist,
  proceduresFor,
  renderProcedures
} = require('../src/index.js');
const { renderProceduresFrom } = require('../src/procedures-core.js');
const { definePack } = require('../src/pack.js');
const { runa11yCoreOnHtml } = require('../src/testing.js');

const en = require('../src/i18n/procedures/en.json');
const fr = require('../src/i18n/procedures/fr.json');

const AA = { levels: ['A', 'AA'] };

const doc = (html, opts) => new JSDOM(html, opts).window.document;

// A pack whose standard has groups, French titles, its own requirement and
// text a page must show as written.
const HOSTILE = '<script>window.__pwned = 1</script> **bold** [x](y) `code` | #';
const pack = definePack({
  name: 'stdr-pack',
  version: '1.0.0',
  namespace: 'stdr',
  core: '*',
  standard: {
    key: 'stdr',
    standard: 'Std R',
    versions: ['1.0'],
    ruleTag: 'stdr',
    mappingsFor: () => [],
    report: { titleLang: 'fr' },
    procedures: {
      '1.0': {
        1.1: { title: 'Images porteuses d’information', wcag: '1.1.1' },
        1.2: { title: 'Contraste', wcag: '1.4.3' },
        2.1: {
          title: `Formulaires ${HOSTILE}`,
          facets: [
            {
              id: 'text-version',
              label: `Each form has a text version ${HOSTILE}`,
              tools: ['keyboard'],
              steps: [`Find each form. ${HOSTILE}`],
              passWhen: 'Every form has a text version.',
              failWhen: 'A form has none, which fails {{requirement}}.'
            }
          ]
        }
      }
    },
    groups: {
      '1.0': [
        { id: '1', title: 'Images et couleurs', requirements: ['1.1', '1.2'] },
        { id: '2', title: 'Formulaires', requirements: ['2.1'] }
      ]
    }
  }
});

test('it takes a list, a checklist or one requirement, as HTML or Markdown', () => {
  for (const input of [listProcedures(AA), procedureChecklist(AA), proceduresFor('1.4.3')]) {
    assert.match(renderProcedures(input), /^<!doctype html>/);
    assert.match(renderProcedures(input, { format: 'markdown' }), /^# /);
  }
  assert.throws(() => renderProcedures({}), TypeError);
  assert.throws(() => renderProcedures(null), TypeError);
  assert.throws(() => renderProcedures(listProcedures(), { format: 'pdf' }), /format must be/);
});

test('the same input always gives the same page', () => {
  const list = listProcedures(AA);
  assert.equal(renderProcedures(list), renderProcedures(list));
  const checklist = procedureChecklist(AA);
  assert.equal(renderProcedures(checklist), renderProcedures(checklist));
});

test('a list is a reference: every requirement in its groups, with a contents', () => {
  const list = listProcedures(AA);
  const d = doc(renderProcedures(list));
  assert.equal(d.documentElement.lang, 'en');
  assert.equal(d.title, 'WCAG 2.2: how to assess each requirement');
  assert.equal(d.querySelector('h1').textContent, d.title);
  const reqs = [...d.querySelectorAll('article.req')];
  assert.equal(reqs.length, list.requirements.length);
  // Every facet with a procedure of its own has a section; a technology
  // facet is named under the one that assesses it.
  const own = list.requirements.reduce(
    (n, r) => n + r.facets.filter((f) => !f.coveredBy).length,
    0
  );
  assert.equal(d.querySelectorAll('section.facet').length, own);
  const mechanism = d.getElementById('facet-1-1-1-text-alternative-mechanism').closest('section');
  assert.ok(mechanism.querySelector('.covers li'));
  assert.match(mechanism.querySelector('.rules').textContent, /img-alt-present/);
  // The contents link to each group, and every link lands on an element.
  const links = [...d.querySelectorAll('nav.toc a')];
  assert.equal(links.length, 4 + list.groups.reduce((n, p) => n + p.groups.length, 0));
  for (const a of links) assert.ok(d.getElementById(a.getAttribute('href').slice(1)), a.href);
  // Scope: the levels asked for.
  assert.match(d.querySelector('header.page').textContent, /Levels: A, AA/);
});

test('its structure holds: unique ids, labels that exist, headings that go down one at a time', () => {
  for (const html of [
    renderProcedures(listProcedures(AA), { variants: true }),
    renderProcedures(procedureChecklist(AA)),
    renderProcedures(listProcedures({ packs: [pack], standard: 'stdr' }), { packs: [pack] }),
    renderProcedures(proceduresFor('2.4.3'))
  ]) {
    const d = doc(html);
    const ids = [...d.querySelectorAll('[id]')].map((el) => el.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate id');
    for (const el of d.querySelectorAll('[aria-labelledby]')) {
      assert.ok(d.getElementById(el.getAttribute('aria-labelledby')), el.outerHTML.slice(0, 80));
    }
    for (const label of d.querySelectorAll('label[for]')) {
      assert.ok(d.getElementById(label.htmlFor), label.htmlFor);
    }
    let last = 1;
    for (const h of d.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')) {
      const level = Number(h.tagName[1]);
      assert.ok(level <= last + 1, `${h.tagName} after h${last}: ${h.textContent}`);
      last = level;
    }
  }
});

// Core's own rules, on the pages core writes.
function failuresOf(result) {
  return result.checksResults
    .filter((c) => c.outcome === 'fail')
    .map((c) => `${c.ruleId}: ${c.occurrences.map((o) => o.selector).join(', ')}`);
}

test('core’s rules find nothing failing on its pages, in jsdom', () => {
  for (const html of [
    renderProcedures(listProcedures({ levels: 'A' }), { variants: true }),
    renderProcedures(procedureChecklist({ levels: 'A', locale: 'fr' })),
    renderProcedures(listProcedures({ packs: [pack], standard: 'stdr' }), { packs: [pack] })
  ]) {
    assert.deepEqual(
      failuresOf(runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } })),
      []
    );
  }
});

test('in another language, its words are the locale’s and the English text says so', () => {
  const checklist = procedureChecklist({ levels: 'A', locale: 'fr' });
  assert.equal(checklist.locale, 'fr');
  const d = doc(renderProcedures(checklist));
  assert.equal(d.documentElement.lang, 'fr');
  assert.equal(d.title, 'WCAG 2.2 : liste de vérification manuelle');
  assert.equal(d.querySelector('.skip').textContent, 'Aller aux procédures');
  const item = d.querySelector('article.item');
  // The facet's label and its general procedure are in English only.
  assert.equal(item.querySelector('h3, h4, h5').getAttribute('lang'), 'en');
  assert.equal(item.querySelector('ol.steps').getAttribute('lang'), 'en');
  // The page's own words and the tools' names are French, with no mark.
  assert.match(item.querySelector('.badges').textContent, /Outils : Les outils de développement/);
  assert.equal(item.querySelector('.badges [lang]'), null);
  assert.equal(item.querySelector('legend').firstChild.textContent, 'Résultat');
  // A requested locale overrides the list's.
  const de = doc(renderProcedures(checklist, { locale: 'de' }));
  assert.equal(de.documentElement.lang, 'de');
  // In English, nothing needs a mark.
  assert.equal(
    doc(renderProcedures(procedureChecklist({ levels: 'A' }))).querySelector('main [lang]'),
    null
  );
});

test('a translated procedure is not marked; one only English has is', () => {
  const list = listProcedures({ levels: 'A', locale: 'fr', variants: true });
  const html = renderProcedures(list, { variants: true });
  const d = doc(html);
  // The variants of core's rules are translated: their steps carry no mark.
  const variant = d.querySelector('details.variants .variant ol.steps');
  assert.ok(variant);
  assert.equal(variant.getAttribute('lang'), null);
});

test('a pack’s standard is shown in its groups, its titles in their language', () => {
  const html = renderProcedures(listProcedures({ packs: [pack], standard: 'stdr' }), {
    packs: [pack]
  });
  const d = doc(html);
  assert.equal(d.title, 'Std R 1.0: how to assess each requirement');
  assert.deepEqual(
    [...d.querySelectorAll('section.group > h2')].map((h) => h.textContent),
    ['1 Images et couleurs', '2 Formulaires']
  );
  assert.equal(d.querySelector('section.group > h2 span[lang]').getAttribute('lang'), 'fr');
  assert.equal(d.querySelector('#req-1-1 span[lang]').getAttribute('lang'), 'fr');
  // Its own text, with the requirement it is read as.
  assert.match(d.body.textContent, /A form has none, which fails Std R 2\.1\./);
  assert.match(d.body.textContent, /Restates WCAG 1\.1\.1/);
});

test('text from a pack shows as written: no markup, no script, no Markdown', () => {
  const list = listProcedures({ packs: [pack], standard: 'stdr' });
  const dom = new JSDOM(renderProcedures(list), { runScripts: 'dangerously' });
  assert.equal(dom.window.__pwned, undefined);
  assert.match(dom.window.document.body.textContent, /<script>window\.__pwned = 1<\/script>/);
  const handlers = [...dom.window.document.querySelectorAll('*')].filter((el) =>
    [...el.attributes].some((a) => /^on/i.test(a.name))
  );
  assert.deepEqual(handlers, []);
  dom.window.close();
  const md = renderProcedures(list, { format: 'markdown' });
  assert.ok(
    md.includes(
      '\\<script\\>window.\\_\\_pwned = 1\\</script\\> \\*\\*bold\\*\\* \\[x\\](y) \\`code\\` \\| \\#'
    )
  );
  const checklist = renderProcedures(procedureChecklist({ packs: [pack], standard: 'stdr' }));
  assert.ok(!checklist.includes('<script>window.__pwned'));
});

// The worksheet: run its script in jsdom, with a store and downloads it can
// reach.
function worksheet(html, storage = {}) {
  const downloads = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://example.test/checklist.html',
    beforeParse(window) {
      for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
      window.URL.createObjectURL = (blob) => {
        downloads.push(blob);
        return `blob:${downloads.length}`;
      };
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () {
        downloads[downloads.length - 1].name = this.download;
      };
    }
  });
  return { dom, d: dom.window.document, downloads };
}

const choose = (d, item, value) => {
  const radio = item.querySelector(`input[value="${value}"]`);
  radio.checked = true;
  radio.dispatchEvent(new d.defaultView.Event('change', { bubbles: true }));
};

test('a checklist is a worksheet: results and notes kept, counted and downloaded', async () => {
  const checklist = procedureChecklist({ levels: 'A' });
  const html = renderProcedures(checklist);
  const { dom, d, downloads } = worksheet(html);
  const items = [...d.querySelectorAll('article.item')];
  assert.equal(items.length, checklist.items.length);
  const status = d.getElementById('record-progress');
  assert.equal(status.getAttribute('role'), 'status');
  assert.equal(
    status.textContent,
    `Checked: 0 of ${items.length} · Passes: 0 · Fails: 0 · Does not apply: 0`
  );

  choose(d, items[0], 'pass');
  choose(d, items[1], 'fail');
  const notes = items[1].querySelector('textarea');
  notes.value = 'The logo has no alt.';
  notes.dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
  choose(d, items[2], 'notApplicable');
  assert.equal(
    status.textContent,
    `Checked: 3 of ${items.length} · Passes: 1 · Fails: 1 · Does not apply: 1`
  );
  assert.equal(items[1].getAttribute('data-outcome'), 'fail');

  // Kept in the browser, and back on the next visit.
  const storage = {};
  for (let i = 0; i < dom.window.localStorage.length; i++) {
    const k = dom.window.localStorage.key(i);
    storage[k] = dom.window.localStorage.getItem(k);
  }
  assert.equal(Object.keys(storage).length, 1);
  const again = worksheet(html, storage);
  const items2 = [...again.d.querySelectorAll('article.item')];
  assert.equal(items2[1].querySelector('input[value="fail"]').checked, true);
  assert.equal(items2[1].querySelector('textarea').value, 'The logo has no alt.');
  assert.match(again.d.getElementById('record-progress').textContent, /^Checked: 3 of/);

  // Downloads: JSON with each requirement rolled up, and CSV.
  d.getElementById('record-json').click();
  const json = JSON.parse(await downloads[0].text());
  assert.equal(downloads[0].name, 'wcag-2.2-results.json');
  assert.deepEqual(
    { standard: json.standard, version: json.version, title: json.title },
    { standard: 'wcag', version: '2.2', title: 'WCAG 2.2: manual checklist' }
  );
  assert.equal(json.items.length, items.length);
  assert.deepEqual(json.items[1], {
    key: checklist.items[1].key,
    facet: checklist.items[1].facet,
    label: checklist.items[1].label,
    requirements: checklist.items[1].requirements,
    outcome: 'fail',
    notes: 'The logo has no alt.'
  });
  const r111 = json.requirements.find((r) => r.id === '1.1.1');
  assert.equal(r111.outcome, 'fail');
  assert.ok(
    json.requirements.every((r) => ['pass', 'fail', 'open', 'notApplicable'].includes(r.outcome))
  );
  d.getElementById('record-csv').click();
  const bytes = Buffer.from(await downloads[1].arrayBuffer());
  assert.equal(downloads[1].name, 'wcag-2.2-results.csv');
  // A byte order mark first, so a spreadsheet reads it as UTF-8.
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const csv = bytes.subarray(3).toString('utf8');
  assert.ok(csv.startsWith('"key","facet","label","requirements","outcome","notes"\r\n'));
  assert.match(csv, /"fail","The logo has no alt\."/);

  // Clearing asks twice.
  const clear = d.getElementById('record-clear');
  clear.click();
  assert.ok(clear.hasAttribute('data-armed'));
  assert.equal(items[0].querySelector('input[value="pass"]').checked, true);
  clear.click();
  assert.equal(items[0].querySelector('input[value="open"]').checked, true);
  assert.equal(notes.value, '');
  assert.match(status.textContent, /^Checked: 0 of/);
  assert.equal(dom.window.localStorage.getItem(Object.keys(storage)[0]), '{}');
  dom.window.close();
  again.dom.window.close();
});

test('a requirement’s result rolls up from its items', async () => {
  const checklist = procedureChecklist({ levels: 'A' });
  const { dom, d, downloads } = worksheet(renderProcedures(checklist));
  const items = [...d.querySelectorAll('article.item')];
  const of111 = items.filter((i) => JSON.parse(i.dataset.requirements).includes('1.1.1'));
  assert.ok(of111.length > 1);
  of111.forEach((i) => choose(d, i, 'notApplicable'));
  d.getElementById('record-json').click();
  let json = JSON.parse(await downloads[0].text());
  assert.equal(json.requirements.find((r) => r.id === '1.1.1').outcome, 'notApplicable');
  choose(d, of111[0], 'pass');
  d.getElementById('record-json').click();
  json = JSON.parse(await downloads[1].text());
  assert.equal(json.requirements.find((r) => r.id === '1.1.1').outcome, 'pass');
  choose(d, of111[1], 'open');
  d.getElementById('record-json').click();
  json = JSON.parse(await downloads[2].text());
  assert.equal(json.requirements.find((r) => r.id === '1.1.1').outcome, 'open');
  dom.window.close();
});

test('options: no recording, finding steps, a title, a fragment', () => {
  const checklist = procedureChecklist({ levels: 'A' });
  const plain = renderProcedures(checklist, { record: false });
  assert.ok(!plain.includes('<fieldset'));
  assert.ok(!plain.includes('<script'));
  const list = listProcedures({ levels: 'A' });
  assert.ok(!renderProcedures(list).includes('details class="variants"'));
  assert.ok(renderProcedures(list, { variants: true }).includes('details class="variants"'));
  assert.match(
    renderProcedures(list, { title: 'Audit of example.test' }),
    /<title>Audit of example\.test<\/title>/
  );
  const fragment = renderProcedures(checklist, { fragment: true });
  assert.match(fragment, /^<div class="surea11y-procedures" lang="en">/);
  for (const tag of ['<!doctype', '<html', '<style', '<script', '<main', '<fieldset']) {
    assert.ok(!fragment.includes(tag), tag);
  }
});

test('filters show in the page’s scope, and an empty list says so', () => {
  const sr = listProcedures({
    tools: 'screen-reader',
    automation: ['manual'],
    rules: 'img-alt-present'
  });
  const d = doc(renderProcedures(sr));
  const scope = [...d.querySelectorAll('header.page li')].map((li) => li.textContent);
  assert.deepEqual(scope, [
    'Only what needs: A screen reader',
    'Only what is: Only a person can check it',
    'Only what these rules test: img-alt-present'
  ]);
  const none = listProcedures({ rules: 'no-such-rule' });
  const empty = doc(renderProcedures(none));
  assert.match(empty.querySelector('main').textContent, /Nothing to show/);
  assert.equal(empty.querySelector('nav.toc'), null);
});

test('one requirement is a page of its own, with no groups', () => {
  // One requirement doesn't say the locale it was read in: the page is told.
  const d = doc(renderProcedures(proceduresFor('1.4.12', { locale: 'es' }), { locale: 'es' }));
  assert.equal(d.documentElement.lang, 'es');
  assert.equal(d.title, 'Cómo evaluar WCAG 1.4.12 Text Spacing');
  assert.equal(d.querySelector('nav.toc'), null);
  assert.equal(d.querySelectorAll('article.req').length, 1);
  assert.equal(d.querySelector('article.req > h2').textContent, '1.4.12 Text Spacing');
});

test('Markdown: headings for the groups, task items for a checklist', () => {
  const md = renderProcedures(procedureChecklist({ levels: 'A' }), { format: 'markdown' });
  const lines = md.split('\n');
  assert.equal(lines[0], '# WCAG 2.2: manual checklist');
  assert.ok(lines.includes('## 1 Perceivable'));
  assert.ok(lines.includes('### 1.1 Text Alternatives'));
  assert.ok(lines.includes('- [ ] **Text alternative mechanism present**'));
  assert.ok(md.endsWith('\n') && !md.endsWith('\n\n'));
  const list = renderProcedures(listProcedures({ levels: 'A' }), { format: 'markdown' });
  assert.ok(list.split('\n').includes('#### 1.1.1 Non-text Content'));
  assert.match(list, /\*\*Passes when:\*\* /);
});

test('the browser form gives what the Node one does', () => {
  for (const [input, options] of [
    [listProcedures({ levels: 'A', locale: 'fr' }), {}],
    [procedureChecklist({ levels: 'A' }), { format: 'markdown' }],
    [proceduresFor('1.4.3'), { variants: true }]
  ]) {
    assert.equal(
      renderProceduresFrom({ en, fr }, input, options),
      renderProcedures(input, options)
    );
  }
});

// In Chromium, where colors, layout and the dark scheme are real.
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

test(
  'core’s rules find nothing failing on its pages, in Chromium, light and dark',
  { skip },
  async (t) => {
    const { addBundle } = require('./helpers/browserBundle');
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const pages = {
      list: renderProcedures(listProcedures({ levels: 'A' }), { variants: true }),
      checklist: renderProcedures(procedureChecklist({ levels: 'A', locale: 'ja' }))
    };
    for (const [name, html] of Object.entries(pages)) {
      for (const colorScheme of ['light', 'dark']) {
        await t.test(`${name}, ${colorScheme}`, async () => {
          const page = await browser.newPage({ colorScheme });
          try {
            await page.setContent(html);
            await addBundle(page);
            const result = await page.evaluate(() =>
              window.a11ycore.runa11yCoreInPage(null, null, { profile: 'wcag22-aa' }, null)
            );
            assert.deepEqual(failuresOf(result), []);
          } finally {
            await page.close();
          }
        });
      }
    }
  }
);
