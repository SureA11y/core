/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-name-quality-link-only
 * @atomic true
 * @summary A link's text should say where it leads without the text around it
 * @standard WCAG 2.2
 * @sc 2.4.9
 * @applicability
 *   The links link-name-quality applies to: `a[href]`, `area[href]` and
 *   elements whose role resolves to link, with a non-empty accessible name,
 *   whose whole name is a known generic phrase ("click here", "read more",
 *   "more", in English and, for a link in that language, German, Spanish,
 *   French or Japanese) and whose list item, paragraph, cell or description
 *   says where it leads.
 * @expectation
 *   2.4.9 asks that a link's purpose be identified from the link text
 *   alone. A generic phrase that only its surrounding text explains meets
 *   2.4.4, which counts that context, but not 2.4.9 (F84), unless the page
 *   offers a mechanism that makes such links descriptive, which a scan
 *   cannot see. Each such link is asked about.
 *   It is link-name-quality run with `whenContextFound: 'ask'` (a variant
 *   of it), so its phrase lists and its reading of context are that rule's. A generic link with no context is
 *   link-name-quality's own finding, which counts toward 2.4.9 already, so
 *   no link is reported by both. A bare format name ("PDF") is left to
 *   link-name-quality too: F84 is about generic phrases.
 * @reports
 *   - As link-name-quality's: `normalizedName`, the name as it was matched,
 *     and `linkKind`.
 * @reason-codes
 *   - `GENERIC_LINK_TEXT_IN_CONTEXT` (cantTell): the link's whole name is a
 *     generic phrase, and only the context found around it says where it
 *     leads; a person checks whether the page offers a way to make the link
 *     descriptive on its own.
 *     Basis: WCAG 2.4.9 (not settled); F84.
 */

module.exports = {
  id: 'link-name-quality-link-only',
  from: 'link-name-quality',
  config: { whenContextFound: 'ask' },
  meta: {
    title: "A link's text should say where it leads on its own",
    description:
      'Flags links whose full accessible name is a known generic phrase (e.g. "click here", "read more") that only the text around them explains, for manual review of whether the link text alone makes the purpose clear.',
    i18n: {
      titleKey: 'linkNameQualityLinkOnly_title',
      descriptionKey: 'linkNameQualityLinkOnly_description'
    },
    helpUrl: null,
    tags: ['wcag2aaa', 'wcag249', 'navigation', 'quality', 'atomic', 'manual'],
    wcagSc: ['2.4.9'],
    normativeMappings: [
      {
        standard: 'WCAG',
        version: '2.2',
        requirement: '2.4.9',
        title: 'Link Purpose (Link Only)',
        conformanceLevel: 'AAA'
      }
    ],
    defaultSeverity: 'minor',
    category: 'operable',
    type: 'manual',
    defaultConfidence: 'medium',
    coverage: {
      facetsBySc: {
        '2.4.9': ['link-text-alone-clear']
      }
    },
    reasonCodes: ['GENERIC_LINK_TEXT_IN_CONTEXT']
  }
};
