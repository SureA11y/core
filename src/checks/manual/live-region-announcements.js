/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check live-region-announcements
 * @atomic true
 * @summary Live regions should be able to announce status messages
 * @standard WCAG 2.2
 * @sc 4.1.3
 * @applicability
 *   Live regions the page draws: elements whose aria-live is polite or
 *   assertive, or, without an aria-live, whose role is status, log or
 *   alert, and <output> elements. aria-live="off" turns any of them off. A
 *   live region hidden with display: none, visibility: hidden or [hidden]
 *   is left out: a region waiting to be shown is the page at rest. A live
 *   region behind an open modal <dialog>, which the browser makes inert,
 *   is included, though other rules leave that content out. With
 *   the live-region hook (liveRegionHookScript), also the live regions it
 *   saw given their text in a way that is commonly not announced, whether
 *   or not they are still on the page.
 * @expectation
 *   WCAG 4.1.3: a status message can be presented to the user by
 *   assistive technology without receiving focus, which a live region does
 *   when its content changes while assistive technology can reach it.
 *   - A drawn live region inside, or on, aria-hidden="true" or inert, or
 *     behind an open modal <dialog>: cantTell (`LIVE_REGION_HIDDEN`). It is
 *     out of the accessibility tree, so nothing it is given can be
 *     announced (behind the dialog, while the dialog is open).
 *   - A live region with aria-busy="true" when the page was scanned:
 *     cantTell (`LIVE_REGION_BUSY`). Assistive technology may hold back its
 *     changes until aria-busy is cleared.
 *   - Recorded by the hook, a live region added to the page with its text
 *     already in it, other than role="alert": cantTell
 *     (`LIVE_REGION_INSERTED_WITH_CONTENT`). Screen readers commonly
 *     announce changes to a region they already know, not a new region's
 *     content.
 *   - Recorded by the hook, a live region that was hidden and was shown and
 *     given its text in the same task: cantTell
 *     (`LIVE_REGION_SHOWN_AND_FILLED`). It was not in the accessibility
 *     tree when the text arrived.
 *   - Otherwise: pass.
 *
 *   Check whether the page uses the region for status messages, and that
 *   it is in the page, shown and reachable, before its text changes.
 * @reports
 *   - `politeness`: the region's, `polite` or `assertive`.
 *   - `hiddenBy`: for `LIVE_REGION_HIDDEN`, `aria-hidden`, `inert`, or
 *     `modal` for a region behind an open modal <dialog>. A region behind
 *     the dialog is `modal` whatever else hides it (inert or aria-hidden on
 *     it or above it, with or without includeHiddenElements): while the
 *     dialog is open, it is the cause in effect.
 *   - `text`: for the hook's two findings, the text the region was given
 *     (up to 300 characters).
 *   - `removed`: for the hook's two findings, true when the region was no
 *     longer on the page when it was scanned; the occurrence is then on the
 *     document element, and `region` describes it (`tag`, `role`, `id`).
 * @reason-codes
 *   - `LIVE_REGION_HIDDEN` (cantTell): a live region inside or on
 *     aria-hidden="true" or inert, or behind an open modal <dialog>, so
 *     nothing it is given (while the dialog is open) can be announced.
 *     It leans fail, for aria-hidden or inert, when no dialog is shown, which
 *     would explain the rest of the page being hidden; behind a modal
 *     dialog, when the live-region hook saw the region given text after the
 *     dialog was last opened, so while the dialog made it inert (a dialog
 *     the hook never saw open has been open since it started watching; one
 *     inside a shadow root gives no lean, as the hook does not see it).
 *     Basis: WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-hidden; WAI-ARIA 1.2
 *     aria-live; HTML dialog element showModal method.
 *   - `LIVE_REGION_BUSY` (cantTell): a live region with aria-busy="true" when
 *     the page was scanned, so assistive technology may hold back its changes.
 *     Basis: WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-busy.
 *   - `LIVE_REGION_INSERTED_WITH_CONTENT` (cantTell): a live region, other than
 *     role="alert", added to the page with its text already in it, which screen
 *     readers commonly do not announce.
 *     It leans fail unless the hook saw the same text announced through
 *     another live region.
 *     Basis: WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-live.
 *   - `LIVE_REGION_SHOWN_AND_FILLED` (cantTell): a hidden live region shown and
 *     given its text in the same task, so it was not in the accessibility tree
 *     when the text arrived.
 *     It leans fail unless the hook saw the same text announced through
 *     another live region.
 *     Basis: WCAG 4.1.3 (not settled); WAI-ARIA 1.2 aria-live.
 * @implementation-notes
 * - Manual: whether a live region carries status messages, and whether a
 *   screen reader announces it, is a person's call; screen readers differ
 *   on regions added with their content.
 * - Says what the page made available to announce, never what was spoken.
 * - The hook's findings come from getLiveRegionRecord(); without the hook
 *   the rule judges the page as it is when scanned.
 * - The hook's findings for a region still on the page are reported only
 *   when it is in the scanned part of the page, and not behind an open
 *   modal <dialog>; one no longer on the page only when the whole document
 *   is scanned.
 * - For a region behind an open modal <dialog>, the hook's other findings
 *   (LIVE_REGION_INSERTED_WITH_CONTENT, LIVE_REGION_SHOWN_AND_FILLED) are
 *   not reported: LIVE_REGION_HIDDEN with hiddenBy 'modal' already covers
 *   that region.
 */

const id = 'live-region-announcements';

const meta = {
  title: 'Live regions should be able to announce status messages',
  description:
    'Flags a live region hidden from assistive technology or left busy, and, with the live-region hook, one added with its text or shown and filled at once, for manual review.',
  i18n: {
    titleKey: 'liveRegionAnnouncements_title',
    descriptionKey: 'liveRegionAnnouncements_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag413', 'aria', 'structure', 'atomic', 'manual'],
  wcagSc: ['4.1.3'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.3',
      title: 'Status Messages',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  // The hook's two codes come from its record, not from a literal here.
  reasonCodes: [
    'LIVE_REGION_HIDDEN',
    'LIVE_REGION_BUSY',
    'LIVE_REGION_INSERTED_WITH_CONTENT',
    'LIVE_REGION_SHOWN_AND_FILLED'
  ],
  coverage: {
    facetsBySc: { '4.1.3': ['live-region-reachable-evidence', 'live-region-changes-evidence'] }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ROLES = { status: 'polite', log: 'polite', alert: 'assertive' };
  // The codes the live-region hook records.
  const HOOK_CODES = new Set(['LIVE_REGION_INSERTED_WITH_CONTENT', 'LIVE_REGION_SHOWN_AND_FILLED']);

  function attr(el, name) {
    const v = dom.getAttribute(el, name);
    return v == null ? '' : String(v).trim().toLowerCase();
  }
  // The politeness of a live region, as the live-region hook reads it, or ''.
  function politeness(el) {
    const live = attr(el, 'aria-live');
    if (live === 'polite' || live === 'assertive') return live;
    if (live === 'off') return '';
    // The role attribute's first concrete token, in any case.
    const role = helpers.aria.getExplicitRole(el);
    if (role && Object.prototype.hasOwnProperty.call(ROLES, role)) return ROLES[role];
    if (!role && String(dom.localName(el) || '').toLowerCase() === 'output') return 'polite';
    return '';
  }
  // Whether display: none, [hidden] or visibility: hidden keeps the region
  // from being drawn, on it or above it.
  function drawn(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = helpers.composedParent(n)) {
      if (dom.hasAttribute(n, 'hidden')) return false;
      const cs = helpers.computedStyle(n);
      if (cs && cs.display === 'none') return false;
    }
    const cs = helpers.computedStyle(el);
    return !(cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse'));
  }
  // What keeps a drawn region from assistive technology: 'aria-hidden',
  // 'inert', or ''.
  function hiddenBy(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = helpers.composedParent(n)) {
      if (attr(n, 'aria-hidden') === 'true') return 'aria-hidden';
      if (dom.hasAttribute(n, 'inert')) return 'inert';
    }
    return '';
  }
  function eligibility(el) {
    try {
      return helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {
      return { targetSet: 'acc', accEligible: null, reasons: [] };
    }
  }

  // A hidden live region with no dialog open: nothing explains the page
  // hiding it (the background of an open modal is the usual reason, and a
  // script-made modal hides it with aria-hidden or inert itself), so what it
  // is given is not announced. isModalDialogOpen() counts a modal <dialog>
  // and a shown role="dialog" with aria-modal="true"; dialogShown() also
  // counts a dialog shown without either, which may hide the page all the
  // same.
  let modalOpen = null;
  // In the document and its open shadow roots.
  function dialogShown() {
    let roots;
    try {
      roots = helpers.getDocumentRoots();
    } catch {
      roots = [document];
    }
    for (const root of roots) {
      for (const d of dom.querySelectorAll(
        root,
        'dialog[open], [role~="dialog" i], [role~="alertdialog" i]'
      )) {
        if (drawn(d) && !hiddenBy(d)) return true;
      }
    }
    return false;
  }
  function hiddenLean() {
    if (modalOpen === null) {
      try {
        modalOpen = !!helpers.isModalDialogOpen() || dialogShown();
      } catch {
        modalOpen = true;
      }
    }
    if (modalOpen) return null;
    return {
      toward: 'fail',
      why: 'No dialog is open to explain hiding this live region, so what it is given is not announced.',
      signals: [{ signal: 'dialog-open', value: false }],
      caution:
        'The region may be unused, or the page may show it to assistive technology before writing to it.',
      i18n: {
        whyKey: 'liveRegionAnnouncements_lean_why_hidden',
        cautionKey: 'liveRegionAnnouncements_lean_caution_hidden'
      }
    };
  }

  // What the live-region hook saw while the page ran.
  const record =
    typeof helpers.getLiveRegionRecord === 'function' ? helpers.getLiveRegionRecord() : null;

  // A live region behind an open modal <dialog>: the browser makes the page
  // behind it inert, so queryAllSmart leaves it out, as it does all content
  // there. It is asked about all the same: what the page writes to it while
  // the dialog is open is not announced. Only a modal <dialog> makes the page
  // inert (`modalInert`). A region is behind the open modal dialogs when it
  // is in none of them and contains none, by the flat tree, as the browser
  // decides it, whatever else hides it: while the dialog is open, the dialog
  // is the cause in effect, so such a region is reported with hiddenBy
  // 'modal' even under inert or aria-hidden, with or without
  // includeHiddenElements.
  function insideOf(box, el) {
    for (let n = el, guard = 0; n && guard < 500; n = helpers.composedParent(n), guard++) {
      if (n === box) return true;
    }
    return false;
  }
  let openModals = null;
  function behindModal(el) {
    if (openModals === null) {
      try {
        openModals = helpers.getOpenModalDialogs() || [];
      } catch {
        openModals = [];
      }
    }
    if (!openModals.length) return false;
    return !openModals.some((d) => insideOf(d, el) || insideOf(el, d));
  }
  // The hook records the last time each <dialog> in the document was opened
  // (record.dialogsOpened), and the order in which the page made each change
  // (`order`). A region behind the open modal dialogs is inert since the
  // first of those that leaves it out was opened: one with no such entry has
  // been open since the hook started watching, as its opening would
  // otherwise be recorded. A modal inside a shadow root, whose changes the
  // hook does not see, says nothing. Text the region was given after that
  // was given while it was inert.
  function modalLean(el) {
    if (!record || !Array.isArray(record.dialogsOpened)) return null;
    let modals;
    try {
      modals = helpers.getOpenModalDialogs();
    } catch {
      return null;
    }
    const complete = !(record.dropped && record.dropped.dialogsOpened > 0);
    let since = Infinity;
    for (const d of modals) {
      if (insideOf(d, el)) continue;
      let last = null;
      for (const e of record.dialogsOpened) {
        if (e.element === d && (!last || e.order > last.order)) last = e;
      }
      if (last) since = Math.min(since, last.order);
      else if (complete && dom.getRootNode(d) === document) since = -Infinity;
    }
    if (since === Infinity) return null;
    const given = []
      .concat(Array.isArray(record.announcements) ? record.announcements : [])
      .concat(Array.isArray(record.findings) ? record.findings : [])
      .some((e) => e && e.element === el && typeof e.order === 'number' && e.order > since);
    if (!given) return null;
    return {
      toward: 'fail',
      why: 'The live-region hook saw this region given text after the modal dialog in front of it was opened, while the dialog made it inert, so the text was not announced.',
      signals: [
        { signal: 'hidden-by', value: 'modal' },
        { signal: 'text-given-after-dialog-opened', value: true }
      ],
      caution:
        'Whether that text was a status message the user needed is a person’s call: the page may give its messages to a live region inside the dialog as well.',
      i18n: {
        whyKey: 'liveRegionAnnouncements_lean_why_modal',
        cautionKey: 'liveRegionAnnouncements_lean_caution_modal'
      }
    };
  }

  const SUMMARY = {
    'aria-hidden': [
      'This live region is hidden with aria-hidden, so nothing it is given can be announced.',
      'liveRegionAnnouncements_summary_cantTell_ariaHidden'
    ],
    inert: [
      'This live region is inside inert content, so nothing it is given can be announced.',
      'liveRegionAnnouncements_summary_cantTell_inert'
    ],
    modal: [
      'This live region is behind an open modal dialog, which makes it inert, so nothing it is given while the dialog is open can be announced.',
      'liveRegionAnnouncements_summary_cantTell_modal'
    ]
  };

  const occurrences = [];
  const inScope = new Set();
  let applicableCount = 0;

  const SELECTOR = '[aria-live], [role], output';
  let candidates = helpers.queryAllSmart(SELECTOR, { inert: true });
  const kept = new Set(candidates);
  let dialogOpen;
  try {
    dialogOpen = !!helpers.isModalDialogOpen();
  } catch {
    dialogOpen = false;
  }
  if (dialogOpen) {
    candidates = helpers
      .queryAllSource(SELECTOR)
      .filter((el) => kept.has(el) || (politeness(el) && behindModal(el)));
  }

  for (const el of candidates) {
    const level = politeness(el);
    if (!level) continue;
    // A region behind the modal is not in scope for the hook's findings,
    // which leave out what the browser made inert.
    if (kept.has(el)) inScope.add(el);
    if (!drawn(el)) continue;
    applicableCount += 1;

    const by = dialogOpen && behindModal(el) ? 'modal' : hiddenBy(el);
    if (by) {
      const lean = by === 'modal' ? modalLean(el) : hiddenLean();
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: SUMMARY[by][0],
          hint:
            by === 'modal'
              ? 'Check whether the page writes status messages to it while the dialog is open; if so, put them in a live region inside the dialog.'
              : 'Check whether the page uses it for status messages; if so, keep it out of aria-hidden and inert content.',
          i18n: {
            summaryKey: SUMMARY[by][1],
            hintKey:
              by === 'modal'
                ? 'liveRegionAnnouncements_hint_cantTell_modal'
                : 'liveRegionAnnouncements_hint_cantTell_hidden'
          },
          ...(lean ? { lean } : {}),
          data: {
            details: { reasonCode: 'LIVE_REGION_HIDDEN', politeness: level, hiddenBy: by },
            visibilityFilter: eligibility(el)
          }
        })
      );
      continue;
    }

    if (attr(el, 'aria-busy') === 'true') {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'This live region was busy (aria-busy="true") when the page was scanned, so its changes may be held back.',
          hint: 'Check that aria-busy is set back to false once the region is updated.',
          i18n: {
            summaryKey: 'liveRegionAnnouncements_summary_cantTell_busy',
            hintKey: 'liveRegionAnnouncements_hint_cantTell_busy'
          },
          data: {
            details: { reasonCode: 'LIVE_REGION_BUSY', politeness: level },
            visibilityFilter: eligibility(el)
          }
        })
      );
    }
  }

  if (record && Array.isArray(record.findings)) {
    const whole = helpers.isWholeDocumentScope();
    const seen = new Map();
    for (const f of record.findings) {
      const el = f.element;
      if (!el || !HOOK_CODES.has(f.code)) continue;
      const connected = !!dom.get(el, 'isConnected');
      if (connected ? !inScope.has(el) : !whole) continue;
      // Once per region and reason code, and once per text for regions no
      // longer on the page (a toast shown and removed each time).
      const key = connected ? el : f.code + '\u0000' + f.text;
      const codes = seen.get(key) || new Set();
      if (codes.has(f.code)) continue;
      codes.add(f.code);
      seen.set(key, codes);
      applicableCount += 1;

      const inserted = f.code === 'LIVE_REGION_INSERTED_WITH_CONTENT';
      const level = politeness(el) || 'polite';
      const details = { reasonCode: f.code, politeness: level, text: f.text };
      if (!connected) {
        details.removed = true;
        details.region = {
          tag: String(dom.localName(el) || '').toLowerCase(),
          role: attr(el, 'role') || null,
          id: dom.getAttribute(el, 'id') || null
        };
      }
      const target = connected ? el : dom.documentElement(document);
      // The pattern the hook saw is one screen readers commonly skip; the
      // message still reached them when the same text was announced
      // through another region.
      // Not through one behind an open modal dialog: that was inert.
      const elsewhere = (record.announcements || []).some(
        (a) => a && a.element !== el && a.text === f.text && a.behindModal !== true
      );
      const lean = elsewhere
        ? null
        : {
            toward: 'fail',
            why: inserted
              ? 'The region was added with its text already in it, which screen readers commonly do not announce.'
              : 'The region was shown and given its text at once, before it was in the accessibility tree, which screen readers commonly do not announce.',
            signals: [
              { signal: 'hook-finding', value: f.code },
              { signal: 'politeness', value: level },
              { signal: 'text-also-in-existing-region', value: false }
            ],
            caution: inserted
              ? 'Some screen reader and browser pairs do announce a region added with its text.'
              : 'Some browsers update the accessibility tree in time for such a region to be announced.',
            i18n: inserted
              ? {
                  whyKey: 'liveRegionAnnouncements_lean_why_inserted',
                  cautionKey: 'liveRegionAnnouncements_lean_caution_inserted'
                }
              : {
                  whyKey: 'liveRegionAnnouncements_lean_why_shownAndFilled',
                  cautionKey: 'liveRegionAnnouncements_lean_caution_shownAndFilled'
                }
          };
      occurrences.push(
        helpers.reportOccurrence(target, {
          summary: inserted
            ? `A live region was added to the page with its text, "${f.text}", already in it; screen readers commonly announce only changes to a region already on the page.`
            : `A hidden live region was shown and given its text, "${f.text}", at once, before it was in the accessibility tree.`,
          hint: inserted
            ? 'Check that this status message is announced; put the empty region in the page first and change its text after.'
            : 'Check that this status message is announced; show the region first and change its text after.',
          i18n: {
            summaryKey: inserted
              ? 'liveRegionAnnouncements_summary_cantTell_inserted'
              : 'liveRegionAnnouncements_summary_cantTell_shownAndFilled',
            hintKey: inserted
              ? 'liveRegionAnnouncements_hint_cantTell_inserted'
              : 'liveRegionAnnouncements_hint_cantTell_shownAndFilled',
            params: { text: f.text }
          },
          ...(lean ? { lean } : {}),
          data: {
            details,
            visibilityFilter: connected
              ? eligibility(el)
              : { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        })
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
