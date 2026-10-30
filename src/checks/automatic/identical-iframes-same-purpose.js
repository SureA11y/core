/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check identical-iframes-same-purpose
 * @atomic true
 * @summary Frames sharing an accessible name must embed the same resource
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to each set of two or more <iframe>/<frame> elements that are
 *   included in the accessibility tree and share the same non-empty
 *   accessible name, compared with whitespace collapsed. A frame named
 *   only by a mechanism that names nothing, or hidden from the
 *   accessibility tree, is not part of a set; a set needs two surviving
 *   members to exist at all.
 * @expectation
 *   Every frame in a set resolves to the same resource. A shared name
 *   describes one resource, so two frames answering to it must embed the
 *   same one.
 * @reports
 *   - `name`: the accessible name the frames share.
 *   - `resource`: the address this frame embeds, as an absolute URL without
 *     its fragment. Empty (`null`) when its `src` could not be resolved
 *     (`IFRAME_RESOURCE_UNRESOLVED`).
 *   - `setSize`: how many frames share the name.
 * @reason-codes
 *   - `IFRAME_RESOURCE_DIFFERS` (cantTell): frames that share an accessible
 *     name embed different resources; a person judges whether they serve
 *     the same purpose.
 *     It leans pass when the addresses differ only in tracking or cache-
 *     busting parameters or a www. prefix, and fail when another frame
 *     embeds a different video from the same video host.
 *     Basis: WCAG 4.1.2 (not settled); ACT 4b1c6c (not settled).
 *   - `IFRAME_RESOURCE_UNRESOLVED` (cantTell): a frame shares its accessible
 *     name with other frames, but its src could not be resolved to compare
 *     what it embeds.
 *     It leans as IFRAME_RESOURCE_DIFFERS does, reading the frame's data-
 *     src, data-lazy-src or srcdoc; with none of them, no lean.
 *     Basis: WCAG 4.1.2 (not settled); ACT 4b1c6c (not settled).
 * @implementation-notes
 * - Frames are grouped by the computed accessible name, not the title
 *   attribute, so a title that aria-label or aria-labelledby overrides does
 *   not count. It replaces iframe-title-unique, deprecated in 1.8.0, which
 *   grouped them by the title attribute.
 * - src values are compared as resolved absolute URLs with the fragment
 *   removed and a trailing slash normalised away, so a directory written
 *   both with and without one is a single resource.
 * - Frames that resolve to different URLs are reported cantTell, never
 *   fail. Different resources can still be equivalent — differently worded
 *   copies of one page, or two adverts serving the same purpose — and
 *   nothing in the markup settles it. Comparing the embedded documents
 *   would not settle it either, since content differing is exactly what
 *   those equivalent cases look like.
 */

const id = 'identical-iframes-same-purpose';

const meta = {
  title: 'Frames with the same name embed the same resource',
  description:
    'Checks that <iframe>/<frame> elements sharing an accessible name embed the same resource, since one name can only describe one resource.',
  i18n: {
    titleKey: 'identicalIframesSamePurpose_title',
    descriptionKey: 'identicalIframesSamePurpose_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic', 'name', 'iframe'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['identical-iframes-same-purpose'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  function normalizedName(el) {
    if (!helpers.getAccessibleNameInfo) return '';
    let info;
    try {
      info = helpers.getAccessibleNameInfo(el, ctx, { maxRefs: 8 });
    } catch {
      return '';
    }
    if (!info || !info.present || !info.value) return '';
    return String(info.value).replace(/\s+/g, ' ').trim();
  }

  // A light-DOM child of a shadow host with no slot to land in is absent from
  // the flat tree and so renders nowhere, which the shared eligibility helper
  // does not model.
  function isUnslotted(el) {
    try {
      let cur = el;
      let guard = 0;
      while (cur && dom.nodeType(cur) === 1 && guard++ < 100) {
        const parent = dom.parentNode(cur);
        if (!parent || dom.nodeType(parent) !== 1) return false;
        if (dom.shadowRoot(parent) && dom.assignedSlot(cur) == null) return true;
        cur = parent;
      }
      return false;
    } catch {
      return false;
    }
  }

  function inAccessibilityTree(el) {
    if (isUnslotted(el)) return false;
    if (!helpers.isIncludedInAccessibilityTree) return true;
    try {
      return !!helpers.isIncludedInAccessibilityTree(el);
    } catch {
      return false;
    }
  }

  // A directory written with and without its trailing slash is one resource,
  // and a fragment selects within a resource rather than naming another.
  function resourceKey(el) {
    let raw;
    try {
      raw = dom.getAttribute(el, 'src');
    } catch {
      return null;
    }
    if (raw == null || !String(raw).trim()) return null;

    const doc = (ctx && ctx.document) || (dom.ownerDocument(el) ? dom.ownerDocument(el) : null);
    const base = doc && dom.baseURI(doc) ? dom.baseURI(doc) : undefined;
    try {
      const u = new URL(String(raw).trim(), base);
      let pathname = u.pathname;
      if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') {
        pathname = pathname.slice(0, -1);
      }
      return u.protocol + '//' + dom.host(u) + pathname + u.search;
    } catch {
      return null;
    }
  }

  // ---- Leans ----

  // Query parameters that track a visit or bust a cache, and so do not
  // change what a frame embeds. `v` and `t` are left in: on a video host they
  // name the video and its start.
  function isTrackingParam(key) {
    const k = key.toLowerCase();
    return (
      k.indexOf('utm_') === 0 ||
      ['gclid', 'fbclid', 'msclkid', 'ver', 'cb', 'cachebuster', 'timestamp', 'ts', '_'].indexOf(
        k
      ) !== -1
    );
  }

  // Hosts that embed one video per address, where two addresses under one
  // name are two videos under one name.
  const VIDEO_HOSTS = [
    'youtube.com',
    'youtube-nocookie.com',
    'player.vimeo.com',
    'dailymotion.com',
    'player.twitch.tv'
  ];

  // What a frame embeds, read from its src, else a lazy-load attribute
  // (data-src, data-lazy-src), else its srcdoc. `from` says which.
  function embedOf(el) {
    const fromSrc = resourceKey(el);
    if (fromSrc) return { key: fromSrc, from: 'src' };
    for (const attr of ['data-src', 'data-lazy-src']) {
      const raw = dom.getAttribute(el, attr);
      if (raw == null || !String(raw).trim()) continue;
      const doc = (ctx && ctx.document) || dom.ownerDocument(el);
      try {
        return { key: new URL(String(raw).trim(), dom.baseURI(doc)).href, from: attr };
      } catch {
        return null;
      }
    }
    const srcdoc = dom.getAttribute(el, 'srcdoc');
    if (srcdoc != null && String(srcdoc).trim()) return { srcdoc: String(srcdoc), from: 'srcdoc' };
    return null;
  }

  // An address with what doesn't change the resource taken out: the scheme,
  // a www. prefix, the fragment, a trailing slash, tracking and cache-busting
  // parameters, and the order of the rest.
  function comparable(embed) {
    if (!embed) return null;
    if (embed.srcdoc != null) return { same: 'srcdoc:' + embed.srcdoc, site: '', path: '' };
    try {
      const u = new URL(embed.key);
      const site = u.hostname.toLowerCase().replace(/^www\./, '');
      let path = u.pathname;
      if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
      const params = [];
      u.searchParams.forEach((v, k) => {
        if (!isTrackingParam(k)) params.push(k + '=' + v);
      });
      params.sort();
      return {
        same: site + path + '?' + params.join('&'),
        site,
        path: path + '?' + params.join('&')
      };
    } catch {
      return null;
    }
  }

  function isVideoHost(host) {
    return VIDEO_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  }

  // Frames of a set that embed the same thing once tracking parameters and
  // a www. alias are set aside lean pass; one that shares a video host with
  // another frame of the set and embeds a different video there leans fail.
  function setLeans(name, els, keys) {
    const embeds = els.map((el, i) =>
      keys[i] != null ? { key: keys[i], from: 'src' } : embedOf(el)
    );
    const comps = embeds.map(comparable);
    const allKnown = comps.every((c) => c != null);
    const allSame = allKnown && comps.every((c) => c.same === comps[0].same);
    return els.map((el, i) => {
      const c = comps[i];
      if (!c) return null;
      const from = embeds[i].from;
      const readLazily = embeds.some((e) => e && e.from !== 'src');
      if (allSame) {
        return readLazily
          ? {
              toward: 'pass',
              why: 'Read from their lazy-load attributes or srcdoc where src is missing, the frames with this name embed the same resource.',
              signals: [
                { signal: 'embed-read-from', value: from },
                { signal: 'shared-name', value: name }
              ],
              caution: 'A script may change the address before the frame loads.',
              i18n: {
                whyKey: 'identicalIframesSamePurpose_lean_why_lazySame',
                cautionKey: 'identicalIframesSamePurpose_lean_caution_lazySame'
              }
            }
          : {
              toward: 'pass',
              why: 'The addresses differ only in tracking or cache-busting parameters or a www. prefix, so the frames embed the same resource.',
              signals: [
                { signal: 'url-diff-kind', value: 'tracking-or-alias' },
                { signal: 'shared-name', value: name }
              ],
              i18n: { whyKey: 'identicalIframesSamePurpose_lean_why_sameResource' }
            };
      }
      if (!c.site || !isVideoHost(c.site)) return null;
      const otherVideo = comps.some(
        (o, j) => j !== i && o && o.site === c.site && o.path !== c.path
      );
      if (!otherVideo) return null;
      return {
        toward: 'fail',
        why: 'Another frame with the same name embeds a different video from the same video service.',
        signals: [
          { signal: 'url-diff-kind', value: 'path' },
          { signal: 'video-host', value: c.site },
          { signal: 'embed-read-from', value: from }
        ],
        caution:
          'Two addresses on a video service can still show the same video, such as a playlist and a single video.',
        i18n: {
          whyKey: 'identicalIframesSamePurpose_lean_why_differentVideo',
          cautionKey: 'identicalIframesSamePurpose_lean_caution_differentVideo'
        }
      };
    });
  }

  const groups = new Map();

  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;
    if (!inAccessibilityTree(el)) continue;

    const name = normalizedName(el);
    if (!name) continue;

    const list = groups.get(name);
    if (list) list.push(el);
    else groups.set(name, [el]);
  }

  const sets = [];
  for (const [name, els] of groups) {
    if (els.length >= 2) sets.push([name, els]);
  }

  if (!sets.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];

  for (const [name, els] of sets) {
    const keys = els.map(resourceKey);
    const resolved = keys.filter((k) => k != null);
    const allResolved = resolved.length === keys.length;
    const allSame = allResolved && resolved.every((k) => k === resolved[0]);
    if (allSame) continue;

    const leans = setLeans(name, els, keys);
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const tag = dom.tagName(el).toLowerCase();
      occurrences.push(
        helpers.reportOccurrence(el, {
          ...(leans[i] ? { lean: leans[i] } : {}),
          summary:
            'This frame shares its accessible name with another frame that embeds a different resource.',
          hint: 'If these frames embed equivalent content, such as two copies of one page or two adverts that do the same job, nothing needs to change. Otherwise give each frame a name that describes what it embeds.',
          i18n: {
            summaryKey: 'identicalIframesSamePurpose_summary_cantTell',
            hintKey: 'identicalIframesSamePurpose_hint_cantTell',
            params: { element: tag, name }
          },
          uncertainty:
            keys[i] == null
              ? {
                  code: 'not-computable',
                  needed: 'A resolvable src for this frame.',
                  evidence: { element: tag, name, setSize: els.length }
                }
              : {
                  code: 'equivalence-unknown',
                  needed: 'Whether the two resources serve the same purpose despite differing.',
                  evidence: {
                    element: tag,
                    name,
                    resource: keys[i],
                    otherResources: resolved.filter((k) => k !== keys[i]),
                    setSize: els.length
                  }
                },
          data: {
            details: {
              reasonCode:
                keys[i] == null ? 'IFRAME_RESOURCE_UNRESOLVED' : 'IFRAME_RESOURCE_DIFFERS',
              element: tag,
              name,
              resource: keys[i],
              setSize: els.length
            }
          }
        })
      );
    }
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  // A pass is a claim about the whole page, and a scoped scan saw only part
  // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
  return {
    ruleId: rule.ruleId,
    outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
