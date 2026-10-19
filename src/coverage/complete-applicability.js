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
 * finds by its markup and roles, wherever it is: links, form fields,
 * focusable elements, labelled components, pointer targets, and ids. Each
 * entry says why. Add one only with that reason.
 */
const COMPLETE_APPLICABILITY = {
  '1.3.5': 'Form fields that collect information about the user: <input>, <select>, <textarea> and their roles.',
  '2.4.3': 'Focusable elements: a page without any has no focus order.',
  '2.4.4': 'Links: <a href>, <area href> and role="link".',
  '2.4.7': 'Focusable elements, as for 2.4.3.',
  '2.4.9': 'Links, as for 2.4.4.',
  '2.5.3': 'Components with a visible text label: controls and links.',
  '2.5.8': 'Pointer targets: the interactive elements a pointer can activate.',
  '3.3.2': 'Form fields that take input.',
  '4.1.1': 'Markup: ids and elements, all of which the rules read.'
};

module.exports = { COMPLETE_APPLICABILITY };
