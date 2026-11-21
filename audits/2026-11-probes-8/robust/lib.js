'use strict';
// Shared helpers for the r7 robustness audit. Read-only use of /home/user/core.
const { JSDOM } = require('/home/user/core-r8/node_modules/jsdom');
const core = require('/home/user/core-r8/src/core.js');
const { occurrenceOutcome } = require('/home/user/core-r8/src/occurrence-outcome.js');

function open(html, url = 'https://example.test/') {
  const dom = new JSDOM(html, { url, contentType: 'text/html', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  return dom;
}

function scanJsdom(html, engineOptions = {}, runOnly = null, dom) {
  dom = dom || open(html);
  global.window = dom.window;
  global.document = dom.window.document;
  const r = core.runDomRulesInPage(dom.window.location.href, null, engineOptions, runOnly);
  return { r, dom };
}

// Serialise the whole tree including open shadow roots.
function snapshot(doc) {
  const out = [];
  function walk(n, depth) {
    // iterative to cope with deep nesting
    const stack = [[n, 0]];
    while (stack.length) {
      const [node] = stack.pop();
      if (node.nodeType === 1) {
        let s = '<' + node.localName;
        for (const a of Array.from(node.attributes)) s += ' ' + a.name + '="' + a.value + '"';
        if (node.value !== undefined && typeof node.value === 'string') s += ' [value=' + node.value + ']';
        if (node.checked !== undefined) s += ' [checked=' + node.checked + ']';
        out.push(s + '>');
        const kids = [];
        if (node.shadowRoot) kids.push(node.shadowRoot);
        if (node.localName === 'template' && node.content) kids.push(node.content);
        for (const c of Array.from(node.childNodes)) kids.push(c);
        for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i]]);
      } else if (node.nodeType === 3 || node.nodeType === 8) {
        out.push(node.nodeType + ':' + node.data);
      } else if (node.nodeType === 11 || node.nodeType === 9) {
        out.push('#frag');
        const kids = Array.from(node.childNodes);
        for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i]]);
      }
    }
  }
  walk(doc);
  let sheets = '';
  try {
    for (const sh of Array.from(doc.styleSheets)) {
      try { sheets += Array.from(sh.cssRules).map((r) => r.cssText).join('\n'); } catch { sheets += '[x]'; }
    }
  } catch {}
  return out.join('\n') + '\n--sheets--\n' + sheets + '\n--active--' + (doc.activeElement && doc.activeElement.outerHTML.slice(0, 80));
}

// Projection of a result that should be deterministic.
function project(r, { withText = true } = {}) {
  return (r.checksResults || []).map((c) => ({
    ruleId: c.ruleId,
    outcome: c.outcome,
    error: c.error || null,
    occ: c.occurrences.map((o) => [o.selector, o.occurrenceOutcome || '', (o.data && o.data.details && o.data.details.reasonCode) || '', withText ? o.summary : '', (o.shadowHostSelectors || []).join('>')])
  }));
}

function checkInvariants(r, label) {
  const problems = [];
  try { JSON.parse(JSON.stringify(r)); } catch (e) { problems.push(`${label}: JSON ${e.message}`); }
  for (const c of r.checksResults || []) {
    const tiers = c.occurrences.map((o) => occurrenceOutcome(c, o));
    if (tiers.includes('fail') && c.outcome !== 'fail') problems.push(`${label}: ${c.ruleId} outcome ${c.outcome} with fail-tier occurrence`);
    if (c.outcome === 'fail' && c.occurrences.length && !tiers.includes('fail')) problems.push(`${label}: ${c.ruleId} fail with no fail-tier occurrence`);
    if (c.outcome === 'fail' && !c.occurrences.length) problems.push(`${label}: ${c.ruleId} fail with no occurrences`);
    if (c.outcome === 'notApplicable' && c.occurrences.length) problems.push(`${label}: ${c.ruleId} notApplicable with ${c.occurrences.length} occurrences`);
    if (c.type === 'manual' && c.outcome === 'fail') problems.push(`${label}: manual ${c.ruleId} fail`);
    if (c.error) problems.push(`${label}: ${c.ruleId} error: ${String(c.error).slice(0, 200)}`);
    for (const o of c.occurrences) {
      const texts = [o.summary, o.hint, o.lean && o.lean.why, o.lean && o.lean.caution, o.howToCheck && o.howToCheck.passWhen, o.howToCheck && o.howToCheck.failWhen, ...(o.howToCheck ? o.howToCheck.steps : [])];
      for (const t of texts) {
        if (typeof t === 'string' && /\{\{[^}]*\}\}/.test(t)) problems.push(`${label}: ${c.ruleId} placeholder in "${t.slice(0, 160)}"`);
        if (typeof t === 'string' && (/\[object Object\]/.test(t) || (/\bundefined\b|\bNaN\b/.test(t) && !/\bundefined\b|\bNaN\b/.test(o.html || '') && !/takes|nimmt|admite|prend|指定/.test(t)))) problems.push(`${label}: ${c.ruleId} suspicious text "${t.slice(0, 160)}"`);
      }
      if (o.uncertainty && tierOfOcc(c, o) === 'fail') problems.push(`${label}: ${c.ruleId} fail-tier occurrence with uncertainty`);
      if (typeof o.summary !== 'string' || !o.summary) problems.push(`${label}: ${c.ruleId} empty summary`);
    }
  }
  return problems;
  function tierOfOcc(c, o) { return occurrenceOutcome(c, o); }
}

function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

module.exports = { open, scanJsdom, snapshot, project, checkInvariants, median, core, JSDOM, occurrenceOutcome };
