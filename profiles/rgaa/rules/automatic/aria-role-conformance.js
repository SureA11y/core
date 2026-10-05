/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-role-conformance
 * @atomic true
 * @summary Role attributes must be valid for the W3C validator
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every element with a role attribute in the scan scope,
 *   hidden content included: RGAA 8.2.1 judges the generated source code
 *   (« le code source généré de la page »), and the W3C validator named by
 *   its methodology checks hidden markup as well. A page with no role
 *   attribute is notApplicable.
 * @expectation
 *   Each role attribute passes the W3C validator (Nu HTML Checker), which
 *   RGAA 8.2.1 step 1 names: its value respects the writing rules
 *   (« Les balises, attributs et valeurs d'attributs respectent les règles
 *   d'écriture »). The rule fails where the validator reports an error:
 *   - `emptyRole`: the attribute holds no token;
 *   - `unknownRoleToken`: a token that is not a role the validator accepts,
 *     alone or in a list: a misspelling, an abstract role (widget, landmark),
 *     a token written with capitals (BUTTON), or a role the validator
 *     rejects (generic, mark, comment, suggestion, doc-pageheader,
 *     doc-pagefooter);
 *   - `roleNotAllowed`: the first recognised token is a role ARIA in HTML
 *     does not allow on this element (a tab on <nav>, a navigation on
 *     <main>, any role on a <td> in a native table, on the <summary> of a
 *     <details>, on <caption>, on <input type="hidden">, or a role other
 *     than listitem on an <li> in a list);
 *   - `imgRoleEmptyAlt`: an <img> with a role and alt="";
 *   - `imgRoleNoName`: an <img> with a role and no alt, aria-label or
 *     aria-labelledby attribute.
 *   It asks (cantTell) in one case, `imgPresentationRole`: an <img> with
 *   role="presentation" and an empty or missing alt. The validator reports
 *   an error there, but RGAA 1.2.1 names role="presentation" on an <img>
 *   as a way to mark a decorative image, so whether the audit counts it
 *   against 8.2.1 is left to the auditor.
 * @implementation-notes
 * - Expected outcomes follow the W3C validator version 26.9.27. The tables
 *   of accepted roles and of the roles each element allows were read from
 *   that version's reports, element by element; re-check them when the
 *   reference version changes.
 * - Tokens are split on ASCII whitespace and compared as written, as the
 *   validator does: role="BUTTON" fails and role=" button " passes. With
 *   several tokens, the first recognised one is the element's role and is
 *   the one checked against the element; later valid tokens are only a
 *   fallback (the validator notes them, without an error).
 * - role="directory" passes: the validator only warns that the role is
 *   deprecated.
 * - Elements whose allowed roles are not in the table are not judged on
 *   that point: custom elements (which the validator does not check),
 *   obsolete elements (reported by the validator as obsolete whatever
 *   their role), MathML content elements, and HTML elements the table does
 *   not list. SVG elements are judged on their tokens only.
 * - An <li> is judged only when its parent is a <ul>, <ol> or <menu>
 *   without a role, or has role="list"; a <td>, <th> or <tr> only when the
 *   nearest <table> has no role or role="table", "grid" or "treegrid"; a
 *   <summary> only when it is the first <summary> child of a <details>.
 * - Where a role must be contained in or own other roles (role="tab"
 *   outside a tablist), the validator also reports an error; this rule does
 *   not check it. That, and every parse error the DOM no longer shows, is
 *   why markup-validation-review asks for the validator on every page.
 * - The WCAG rules aria-roles-valid and aria-allowed-role keep their own
 *   verdicts: the first passes on one valid token, the second asks.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'aria-role-conformance';

const meta = {
  title: 'Role attributes are valid for the W3C validator',
  description:
    'Checks, hidden content included, that every role attribute holds roles the W3C validator accepts, that the role is allowed on its element, and that an <img> with a role has a non-empty alt or an ARIA name.',
  i18n: {
    titleKey: 'ariaRoleConformance_title',
    descriptionKey: 'ariaRoleConformance_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

  // Role tokens the W3C validator 26.9.27 accepts. directory is accepted
  // with a deprecation warning only.
  const ROLES = new Set(
    (
      'alert alertdialog application article banner blockquote button caption cell checkbox ' +
      'code columnheader combobox complementary contentinfo definition deletion dialog ' +
      'directory document emphasis feed figure form graphics-document graphics-object ' +
      'graphics-symbol grid gridcell group heading image img insertion link list listbox ' +
      'listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio ' +
      'meter navigation none note option paragraph presentation progressbar radio radiogroup ' +
      'region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton ' +
      'status strong subscript superscript switch tab table tablist tabpanel term textbox ' +
      'time timer toolbar tooltip tree treegrid treeitem doc-abstract doc-acknowledgments ' +
      'doc-afterword doc-appendix doc-backlink doc-biblioentry doc-bibliography doc-biblioref ' +
      'doc-chapter doc-colophon doc-conclusion doc-cover doc-credit doc-credits doc-dedication ' +
      'doc-endnote doc-endnotes doc-epigraph doc-epilogue doc-errata doc-example doc-footnote ' +
      'doc-foreword doc-glossary doc-glossref doc-index doc-introduction doc-noteref doc-notice ' +
      'doc-pagebreak doc-pagelist doc-part doc-preface doc-prologue doc-pullquote doc-qna ' +
      'doc-subtitle doc-tip doc-toc'
    ).split(' ')
  );

  const words = (s) => s.split(' ');
  const LIST_CONTAINER =
    'directory group list listbox menu menubar none presentation radiogroup tablist toolbar tree';
  const INPUT_ROLES =
    'button checkbox combobox directory gridcell link menuitem menuitemcheckbox menuitemradio ' +
    'option radio searchbox separator slider spinbutton switch tab textbox treeitem';

  // Roles allowed per HTML element, where the validator restricts them.
  // An element missing from this table is not judged on this point.
  const ALLOWED = {
    area: words('button directory link'),
    article: words('application article directory document feed main none presentation region'),
    aside: words(
      'complementary directory feed none note presentation region search doc-dedication ' +
        'doc-example doc-footnote doc-glossary doc-pullquote doc-tip'
    ),
    audio: words('application directory'),
    base: [],
    br: words('directory none presentation'),
    button: words(
      'button checkbox combobox directory gridcell link menuitem menuitemcheckbox ' +
        'menuitemradio option radio separator slider switch tab treeitem'
    ),
    caption: [],
    col: [],
    colgroup: [],
    datalist: [],
    dd: words('definition directory'),
    details: words('directory group'),
    dialog: words('alertdialog dialog directory'),
    dl: words('directory group list none presentation'),
    dt: words('directory listitem term'),
    embed: words('application directory document img none presentation'),
    fieldset: words('directory group none presentation radiogroup'),
    figcaption: words('directory group none presentation'),
    footer: words('contentinfo directory group none presentation doc-footnote'),
    form: words('directory form none presentation search'),
    head: [],
    header: words('banner directory group none presentation doc-footnote'),
    hr: words('directory none presentation separator doc-pagebreak'),
    html: [],
    iframe: words('application directory document img none presentation'),
    legend: [],
    main: words('directory main'),
    map: [],
    menu: words(LIST_CONTAINER),
    meta: [],
    meter: [],
    nav: words(
      'directory menu menubar navigation none presentation tablist doc-index doc-pagelist doc-toc'
    ),
    noscript: [],
    object: words('application directory document img'),
    ol: words(LIST_CONTAINER),
    optgroup: words('directory group'),
    option: words('directory option'),
    picture: [],
    progress: words('directory progressbar'),
    script: [],
    search: words('directory form group none presentation region search'),
    section: words(
      'alert alertdialog application banner complementary contentinfo dialog directory ' +
        'document feed group log main marquee navigation none note presentation region ' +
        'search status tabpanel doc-abstract doc-acknowledgments doc-afterword doc-appendix ' +
        'doc-bibliography doc-chapter doc-colophon doc-conclusion doc-credit doc-credits ' +
        'doc-dedication doc-endnotes doc-epigraph doc-epilogue doc-errata doc-example ' +
        'doc-foreword doc-glossary doc-index doc-introduction doc-notice doc-pagelist doc-part ' +
        'doc-preface doc-prologue doc-pullquote doc-qna doc-toc'
    ),
    style: [],
    template: [],
    textarea: words('directory textbox'),
    title: [],
    track: [],
    ul: words(LIST_CONTAINER),
    video: words('application directory'),
    wbr: words('directory none presentation'),
    h1: words('directory heading none presentation tab doc-subtitle'),
    h2: words('directory heading none presentation tab doc-subtitle'),
    h3: words('directory heading none presentation tab doc-subtitle'),
    h4: words('directory heading none presentation tab doc-subtitle'),
    h5: words('directory heading none presentation tab doc-subtitle'),
    h6: words('directory heading none presentation tab doc-subtitle')
  };
  // Roles an <hgroup> may not take; any other role is allowed.
  const HGROUP_DENIED = new Set(words('button img progressbar separator slider'));
  const IMG_ALLOWED = words(
    'button checkbox directory img link math menuitem menuitemcheckbox menuitemradio option ' +
      'progressbar radio scrollbar separator slider switch tab treeitem doc-cover'
  );
  // Input types whose allowed roles were read from the validator.
  const INPUT_TYPES = new Set(
    words(
      'text search email tel url password number range checkbox radio button submit reset ' +
        'image date color file'
    )
  );

  const MESSAGES = {
    emptyRole: {
      outcome: 'fail',
      summary: 'This <{{element}}> has a role attribute with no value.',
      hint: 'Remove the empty role attribute, or give it a WAI-ARIA role.'
    },
    unknownRoleToken: {
      outcome: 'fail',
      summary:
        'role="{{value}}" on this <{{element}}> contains "{{token}}", which is not a role the W3C validator accepts.',
      hint: 'Use lowercase WAI-ARIA role names only, and remove tokens that are not concrete roles (abstract roles such as widget are not allowed).'
    },
    roleNotAllowed: {
      outcome: 'fail',
      summary: 'role="{{role}}" is not allowed on this <{{element}}>.',
      hint: 'Use an element whose native role fits, or a role that ARIA in HTML allows on this element.'
    },
    imgRoleEmptyAlt: {
      outcome: 'fail',
      summary: 'This <img> has a role attribute and an empty alt.',
      hint: 'Remove the role from a decorative image, or give an image that carries a role a text alternative.'
    },
    imgRoleNoName: {
      outcome: 'fail',
      summary:
        'This <img> has a role attribute but no alt, aria-label or aria-labelledby attribute.',
      hint: 'Add an alt attribute (or an ARIA name) to the image.'
    },
    imgPresentationRole: {
      outcome: 'cantTell',
      summary:
        'This <img> has role="presentation" with an empty or missing alt, which the W3C validator reports as an error.',
      hint: 'RGAA 1.2.1 accepts role="presentation" to mark a decorative image. Check how the audit treats the validator error, or use alt="" alone.',
      needed:
        'Whether the audit counts the validator error on an <img role="presentation">, a markup RGAA 1.2.1 names for decorative images, against 8.2.1.'
    }
  };

  const ASCII_WS = /[\t\n\f\r ]+/;

  function localName(el) {
    return String(el.localName || el.tagName || '').toLowerCase();
  }

  function attr(el, name) {
    try {
      return el.getAttribute(name);
    } catch {
      return null;
    }
  }

  function tokensOf(value) {
    return String(value)
      .split(ASCII_WS)
      .filter((t) => t !== '');
  }

  function parentEl(el) {
    const p = el.parentNode;
    return p && p.nodeType === 1 ? p : null;
  }

  function firstRole(el) {
    const value = attr(el, 'role');
    if (value == null) return '';
    for (const t of tokensOf(value)) if (ROLES.has(t)) return t;
    return '';
  }

  function nearestTable(el) {
    for (let n = parentEl(el); n; n = parentEl(n)) {
      if (localName(n) === 'table' && (n.namespaceURI || HTML_NS) === HTML_NS) return n;
    }
    return null;
  }

  function isFirstSummaryOfDetails(el) {
    const p = parentEl(el);
    if (!p || localName(p) !== 'details') return false;
    for (const c of p.querySelectorAll(':scope > *')) {
      if (localName(c) === 'summary') return c === el;
    }
    return false;
  }

  function selectIsListbox(el) {
    if (el.hasAttribute('multiple')) return true;
    const size = attr(el, 'size');
    if (size == null) return false;
    const n = /^\s*(\d+)/.exec(size);
    return !!n && Number(n[1]) > 1;
  }

  // The roles this element allows, or null when the rule does not judge it.
  function allowedRoles(el, name) {
    if (name === 'hgroup') return { denied: HGROUP_DENIED };
    if (name === 'input') {
      const type = String(attr(el, 'type') || '').toLowerCase();
      if (type === 'hidden') return { list: [] };
      // A missing type is text. The date and time types the table does not
      // cover (time, week...) and unknown types are not judged.
      if (type && !INPUT_TYPES.has(type)) return null;
      return { list: words(INPUT_ROLES) };
    }
    if (name === 'select')
      return { list: selectIsListbox(el) ? ['listbox'] : ['combobox', 'menu'] };
    if (name === 'li') {
      const p = parentEl(el);
      if (!p) return null;
      const pn = localName(p);
      if ((pn === 'ul' || pn === 'ol' || pn === 'menu') && !p.hasAttribute('role')) {
        return { list: ['listitem'] };
      }
      if (firstRole(p) === 'list') return { list: ['listitem'] };
      return null;
    }
    if (name === 'td' || name === 'th' || name === 'tr') {
      const table = nearestTable(el);
      if (!table) return null;
      if (!table.hasAttribute('role')) return { list: [] };
      const r = firstRole(table);
      if (r === 'table' || r === 'grid' || r === 'treegrid') return { list: [] };
      return null;
    }
    if (name === 'summary') {
      return isFirstSummaryOfDetails(el) ? { list: [] } : null;
    }
    if (Object.prototype.hasOwnProperty.call(ALLOWED, name)) return { list: ALLOWED[name] };
    return null;
  }

  const query = (sel) =>
    helpers.queryAllSource ? helpers.queryAllSource(sel) : helpers.queryAll(sel);
  const nodes = query('[role]');

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  function report(el, reasonCode, params) {
    const msg = MESSAGES[reasonCode];
    let summary = msg.summary;
    for (const k of Object.keys(params)) summary = summary.split(`{{${k}}}`).join(params[k]);
    const occurrence = helpers.reportOccurrence(el, {
      summary,
      hint: msg.hint,
      i18n: {
        summaryKey: `ariaRoleConformance_summary_${msg.outcome}_${reasonCode}`,
        hintKey: `ariaRoleConformance_hint_${msg.outcome}_${reasonCode}`,
        params
      },
      ...(msg.outcome === 'cantTell'
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: msg.needed,
              evidence: { element: params.element, role: params.role || '' }
            }
          }
        : {}),
      data: {
        details: { reasonCode, ...params },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
    if (msg.outcome === 'fail') failOccurrences.push(occurrence);
    else cantTellOccurrences.push(occurrence);
  }

  for (const el of nodes) {
    if (!el || el.nodeType !== 1) continue;
    const ns = el.namespaceURI || HTML_NS;
    const name = localName(el);
    if (ns === HTML_NS && name.indexOf('-') !== -1) continue; // custom element
    if (ns !== HTML_NS && ns !== SVG_NS && !(ns === MATHML_NS && name === 'math')) continue;

    const value = attr(el, 'role');
    if (value == null) continue;
    applicableCount += 1;
    const element = name;
    const tokens = tokensOf(value);

    if (!tokens.length) {
      report(el, 'emptyRole', { element });
      continue;
    }

    const unknown = tokens.filter((t) => !ROLES.has(t));
    for (const token of unknown) {
      report(el, 'unknownRoleToken', { element, value: String(value), token });
    }

    const role = tokens.find((t) => ROLES.has(t)) || '';

    if (ns === HTML_NS && name === 'img') {
      const alt = attr(el, 'alt');
      const named = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
      const emptyAlt = alt === '';
      const noName = alt == null && !named;
      if (emptyAlt || noName) {
        if (role === 'presentation' && !unknown.length) {
          report(el, 'imgPresentationRole', { element, role });
        } else {
          report(el, emptyAlt ? 'imgRoleEmptyAlt' : 'imgRoleNoName', { element });
        }
        continue;
      }
      if (role && IMG_ALLOWED.indexOf(role) === -1) {
        report(el, 'roleNotAllowed', { element, role });
      }
      continue;
    }

    if (!role) continue;
    let allowed = null;
    if (ns === MATHML_NS) allowed = { list: ['directory', 'math'] };
    else if (ns === HTML_NS) allowed = allowedRoles(el, name);
    if (!allowed) continue;
    const ok = allowed.denied ? !allowed.denied.has(role) : allowed.list.indexOf(role) !== -1;
    if (!ok) report(el, 'roleNotAllowed', { element, role });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
