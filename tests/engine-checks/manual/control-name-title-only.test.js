'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'control-name-title-only';

function run(body) {
  return runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

function ids(rule) {
  return rule.occurrences.map((o) => o.selector);
}

test(`${RULE_ID}: notApplicable without a button or link carrying a title`, () => {
  assertRule(
    run(
      '<a href="/">Home</a><button>Save</button><p title="Note">Text</p><a href="/" title="">x</a>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass when something other than the title names the control`, () => {
  assertRule(
    run(
      [
        '<a href="/a" title="Annual report, PDF">Annual report</a>',
        '<button title="Save the draft">Save</button>',
        '<button title="Close" aria-label="Close dialog"><svg aria-hidden="true"></svg></button>',
        '<a href="/b" title="Home"><img src="h.png" alt="Home"></a>',
        '<input type="button" value="Print" title="Print the page">',
        '<input type="submit" title="Send">',
        '<input type="reset" title="Clear">',
        '<input type="image" src="s.png" alt="Search" title="Search the site">',
        '<span id="l">Settings</span><div role="button" tabindex="0" title="Open" aria-labelledby="l"></div>'
      ].join('')
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: a button named only by its title is asked about`, () => {
  const rule = assertRule(
    run('<button id="b" title="Close"><svg aria-hidden="true"></svg></button>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'NAME_FROM_TITLE_ONLY',
    role: 'button'
  });
  assert.equal(rule.occurrences[0].uncertainty, undefined, 'a manual rule carries no uncertainty');
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'controlNameTitleOnly_summary_cantTell_button');
});

test(`${RULE_ID}: a link, an ARIA button and input buttons named only by a title`, () => {
  const rule = assertRule(
    run(
      [
        '<a id="a" href="/" title="Home"><span class="icon-home"></span></a>',
        '<div id="d" role="button" tabindex="0" title="Menu"></div>',
        '<span id="s" role="link" tabindex="0" title="Next"></span>',
        '<input id="i" type="button" title="Print">',
        '<input id="m" type="image" src="s.png" title="Search">',
        '<map name="m"><area id="r" href="/x" shape="rect" coords="0,0,1,1" title="Region"></map><img src="x.png" alt="Map" usemap="#m">'
      ].join('')
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(ids(rule).sort(), ['#a', '#d', '#i', '#m', '#r', '#s']);
  const link = rule.occurrences.find((o) => o.selector === '#a');
  assert.equal(link.data.details.role, 'link');
  assert.equal(link.i18n.summaryKey, 'controlNameTitleOnly_summary_cantTell_link');
});

test(`${RULE_ID}: roles that are not button or link, and hidden controls, are left out`, () => {
  assertRule(
    run(
      [
        '<a href="/" role="tab" title="One"></a>',
        '<button role="checkbox" aria-checked="false" title="Agree"></button>',
        '<button title="Hidden" hidden></button>',
        '<button title="Off" aria-hidden="true" tabindex="-1"></button>',
        '<span role="none" title="Decoration"></span>',
        '<a title="No href"></a>'
      ].join('')
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: a focusable control keeps its role through role="none"`, () => {
  const rule = assertRule(
    run('<button id="b" role="none" title="Close"></button>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(ids(rule), ['#b']);
});

test(`${RULE_ID}: content of blank characters is not a name, and leaves the title out`, () => {
  // accname 2F returns content of only non-breaking spaces, so the title
  // never names the link; link-name-present reports it unnamed instead.
  assertRule(run('<a href="/" title="Home">&nbsp;</a>'), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: the scenario fixture`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const r = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(r, RULE_ID, 'cantTell');
  assert.deepEqual(ids(rule).sort(), ['#cnto_case_05', '#cnto_case_06', '#cnto_case_07']);
});
