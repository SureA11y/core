/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check letters-spaced-with-spaces
 * @atomic true
 * @summary Letters of a word should not be spaced out with space characters
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to text with four or more single letters in a row separated by
 *   spaces ("S O L D E S"), or three capital letters in a row when they are
 *   the whole text of the element ("T O P"). The text is the element's
 *   inline text: its own text nodes joined with the text of its inline
 *   children (span, b, a, ...), so letters split across spans
 *   ("<span>S</span> <span>O</span> ...") are read as one run. It is read
 *   outside <pre>, <code>, <textarea>, <script> and <style>. A page with
 *   none is notApplicable.
 * @expectation
 *   Such text is flagged for a person to confirm whether it is a word
 *   spaced out with spaces, which RGAA 10.1.3 forbids: a screen reader
 *   spells it letter by letter. CSS letter-spacing gives the same look.
 * @implementation-notes
 * - Manual (cantTell): a row of single letters can be a list of options or
 *   an example, not a word.
 * - One occurrence per element, naming the first such run. An inline
 *   element is read as part of its parent's text, and reported on its own
 *   only when its parent is not read (<body>, or outside the scanned
 *   scope).
 * - Three lower-case letters, or three capitals inside a longer text
 *   ("Vote for A B C"), are more often a list of options than a word, so
 *   they are left alone.
 * - Opt-in (tag `rgaa`).
 */

const id = 'letters-spaced-with-spaces';

const meta = {
  title: 'Letters of a word are not spaced out with spaces',
  description:
    'Flags text where four or more single letters in a row (three capitals when they are the whole text) are separated by spaces, for a person to confirm whether a word is spaced out that way.',
  i18n: {
    titleKey: 'lettersSpacedWithSpaces_title',
    descriptionKey: 'lettersSpacedWithSpaces_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'presentation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const SKIP = 'pre, code, kbd, samp, textarea, script, style, template';
  // Three or more single letters, each separated by spaces (including
  // no-break spaces). findRun decides which runs count.
  const SPACED = /(?:^|[\s\u00a0])(\p{L}(?:[ \u00a0]+\p{L}){2,})(?=$|[\s\u00a0.,;:!?])/gu;
  const INLINE = new Set([
    'a',
    'abbr',
    'b',
    'bdi',
    'bdo',
    'cite',
    'data',
    'dfn',
    'em',
    'font',
    'i',
    'ins',
    'del',
    'label',
    'mark',
    'q',
    's',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'time',
    'u',
    'var'
  ]);

  function isInline(el) {
    return INLINE.has(String(el.tagName || '').toLowerCase());
  }

  // The element's text nodes joined with the text of its inline children, in
  // order. Any other child (a block, <br>, <img>) separates the text.
  function inlineText(el, depth) {
    let out = '';
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeType === 1 && depth < 20 && isInline(n) && !n.matches(SKIP)) {
        out += inlineText(n, depth + 1);
      } else out += ' ';
    }
    return out;
  }

  // The first run that counts: four or more letters, or three capitals that
  // make up the whole text.
  function findRun(text) {
    const whole = text.replace(/[\s\u00a0]+/g, ' ').trim();
    for (const m of text.matchAll(SPACED)) {
      const run = m[1].replace(/[ \u00a0]+/g, ' ');
      const letters = run.split(' ');
      if (letters.length >= 4) return run;
      if (run === whole && letters.every((l) => /\p{Lu}/u.test(l))) return run;
    }
    return null;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('body *')
    : helpers.queryAll('body *');

  const occurrences = [];
  const inScope = new Set(nodes);

  for (const el of nodes) {
    if (!el || !el.childNodes || el.closest(SKIP)) continue;
    // An inline element is read with its parent's text, when the parent is
    // read at all.
    if (isInline(el) && inScope.has(el.parentElement)) continue;
    const text = findRun(inlineText(el, 0));
    if (!text) continue;
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `The text "${text}" has its letters separated by spaces.`,
        hint: 'If this is a word, write it without spaces and use the CSS letter-spacing property for the spaced-out look.',
        i18n: {
          summaryKey: 'lettersSpacedWithSpaces_summary_cantTell',
          hintKey: 'lettersSpacedWithSpaces_hint_cantTell',
          params: { text }
        },
        data: {
          details: { reasonCode: 'lettersSeparatedBySpaces', text },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
