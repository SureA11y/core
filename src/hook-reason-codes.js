/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The reason codes each opt-in hook decides or changes, so a binding can say
 * what installing one does without copying the codes out of the rules
 * (docs/BINDING_AUTHORS_GUIDE.md, "What each hook changes"). One entry per
 * rule and code, with its effect:
 *
 * - 'reports': the code is given only where the hook ran; its record is the
 *   evidence.
 * - 'decides': the hook's record settles what the code asks or claims: a
 *   question becomes a pass or a fail, or a fail becomes a question.
 * - 'leans': the hook's record sets or changes the code's lean.
 *
 * With the listener hook an element with a click or pointer listener added
 * from script is judged as one with an inline handler, so any code of those
 * rules can be reported on it; the list names the codes whose outcome or
 * lean the hook's record itself decides. tests/hook-reason-codes.test.js
 * holds the list to the rules.
 */

const entry = (ruleId, reasonCode, effect) => Object.freeze({ ruleId, reasonCode, effect });

const NAME_RULES = [
  'aria-role-name-present',
  'binary-control-name-present',
  'button-name-present',
  'combobox-name-present',
  'dialog-name-present',
  'empty-heading',
  'link-name-present',
  'listbox-name-present',
  'menuitem-name-present',
  'meter-name-present',
  'option-name-present',
  'progressbar-name-present',
  'role-img-text-alternative-present',
  'searchbox-name-present',
  'slider-name-present',
  'spinbutton-name-present',
  'tab-name-present',
  'textbox-name-present',
  'tooltip-name-present',
  'treeitem-name-present'
];

const HOOK_REASON_CODES = Object.freeze({
  // internalsHookScript(): an early hook reads every element's internals, so
  // the name or state is read, or the element has none.
  internals: Object.freeze([
    ...NAME_RULES.map((id) => entry(id, 'name_internals', 'decides')),
    entry('aria-required-attr', 'state_internals', 'decides')
  ]),
  // listenerHookScript(): the listeners a page adds from script.
  listener: Object.freeze([
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_NO_KEY_LISTENER', 'reports'),
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_KEY_LISTENER_ABOVE', 'reports'),
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_FOCUS_LISTENER', 'reports'),
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE', 'decides'),
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_NO_KEY_HANDLER', 'leans'),
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_NOT_IN_TAB_ORDER', 'leans'),
    entry('click-handler-keyboard-operable', 'CLICK_HANDLER_NOT_FOCUSABLE', 'leans'),
    entry('mouse-only-event-handlers', 'MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT', 'leans'),
    entry('password-paste-enabled', 'PASTE_CANCELLED', 'leans'),
    entry('widget-keyboard-focusable', 'WIDGET_NOT_IN_TAB_ORDER', 'leans'),
    entry('css-focus-indicator-suppressed', 'FOCUS_INDICATOR_SUPPRESSED', 'leans'),
    entry('focus-order-semantics', 'TABBABLE_WITH_NON_INTERACTIVE_ROLE', 'leans'),
    entry('skip-link', 'SKIP_LINK_TARGET_MISSING', 'leans')
  ]),
  // liveRegionHookScript(): what the page's live regions were given.
  liveRegion: Object.freeze([
    entry('live-region-announcements', 'LIVE_REGION_INSERTED_WITH_CONTENT', 'reports'),
    entry('live-region-announcements', 'LIVE_REGION_SHOWN_AND_FILLED', 'reports'),
    entry('live-region-announcements', 'LIVE_REGION_HIDDEN', 'leans')
  ])
});

module.exports = { HOOK_REASON_CODES };
