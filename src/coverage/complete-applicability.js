/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The WCAG criteria whose rules find every case the criterion is about, so
 * that when all of them are notApplicable, the page has nothing the
 * criterion applies to.
 *
 * A WCAG rollup is notApplicable only for these. For any other criterion,
 * rules that all found nothing say only that the cases they look for are not
 * on the page: a script that redirects after a delay is a time limit (2.2.1)
 * with no <meta http-equiv="refresh">, and a passage in another language
 * (3.1.2) need not carry a lang attribute. Such a rollup is cantTell, with
 * the reason code composite.rollup.cantTell.partialCoverage
 * (docs/WCAG_CONFORMANCE.md). In WCAG-EM's terms, "not present" needs every
 * place the content could be to have been looked at.
 *
 * A criterion is listed when what it applies to is a kind of element core
 * finds by its markup and roles, wherever it is: links, focusable elements,
 * labelled components, and ids. Each entry says why. Add one only with that
 * reason.
 *
 * Not listed, though they look alike: 1.3.5 (autocomplete-valid sees only
 * fields with an autocomplete attribute, and which fields collect
 * information about the user is not in the markup), 3.3.2 (the label rules
 * don't see a field made from an ARIA role) and 2.5.8 (target-size-minimum
 * leaves out an element that is a target only through a script).
 */
const COMPLETE_APPLICABILITY = {
  '2.4.3': 'Focusable elements: a page without any has no focus order.',
  '2.4.4': 'Links: <a href>, <area href> and role="link".',
  '2.4.7': 'Focusable elements, as for 2.4.3.',
  '2.4.9': 'Links, as for 2.4.4.',
  '2.5.3': 'Components with a visible text label: controls and links.',
  '4.1.1': 'Markup: ids and elements, all of which the rules read.'
};

/**
 * The WCAG criteria whose rules check all the criterion asks, so that when
 * none of them fails or asks, the criterion is met.
 *
 * A WCAG rollup passes only for these. For any other criterion, rules that
 * all passed say only that the parts they check are met: lang-valid finds
 * that <html lang="fr"> names a language, not that the page is in French
 * (3.1.1), and page-title-present that the page has a title, not that it
 * describes the page (2.4.2). Such a rollup is cantTell, with the reason code
 * composite.rollup.cantTell.partialCheck (docs/WCAG_CONFORMANCE.md): a
 * person checks the rest. WCAG has a criterion satisfied only when all of it
 * is.
 *
 * None is listed yet. Each criterion core's rules check asks something they
 * can't see: whether a text alternative, a label, a heading or a link's text
 * says the right thing, or where content a script draws or changes, in a way
 * the markup doesn't show, meets it. Add one only with the reason all of it is
 * checked, as above.
 */
const COMPLETE_CHECK = {};

module.exports = { COMPLETE_APPLICABILITY, COMPLETE_CHECK };
