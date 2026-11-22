/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-group-name-present
 * @atomic true
 * @summary Radio buttons and checkboxes that share a name should be in a group with a name
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Groups of two or more radio buttons, or of two or more checkboxes, that
 *   share a non-empty `name` (compared as written) in the same form owner
 *   (the same `<form>`, or none, in the same document or shadow root), each
 *   in the accessibility tree. A single checkbox, or one radio button alone
 *   with its name, is no group.
 * @expectation
 *   The options are in a group whose name says what they are for: an
 *   element that contains them all and is a `<fieldset>` named by its
 *   `<legend>` (or by aria-label, aria-labelledby or title), or an element
 *   with `role="radiogroup"` or `role="group"` and an accessible name. Then
 *   pass. Otherwise the question they answer may be shown only as text
 *   above them, tied to none of them, and is asked about (cantTell): each
 *   option's own label may still say all a person needs, which only a
 *   person can tell. Radio buttons sharing a name are one control a person
 *   picks from, so they lean fail; checkboxes sharing a name may be fields
 *   a script names alike, so they have no lean. Radio buttons that are
 *   each in a named group, but not all in one, are asked about with no
 *   lean: they may be one choice split over two groups, or two choices
 *   given the same name by mistake. If some of them are in no named group,
 *   they are asked about as options in no named group, pointing at the
 *   first of those. Checkboxes in different named groups are asked about
 *   as checkboxes in no named group.
 * @reports
 *   - `name`: the `name` the options share, up to 60 characters.
 *   - `count`: how many options share it.
 *   - `inputType`: `radio` or `checkbox`.
 *   - `groups` (`RADIO_GROUP_SPLIT` only): the names of the groups the
 *     radio buttons sit in, in document order, each up to 40 characters.
 * @reason-codes
 *   - `RADIO_GROUP_NO_NAME` (cantTell): radio buttons that share a name sit
 *     in no fieldset with a legend and no group or radiogroup with a name.
 *     It leans fail: a set of radio buttons is one choice, and nothing names
 *     what it is a choice of.
 *     Basis: WCAG 1.3.1 (not settled); H71; ARIA17.
 *   - `RADIO_GROUP_SPLIT` (cantTell): radio buttons that share a name are
 *     each in a named group, but the groups differ, so the browser's one
 *     choice is split over them. No lean: they may be one choice that
 *     belongs in one group, or separate choices that need their own names.
 *     Basis: WCAG 1.3.1 (not settled); H71; ARIA17.
 *   - `CHECKBOX_GROUP_NO_NAME` (cantTell): checkboxes that share a name sit
 *     in no fieldset with a legend and no group with a name; whether they
 *     answer one question that needs a name is for a person to judge.
 *     Basis: WCAG 1.3.1 (not settled); H71; ARIA17.
 * @implementation-notes
 * - The group is found from the options' shared name, as a browser groups
 *   radio buttons: options of one question without a shared name are not
 *   seen. Options split between named groups are seen only through their
 *   shared name; each one's group is the innermost named group around it.
 * - The name of a group comes from the accessible name helper, with a
 *   fieldset's first <legend> as a fallback, named from its content as
 *   accname does (an <img alt> in it counts); a hidden legend names nothing.
 * - A group contains the options in the flat tree, as the accessibility
 *   tree nests them: options slotted into a shadow <fieldset>, or in a
 *   shadow root inside a light one, are in that fieldset. Options the flat
 *   tree leaves out (a light child no slot takes, a slot's fallback while
 *   nodes are assigned to it) are not drawn and not counted. What a closed
 *   shadow root takes can't be read.
 */

const id = 'form-group-name-present';

const meta = {
  title: 'Radio buttons and checkboxes that share a name should be in a named group',
  description:
    'Asks about radio buttons, or checkboxes, that share a name but sit in no <fieldset> with a <legend> and no group or radiogroup with an accessible name, so the question they answer may be tied to none of them.',
  i18n: {
    titleKey: 'formGroupNamePresent_title',
    descriptionKey: 'formGroupNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'forms', 'atomic', 'manual'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '1.3.1': ['form-group-name-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function tagOf(el) {
    return String(dom.localName(el) || '').toLowerCase();
  }

  // In the accessibility tree: an option under aria-hidden is left out,
  // focusable or not (helpers.isIncludedInAccessibilityTree).
  function isEligible(node) {
    try {
      if (typeof helpers.isIncludedInAccessibilityTree === 'function')
        return !!helpers.isIncludedInAccessibilityTree(node, ctx);
      if (typeof helpers.isAccTreeEligible !== 'function') return true;
      const r = helpers.isAccTreeEligible(node, ctx);
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // Whether el is left out of the flat tree, and so not drawn: a light
  // child of a shadow host that no slot takes, or inside a slot's
  // fallback content while nodes are assigned to that slot. A closed
  // shadow root can't be read, so what it takes is not known.
  function notDrawn(el) {
    let n = el;
    for (let i = 0; n && i < 10000; i++) {
      const p = dom.parentNode(n);
      if (!p) return false;
      if (dom.nodeType(p) === 11) {
        n = dom.host(p);
        continue;
      }
      if (dom.nodeType(p) !== 1) return false;
      try {
        if (dom.shadowRoot(p) && !dom.assignedSlot(n)) return true;
        if (tagOf(p) === 'slot' && dom.assignedNodes(p).length) return true;
      } catch {}
      n = p;
    }
    return false;
  }

  // The document or shadow root el is in.
  function rootOf(el) {
    let n = el;
    for (let i = 0; n && i < 10000; i++) {
      const p = dom.parentNode(n);
      if (!p) return n;
      n = p;
    }
    return n;
  }

  // The name of an element that groups options: a fieldset (its role left
  // as group) or an element with role group or radiogroup, named by its
  // legend, aria-label, aria-labelledby or title. '' when it is no such
  // element or has no name.
  function groupName(el) {
    const role = helpers.aria && helpers.aria.getExplicitRole(el);
    const tag = tagOf(el);
    const groupRole = role === 'group' || role === 'radiogroup';
    if (!groupRole && !(tag === 'fieldset' && !role)) return '';
    try {
      if (typeof helpers.getAccessibleNameInfo === 'function') {
        const info = helpers.getAccessibleNameInfo(el, ctx, { maxRefs: 8 });
        if (info && info.present && trim(info.value)) return trim(info.value);
      }
    } catch {}
    const attr = trim(dom.getAttribute(el, 'aria-label')) || trim(dom.getAttribute(el, 'title'));
    if (attr) return attr;
    if (tag === 'fieldset') {
      for (let c = dom.firstElementChild(el); c; c = dom.nextElementSibling(c)) {
        if (tagOf(c) !== 'legend') continue;
        // A legend out of the accessibility tree (hidden) names nothing.
        if (!isEligible(c)) return '';
        // The legend's name from its content, as accname computes it: an
        // <img alt> inside it names the group too.
        if (typeof helpers.getNameFromContentInfo === 'function') {
          try {
            const info = helpers.getNameFromContentInfo(c, ctx);
            return info && info.present ? trim(info.value) : '';
          } catch {}
        }
        return trim(dom.textContent(c));
      }
    }
    return '';
  }

  // The element's ancestors in the flat tree: across a slot into the
  // shadow tree it is drawn in, and out of a shadow root to its host, as
  // the accessibility tree nests them.
  function flatAncestors(el) {
    const out = new Set();
    for (
      let a = helpers.flatParentElement(el), i = 0;
      a && i < 200;
      a = helpers.flatParentElement(a), i++
    ) {
      out.add(a);
    }
    return out;
  }

  // Whether an element that contains every option, in the flat tree, is a
  // named group.
  function inNamedGroup(members) {
    const rest = members.slice(1).map(flatAncestors);
    for (const a of flatAncestors(members[0])) {
      if (!rest.every((s) => s.has(a))) continue;
      if (groupName(a)) return true;
    }
    return false;
  }

  // The innermost named group an option is in, in the flat tree, or null.
  function nearestNamedGroup(el) {
    for (
      let a = helpers.flatParentElement(el), i = 0;
      a && i < 200;
      a = helpers.flatParentElement(a), i++
    ) {
      const name = groupName(a);
      if (name) return { el: a, name };
    }
    return null;
  }

  function shorten(v, max) {
    const t = trim(v).replace(/\s+/g, ' ');
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
  }

  const inputs = helpers.queryAllSmart
    ? helpers.queryAllSmart('input[type="radio" i], input[type="checkbox" i]')
    : helpers.queryAll('input[type="radio" i], input[type="checkbox" i]');

  // Options grouped by type, form owner and name, in document order.
  const groups = new Map();
  for (const el of inputs) {
    if (!el) continue;
    const type = trim(dom.getAttribute(el, 'type')).toLowerCase();
    const name = dom.getAttribute(el, 'name');
    if (!name || !trim(name)) continue;
    if (!isEligible(el) || notDrawn(el)) continue;
    const owner = dom.get(el, 'form') || rootOf(el);
    let byOwner = groups.get(owner);
    if (!byOwner) {
      byOwner = new Map();
      groups.set(owner, byOwner);
    }
    const key = type + '\u0000' + name;
    if (!byOwner.has(key)) byOwner.set(key, { type, name, members: [] });
    byOwner.get(key).members.push(el);
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const byOwner of groups.values()) {
    for (const group of byOwner.values()) {
      if (group.members.length < 2) continue;
      applicableCount += 1;
      if (inNamedGroup(group.members)) continue;

      const radio = group.type === 'radio';
      const count = group.members.length;
      const shownName = group.name.length > 60 ? `${group.name.slice(0, 59)}…` : group.name;

      // Radio buttons each in a named group, but not all in the same one:
      // one choice split over groups, or two choices sharing a name by
      // mistake. Checkboxes are left as they were: fields a script names
      // alike often sit in different groups on purpose.
      let anchor = group.members[0];
      let some = false;
      if (radio) {
        const found = group.members.map(nearestNamedGroup);
        const unnamed = group.members.filter((_, i) => !found[i]);
        if (!unnamed.length) {
          const seen = new Set();
          const names = [];
          for (const g of found) {
            if (seen.has(g.el)) continue;
            seen.add(g.el);
            names.push(shorten(g.name, 40));
          }
          const shownGroups = names.length > 5 ? [...names.slice(0, 5), '…'] : names;
          const groupsText = shownGroups.join(', ');
          const splitOcc = {
            summary: `These ${count} radio buttons named “${shownName}” share a name, so a browser makes them one choice, but sit in different groups with names (${groupsText}).`,
            hint: 'Check whether they are options of one choice. If they are, put them in one group whose name says what is chosen; if they are separate choices, give each its own name.',
            i18n: {
              summaryKey: 'formGroupNamePresent_summary_cantTell_radio_split',
              hintKey: 'formGroupNamePresent_hint_cantTell_radio_split',
              params: { name: shownName, count, groups: groupsText }
            },
            data: {
              details: {
                reasonCode: 'RADIO_GROUP_SPLIT',
                name: shownName,
                count,
                inputType: group.type,
                groups: names
              }
            }
          };
          occurrences.push(
            typeof helpers.reportOccurrence === 'function'
              ? helpers.reportOccurrence(anchor, splitOcc)
              : splitOcc
          );
          continue;
        }
        // Some options in a named group and some in none: asked about as
        // options in no named group, pointing at the first of those.
        if (unnamed.length < count) {
          anchor = unnamed[0];
          some = true;
        }
      }

      const occ = {
        summary: some
          ? `Some of these ${count} radio buttons named “${shownName}” are in no group with a name (no <fieldset> with a <legend>, and no element with role="radiogroup" or role="group" and an accessible name); the others are in one.`
          : radio
            ? `These ${count} radio buttons named “${shownName}” are in no group with a name: no <fieldset> with a <legend>, and no element with role="radiogroup" or role="group" and an accessible name.`
            : `These ${count} checkboxes named “${shownName}” are in no group with a name: no <fieldset> with a <legend>, and no element with role="group" and an accessible name.`,
        hint: 'If the options answer one question, put them in a <fieldset> whose <legend> says it, or in an element with role="radiogroup" (role="group" for checkboxes) named with aria-labelledby pointing to the question.',
        i18n: {
          summaryKey: some
            ? 'formGroupNamePresent_summary_cantTell_radio_some'
            : radio
              ? 'formGroupNamePresent_summary_cantTell_radio'
              : 'formGroupNamePresent_summary_cantTell_checkbox',
          hintKey: 'formGroupNamePresent_hint_cantTell',
          params: { name: shownName, count }
        },
        ...(radio
          ? {
              lean: {
                toward: 'fail',
                why: 'Radio buttons that share a name are one choice a person makes, and nothing gives that choice a name.',
                signals: [
                  { signal: 'shared-name', value: true },
                  { signal: 'named-group', value: false },
                  { signal: 'options', value: count }
                ],
                caution: 'Each option’s own label may say the whole question.',
                i18n: {
                  whyKey: 'formGroupNamePresent_lean_why_radio',
                  cautionKey: 'formGroupNamePresent_lean_caution_radio'
                }
              }
            }
          : {}),
        data: {
          details: {
            reasonCode: radio ? 'RADIO_GROUP_NO_NAME' : 'CHECKBOX_GROUP_NO_NAME',
            name: shownName,
            count,
            inputType: group.type
          }
        }
      };
      occurrences.push(
        typeof helpers.reportOccurrence === 'function' ? helpers.reportOccurrence(anchor, occ) : occ
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
