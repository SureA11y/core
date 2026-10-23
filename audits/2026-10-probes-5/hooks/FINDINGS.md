# Hooks and keyboard/scripting rules: findings (prefix KH)

Target `c528af08`, Chromium 153.0.8010.12, jsdom via `tests/helpers/runa11yCoreOnHtml.js`. Scripts are in this folder; `h.mjs` is the runner. Every repro was run at least twice with the same result, and the keyboard claims were checked by driving the keyboard in Chromium.

## KH-1: An early listener hook fails a working button when the key listener is on a shadow root

Repro (listener hook as init script):

```html
<x-c></x-c><script>customElements.define('x-c',class extends HTMLElement{constructor(){super();const r=this.attachShadow({mode:'open'});r.innerHTML='<div id=b role=button tabindex=0>Save</div>';r.getElementById('b').addEventListener('click',()=>{document.title='saved'});r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.click()}})}})</script>
```

Slotted variant: `<x-s><div id=b role=button tabindex=0>Save</div></x-s>`, where x-s's shadow root (`<div><slot></slot></div>`) has the keydown listener.

- **In plain words:** a component that listens for keys on its shadow root (Lit's `renderRoot`) gets a fail saying Enter and Space do nothing. Tab then Enter sets the title to "saved".
- **Engine says:** fail `CLICK_HANDLER_NO_KEY_LISTENER`. **Should say:** pass, or at most cantTell `CLICK_HANDLER_KEY_LISTENER_ABOVE`.
- **Spec:** WCAG 2.1.1 "All functionality of the content is operable through a keyboard interface…". DOM "get the parent": "returns the node's assigned slot, if node is assigned; otherwise node's parent"; a shadow root's parent is its host, so the ShadowRoot is on the event path.
- **Own docs:** the fail requires that the hook "saw no key listener on it, a descendant, an ancestor, the document or the window". The hook did see this one; it recorded it on the ShadowRoot, which the rule never asks.
- **Cause:** `src/checks/automatic/click-handler-keyboard-operable.js:326` `ancestors()` (elements only); `:353` `pageKeyListener` (document and window); `:386` checks ancestor elements only.
- **Verdict:** Bug. **Severity:** Medium.

## KH-2: `role="alert"` with an explicit `aria-live` is not treated as an alert by the live-region hook

Repro (p06): after load, `m.insertAdjacentHTML('beforeend','<div role="alert" aria-live="assertive">Payment failed</div>')`.

- **Engine says:** live-region-announcements cantTell `LIVE_REGION_INSERTED_WITH_CONTENT`; `getAnnouncements()` returns `[]`. Without `aria-live`, or with `aria-atomic`: pass and `["assertive","Payment failed"]`. `aria-live="polite"` behaves like assertive.
- **Spec:** ARIA alert: "Alert is a special type of assertive live region … the user agent SHOULD fire a system alert event … when the alert is rendered … Elements with the role alert have an implicit aria-live value of assertive". Chromium's AX tree shows the same live=assertive, atomic=true for both forms.
- **Own docs:** INTEGRATION.md: "`role="alert"` is left out: an alert added with its text is announced, and is recorded as an announcement."
- **Cause:** `src/core/live-region-hook.js:251-253`, `isAlert` requires `aria-live === ''`.
- **Verdict:** Bug. **Severity:** Medium (common markup; breaks the `getAnnouncements` contract).

## KH-3: `scrollable-region-focusable` asks about every `<textarea>` (and contenteditable scrollers) in a browser

Repro (p13): `<main><label>Comment <textarea></textarea></label></main>`

- **Engine says:** cantTell `SCROLLABLE_OVERFLOW_NOT_FOCUSABLE` in Chromium (the UA style gives textarea `overflow:auto`), notApplicable in jsdom; the disabled variant is also cantTell. `<div contenteditable style="overflow:auto">` is also cantTell.
- **Spec:** HTML lists textarea as a focusable area; WCAG 2.1.1 is met.
- **Cause:** `src/checks/manual/scrollable-region-focusable-manual.js:111-119` `isSelfFocusable` reads `tabindex` only; textarea is in the candidates at `:138`; actual overflow is never checked.
- **Verdict:** Bug / Inconsistency (jsdom vs Chromium). **Severity:** Low by the rubric (cantTell only), but on every page with a textarea.

## KH-4: Key handling wired on focus counts as "no key listener", and the button fails

Repro (p01 keydownOnFocus, focusinDocLazy): `b.addEventListener('click',…); b.addEventListener('focus',()=>b.addEventListener('keydown',…),{once:true})`. Tab then Enter works.

- **Engine says:** fail `CLICK_HANDLER_NO_KEY_LISTENER`. **Should say:** cantTell when a focus or focusin listener is on the element, an ancestor, the document or the window.
- **Own docs:** "an early hook … saw every listener". True only of the listeners added so far.
- **Cause:** `click-handler-keyboard-operable.js:390` `noKeyListenerAnywhere` ignores focus and focusin listeners, which the hook records.
- **Verdict:** Debatable. **Severity:** Low.

## KH-5: Listeners the hook can't attribute become a false fail

Repro (p07 stringObjKeyType): `b.addEventListener(new String('keydown'), …)`, or `iframe.contentWindow.EventTarget.prototype.addEventListener.call(b,'keydown',…)`. Enter works in both.

- **Engine says:** fail `CLICK_HANDLER_NO_KEY_LISTENER`.
- **Spec:** WebIDL converts the DOMString type with ToString, so the listener is real.
- **Cause:** `src/core/listener-hook.js:111` `typeof type !== 'string'`; one registry per realm.
- **Verdict:** Bug (type) / Debatable (other realm). **Severity:** Low.

## KH-6: A click listener with an already-aborted signal is counted

Repro: `<div id=b role=button>Save</div>`; `ac.abort(); b.addEventListener('click',f,{signal:ac.signal})`. Clicking does nothing.

- **Engine says:** fail `CLICK_HANDLER_CONTROL_NOT_FOCUSABLE`. **Should say:** notApplicable.
- **Spec:** DOM "add an event listener": "If listener's signal is not null and is aborted, then return."
- **Own docs** cover only a signal "that later aborts".
- **Cause:** `listener-hook.js` addEventListener wrapper (~`:140-146`) records without checking `signal.aborted`.
- **Verdict:** Bug. **Severity:** Low.

## KH-7: Installing the hook makes `options.capture` be read twice

Repro (p02): a getter on `options.capture` runs once without the hook and twice with it, for both add and remove.

- **Spec:** DOM "flatten options" reads capture once. **Own docs:** "The page gets exactly what it would have".
- **Cause:** `listener-hook.js:102-105` `captureOf`.
- **Verdict:** Bug. **Severity:** Low.

## KH-8: `invalid-field-error-message` fails messages whose text the user can see

Repros (p03):
- A) `<input id=i aria-invalid=true aria-errormessage=e><div id=e style="visibility:hidden"><span style="visibility:visible">Enter a valid email</span></div>` → fail `ERROR_MESSAGE_HIDDEN`.
- B) `<p id=e><span aria-hidden=true>Enter a valid email</span></p>` → fail `ERROR_MESSAGE_EMPTY`.
- C) `<p id=e aria-hidden=true>Enter a valid email</p>` → pass.

- **Spec:** ARIA aria-errormessage "authors MUST ensure the content is not [hidden]"; WCAG 3.3.1 "described to the user in text". Chromium drops the errormessage relation in A and C but keeps it in B (supporting evidence only).
- **Own docs:** "hidden when nobody sees it". A contradicts this; B and C apply the text rule unevenly.
- **Cause:** `invalid-field-error-message.js:92-115` (eligibility on the message element itself; `getTextFromIdRefs` prunes aria-hidden descendants).
- **Verdict:** Inconsistency, Bug for A. **Severity:** Low.

## KH-9: No-op onclick spellings are not recognised

Repro (p09): `<span role=button onclick="javascript:void(0)">Menu</span>` → fail `CLICK_HANDLER_CONTROL_NOT_FOCUSABLE`; so do `void (0)`, `return(false)`, `javascript:return false`. `return false` is notApplicable.

- **Own docs** exclude handlers "made only of statements that do nothing". `javascript:` is a label.
- **Cause:** `click-handler-keyboard-operable.js:186` (exact strings), `:220` `isNoOp`.
- **Verdict:** Inconsistency. **Severity:** Low.

## KH-10: The F55 rule misses focus moved elsewhere and misfiles Example 3

Repro (p05): `onfocus="document.getElementById('o').focus()"`, `onfocus="document.body.focus()"` and `onfocus="this['blur']()"` are notApplicable; F55's Example 3 `onfocus="if(this.blur)this.blur();"` is `CALLS_BLUR`, not `BLURS_SELF`.

- **Spec:** F55 test: "Check that when focus is placed on each element, focus remains there until user moves it."
- **Cause:** `focus-not-removed-by-script-manual.js:93-96` regexes.
- **Verdict:** Gap. **Severity:** Low.

## KH-11: `aria-expanded-state-mismatch` counts a `content-visibility:hidden` panel as shown

Repro (p04): `<button aria-expanded=true aria-controls=p>Menu</button><div id=p style="content-visibility:hidden">Panel</div>` → pass.

- **Own docs** list "content-visibility: hidden … on it or an ancestor" as hidden. CSS Containment 2: the element "skips its contents".
- **Verdict:** Inconsistency (docs vs code). **Severity:** Low.

## Leads

1. `invalid-field-error-message` fails when the error is in a `role=alert` summary or the label but `aria-errormessage` points at a hidden message: 3.3.1 is met, ARIA's MUST is broken. Needs a decision.
2. The same rule applies to `aria-disabled` fields (docs say "not disabled") and to a generic `<div aria-invalid=true>`.
3. Nested `aria-live=off` inside polite is recorded as a polite announcement (`live-region-hook.js:274`). Unconfirmed in Chromium.
4. The hook ignores `aria-relevant`. A role added together with text in one task is recorded nowhere.
5. `accesskey` on a `role=button` div fails, though Chromium's access key clicks it.
6. A descendant's key handler counts as passing for the focused parent (documented as intended).
7. `widget-keyboard-focusable`: items in a composite's shadow root are not treated as managed (light-DOM limit, documented).
8. `mouse-only-event-handlers` returns notApplicable instead of pass when every applicable element is fine.
9. `scrollable-region-focusable` counts disabled, `tabindex=-1` and iframe children as focusable content (documented).

## What held up

- Listener-hook transparency (~25 checks, with vs without hook): return values, `this`, thrown errors, names, length, descriptors, not constructible, setter round trips, freezing the prototype afterwards all unchanged, except KH-7 and the documented `[native code]` source.
- Listener bookkeeping (~30 cases): removal with mismatched capture forms, `onclick=null`, `handleEvent`, `once`, window and document properties, `<html onkeydown>`, double install, a page replacing `addEventListener` (downgraded to `late`), `Element.prototype` shadowing that calls through, late hook (never fails), closed shadow roots, pointer-only listeners.
- Determinism: same page scanned three times identical; jsdom and Chromium agree on 17 of 19 inline-handler pages, the 2 differences layout-dependent as documented.
- Overhead: 100k listeners on 20k elements cost tens of ms; 5,000 live updates added no measurable time; the record caps at 500 and counts the rest as dropped.
- Live-region hook: 32 cases correct apart from KH-2 and leads 3–4; shadow DOM out of scope as documented.
- `widget-keyboard-focusable` (18 cases, incl. activedescendant hosts), `aria-expanded-state-mismatch` (27), `invalid-field-error-message` (33: pseudo-content, shadow and slotted text, declarative shadow DOM, odd `aria-invalid` values) correct apart from the items above.
- `click-handler-keyboard-operable` without the hook: `display:contents` not focusable (Chromium 153 confirms), delegation to an inner link handled, aria-disabled ancestors excluded.
