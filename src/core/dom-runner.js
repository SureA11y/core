/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * DOM runner implementation.
 *
 * IMPORTANT:
 * - This function is inlined into generated core.js (Node + in-page runner).
 * - It intentionally references shared runtime helpers that core.js defines:
 *   resolvePolicy, POLICY_CONTRACTS, resolveRuleDefI18n, ruleMatchesRunOnly,
 *   normalizeRuleResult, normalizeLocale, resolveLocale, createDomHelpers, normalizeSelectorList,
 *   resolveContextRoots (src/core/dom-helpers.js -- also used by frame-scan.js),
 *   normalizeRuleMeta (src/core/rule-meta.js -- used for engineOptions.customRules),
 *   resolveMappingSelection, filterNormativeMappings (engineOptions.mappings),
 *   RULE_MAPPED_STANDARDS (standards mapped rule by rule, for rollups),
 *   RESTATED_PREFIXES (their requirements that restate a WCAG criterion),
 *   OPT_IN_RULE_TAGS (for the engineOptions.optInRules warning),
 *   describeOptionValue (src/core/dom-helpers.js -- names a value of the wrong type),
 *   rollupInProfileVersion (a standard's rollups under one of its profiles),
 *   profileStandardOf (ctx.standard: the standard a profile targets),
 *   ENGINE_VERSION (the package version, baked in at build time).
 */

// The only module required here: a self-contained one, inlined into the
// page bundle next to these functions.
const { createSafeDom } = require('./safe-dom');

/* global resolvePolicy, POLICY_CONTRACTS, resolveRuleDefI18n, ruleMatchesRunOnly,
   normalizeRuleResult, normalizeLocale, resolveLocale, createDomHelpers, normalizeSelectorList,
   resolveContextRoots, normalizeRuleMeta, resolveMappingSelection, filterNormativeMappings,
   RULE_MAPPED_STANDARDS, RESTATED_PREFIXES, OPT_IN_RULE_TAGS, rollupInProfileVersion,
   profileStandardOf, ENGINE_VERSION, describeOptionValue */

/**
 * Rolls the atomic results up to one result per WCAG Success Criterion.
 *
 * Split out of runCore so a run assembled in pieces can reach it: a chunked
 * run only has every atomic result once its last chunk is done, and a
 * composite is meaningless over a subset of its own contributors.
 *
 * Reads nothing from the DOM -- given the same atomic results it returns the
 * same rollups.
 */
function rollupCompositeResults(
  checksResults,
  COMPOSITE_RULES,
  runOnly,
  engineOptionsResolved,
  policy,
  sharedHelpers,
  ENGINE_TAG,
  SCHEMA_VERSION
) {
  // =========================
  // Composite rule aggregation (data-only rollups)
  // =========================
  const rulesResults = [];
  try {
    const composites = Array.isArray(COMPOSITE_RULES) ? COMPOSITE_RULES : [];

    // Determine target conformance level from runOnly.tags (already normalized by caller)
    const LEVEL_RANK = { A: 1, AA: 2, AAA: 3 };

    // A WCAG target (runOnly.wcag) names its level; with tags beside it, the
    // higher of the two, as the rules selected are the union of both.
    function inferTargetLevelFromRunOnly(runOnly2) {
      const fromTags = inferTargetLevelFromTags(runOnly2);
      const fromWcag = runOnly2 && runOnly2.wcag ? runOnly2.wcag.level : null;
      if (!fromWcag) return fromTags;
      return fromTags && LEVEL_RANK[fromTags] > LEVEL_RANK[fromWcag] ? fromTags : fromWcag;
    }

    function inferTargetLevelFromTags(runOnly2) {
      const tags = runOnly2 && Array.isArray(runOnly2.tags) ? runOnly2.tags : [];
      // tags are already lowercase
      if (tags.includes('wcag2aaa') || tags.includes('wcag22aaa') || tags.includes('wcag21aaa'))
        return 'AAA';
      if (tags.includes('wcag2aa') || tags.includes('wcag22aa') || tags.includes('wcag21aa'))
        return 'AA';
      if (tags.includes('wcag2a') || tags.includes('wcag22a') || tags.includes('wcag21a'))
        return 'A';
      return null; // if not specified, don't filter composites (back-compat)
    }

    function normalizeLevel(s) {
      const v = typeof s === 'string' ? s.trim().toUpperCase() : '';
      return v === 'A' || v === 'AA' || v === 'AAA' ? v : null;
    }

    function isAllowedByTargetLevel(compositeLevel, targetLevel) {
      if (!targetLevel) return true;
      const c = LEVEL_RANK[compositeLevel];
      const t = LEVEL_RANK[targetLevel];
      if (!c || !t) return false; // unknown level => safest: exclude
      return c <= t;
    }

    const targetLevel = inferTargetLevelFromRunOnly(runOnly);

    // Severity rollup (deterministic)
    const SEVERITY_RANK = { minor: 1, moderate: 2, serious: 3, critical: 4 };

    function normalizeSeverity(s) {
      const v = typeof s === 'string' ? s.trim().toLowerCase() : '';
      return SEVERITY_RANK[v] ? v : null;
    }

    function maxSeverity(a, b) {
      if (!a) return b || null;
      if (!b) return a || null;
      return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a;
    }

    // Index atomic results by ruleId (deterministic)
    const byRuleId = Object.create(null);
    for (const rr of checksResults) {
      if (rr && typeof rr === 'object' && typeof rr.ruleId === 'string' && rr.ruleId) {
        byRuleId[rr.ruleId] = rr;
      }
    }

    function isNonEmptyString(s) {
      return typeof s === 'string' && !!s.trim();
    }

    function buildCompositeDef(entry) {
      if (!entry || typeof entry !== 'object') return null;

      const ruleId = isNonEmptyString(entry.id) ? entry.id.trim() : String(entry.id || '').trim();
      if (!ruleId) return null;

      const metaIn =
        entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
          ? entry.meta
          : {};

      const titleKey =
        typeof metaIn.titleKey === 'string' && metaIn.titleKey.trim() ? metaIn.titleKey.trim() : '';
      const descriptionKey =
        typeof metaIn.descriptionKey === 'string' && metaIn.descriptionKey.trim()
          ? metaIn.descriptionKey.trim()
          : '';

      const wcagSc = Array.isArray(metaIn.wcagSc)
        ? metaIn.wcagSc
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const tags = [];
      tags.push(String(ENGINE_TAG || 'a11ycore').toLowerCase());
      tags.push('composite');
      // A standard's own rollup (one per requirement, say) carries its rule tag,
      // which makes it opt-in the same way as that standard's rules.
      if (Array.isArray(metaIn.tags)) {
        for (const t of metaIn.tags) {
          const tag = String(t).trim().toLowerCase();
          if (tag && !tags.includes(tag)) tags.push(tag);
        }
      }
      const ownStandard =
        typeof metaIn.standard === 'string' && metaIn.standard.trim()
          ? metaIn.standard.trim()
          : null;

      // Fixed WCAG-version-introduction lists (2.1 and 2.2 additions only -- every other
      // SC, including all pre-2.1 ones, is WCAG 2.0 baseline). Keep in sync with
      // src/coverage/wcag-version-map.js (the canonical copy the rule-authoring
      // consistency test checks against) -- this one has to stay a self-contained
      // literal since runCore is inlined via .toString() with no module access at runtime.
      const WCAG21_NEW_SCS = [
        '1.3.4',
        '1.3.5',
        '1.3.6',
        '1.4.10',
        '1.4.11',
        '1.4.12',
        '1.4.13',
        '2.1.4',
        '2.2.6',
        '2.3.3',
        '2.5.1',
        '2.5.2',
        '2.5.3',
        '2.5.4',
        '2.5.5',
        '2.5.6',
        '4.1.3'
      ];
      const WCAG22_NEW_SCS = [
        '2.4.11',
        '2.4.12',
        '2.4.13',
        '2.5.7',
        '2.5.8',
        '3.2.6',
        '3.3.7',
        '3.3.8',
        '3.3.9'
      ];
      const isWcag22Sc = wcagSc.some((sc) => WCAG22_NEW_SCS.includes(sc));
      const isWcag21Sc = !isWcag22Sc && wcagSc.some((sc) => WCAG21_NEW_SCS.includes(sc));
      const versionTagPrefix = isWcag22Sc ? 'wcag22' : isWcag21Sc ? 'wcag21' : 'wcag2';

      const lvl = typeof metaIn.level === 'string' ? metaIn.level.trim().toUpperCase() : '';
      if (lvl === 'A') {
        tags.push(versionTagPrefix + 'a');
      } else if (lvl === 'AA') {
        tags.push(versionTagPrefix + 'a', versionTagPrefix + 'aa');
      } else if (lvl === 'AAA') {
        tags.push(versionTagPrefix + 'a', versionTagPrefix + 'aa', versionTagPrefix + 'aaa');
      }

      // Build normativeMappings so downstream consumers (like adapters) can derive WCAG SC/level
      const normativeMappingsFromMeta = wcagSc.map((sc) => {
        const m = { standard: 'WCAG', requirement: sc };
        if (lvl === 'A' || lvl === 'AA' || lvl === 'AAA') m.level = lvl;
        return m;
      });
      // Other standards' entries for those criteria, precomputed at build time
      // into meta.standardMappings (scripts/build-core.js, from the registry in
      // src/coverage/standards.js), since this function is inlined and cannot
      // load the tables itself.
      if (Array.isArray(metaIn.standardMappings)) {
        for (const m of metaIn.standardMappings) {
          if (m && typeof m === 'object' && !Array.isArray(m))
            normativeMappingsFromMeta.push({ ...m });
        }
      }

      const checksIds = Array.isArray(entry.checksIds)
        ? entry.checksIds
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      return {
        ruleId,
        title: metaIn.title || ruleId,
        description: metaIn.description || '',

        i18n:
          titleKey || descriptionKey
            ? { titleKey: titleKey || '', descriptionKey: descriptionKey || '' }
            : null,

        helpUrl: '',
        tags,

        normativeMappings: normativeMappingsFromMeta,

        defaultSeverity: 'serious',
        defaultConfidence: 'medium',
        type: 'automatic',
        coverage: null,

        ruleInterfaceVersion: '1.0.0',
        ruleVersion: '0.0.0',
        normative: true,
        atomic: false,
        deprecated: false,
        deprecation: null,
        category: null,
        standard: ownStandard,
        applicability: '',
        expectation: '',
        references: [],
        requirements: null,
        mappings: null,

        // optional catalog meta passthrough
        data: {
          details: {
            kind: 'compositeRule',
            ...(ownStandard
              ? {
                  standard: ownStandard,
                  version: metaIn.version || null,
                  criterion: metaIn.criterion || null
                }
              : {}),
            wcagSc,
            level:
              typeof metaIn.level === 'string' && metaIn.level.trim() ? metaIn.level.trim() : null
          }
        },

        __checksIds: checksIds
      };
    }

    for (let i = 0; i < composites.length; i++) {
      const entry = composites[i];
      const cDef0 = buildCompositeDef(entry);
      if (!cDef0) continue;

      // Conformance-level gate: if scan is AA, suppress AAA composites even if tags match
      const compositeLevel =
        cDef0 && cDef0.data && cDef0.data.details && normalizeLevel(cDef0.data.details.level);

      // The WCAG level gate applies to WCAG rollups only; a standard's own
      // rollup has no WCAG level and is selected by its tag instead.
      if (!cDef0.standard && !isAllowedByTargetLevel(compositeLevel, targetLevel)) continue;

      // Localize title/description (uses def.i18n.* keys)
      const cDefResolved = resolveRuleDefI18n(cDef0, engineOptionsResolved);

      // Apply same selection logic to composites
      if (!ruleMatchesRunOnly(cDefResolved, runOnly, ENGINE_TAG)) continue;

      // Under a standard's profile, that standard's own rollups are the
      // profile's version only.
      const details = cDef0.data && cDef0.data.details;
      if (!rollupInProfileVersion(cDef0.standard, details && details.version, runOnly)) continue;

      const checksIds = Array.isArray(cDef0.__checksIds) ? cDef0.__checksIds : [];

      // rollup metrics (stable order)
      let failCount = 0;
      let cantTellCount = 0;
      let notApplicableCount = 0;
      let passCount = 0;
      let missingCount = 0;

      const contributors = [];

      let rolledFailSeverity = null; // max severity among FAIL contributors
      let rolledCantTellSeverity = null; // max severity among CANTTELL contributors (optional)

      for (let j = 0; j < checksIds.length; j++) {
        const tid = checksIds[j];
        const child = tid ? byRuleId[tid] : null;

        if (!child) {
          missingCount += 1;
          contributors.push({ testId: tid, outcome: 'missing' });
          continue;
        }

        const out = child.outcome;
        const childSev = normalizeSeverity(child && child.severity);

        contributors.push({ testId: tid, outcome: out, severity: childSev || null });

        if (out === 'fail' && childSev) {
          rolledFailSeverity = maxSeverity(rolledFailSeverity, childSev);
        } else if (out === 'cantTell' && childSev) {
          rolledCantTellSeverity = maxSeverity(rolledCantTellSeverity, childSev);
        }

        if (out === 'fail') failCount += 1;
        else if (out === 'cantTell') cantTellCount += 1;
        else if (out === 'notApplicable') notApplicableCount += 1;
        else if (out === 'pass') passCount += 1;
      }

      // outcome precedence:
      // fail if any fail
      // cantTell if any cantTell OR missing and none fail
      // notApplicable if all notApplicable (and there is at least one test)
      // pass otherwise
      let outcome = 'pass';
      let reasonCode = 'composite.rollup.pass.otherwise';

      if (failCount > 0) {
        outcome = 'fail';
        reasonCode = 'composite.rollup.fail.anyFail';
      } else if (cantTellCount > 0) {
        outcome = 'cantTell';
        reasonCode = 'composite.rollup.cantTell.anyCantTell';
      } else if (missingCount > 0) {
        outcome = 'cantTell';
        reasonCode = 'composite.rollup.cantTell.missingChild';
      } else if (checksIds.length > 0 && notApplicableCount === checksIds.length) {
        outcome = 'notApplicable';
        reasonCode = 'composite.rollup.notApplicable.allInapplicable';
      } else if (checksIds.length === 0) {
        outcome = 'cantTell';
        reasonCode = 'composite.rollup.cantTell.emptyComposite';
      }

      const raw = {
        outcome,
        occurrences: [],

        // REQUIRED by your reporting schema (top-level)
        summaryKey: 'Composite rule rollup',
        i18nKey: 'composite_rollup_summary',
        i18nParams: { reasonCode, testCount: String(checksIds.length) },

        // REQUIRED by your reporting schema (machine-readable payload)
        data: {
          details: {
            reasonCode,
            ...(cDef0.standard
              ? {
                  standard: cDef0.data.details.standard,
                  version: cDef0.data.details.version,
                  criterion: cDef0.data.details.criterion
                }
              : {}),
            checksIds: checksIds.slice(),
            contributors,
            metrics: {
              failCount,
              cantTellCount,
              notApplicableCount,
              passCount,
              missingCount
            }
          }
        },

        engineOptions: {
          ...(engineOptionsResolved || {}),
          locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
        }
      };

      // Promote composite severity based on contributors (deterministic).
      // - If composite fails: use max severity among failing children.
      // - If composite cantTell: use max severity among cantTell children (fallback to failing if you prefer).
      if (outcome === 'fail' && rolledFailSeverity) {
        raw.severity = rolledFailSeverity;
      } else if (outcome === 'cantTell' && rolledCantTellSeverity) {
        raw.severity = rolledCantTellSeverity;
      }

      const rolled = normalizeRuleResult(cDefResolved, raw, SCHEMA_VERSION, policy, sharedHelpers);

      // A standard mapped rule by rule is named on the rollup only for
      // the rules that produced its outcome: the failing ones for a fail, the
      // undecided ones for cantTell, the passing ones for a pass, none for
      // notApplicable. The rollup's catalog entry lists every rule's tests,
      // most of which say nothing about this page.
      const deciding = outcome === 'notApplicable' ? null : outcome;
      const ruleMapped = Array.isArray(RULE_MAPPED_STANDARDS) ? RULE_MAPPED_STANDARDS : [];
      if (ruleMapped.length && rolled.meta && Array.isArray(rolled.meta.normativeMappings)) {
        const keyOf = (m) => m.standard + '|' + m.version + '|' + m.requirement;
        const produced = new Set();
        for (const tid of checksIds) {
          const child = byRuleId[tid];
          if (!child || child.outcome !== deciding || !child.meta) continue;
          for (const m of child.meta.normativeMappings || []) {
            if (m && ruleMapped.includes(m.standard)) produced.add(keyOf(m));
          }
        }
        // A requirement that restates the WCAG criterion is named whatever decided.
        const restated = (m) => {
          const prefixes =
            RESTATED_PREFIXES && Object.prototype.hasOwnProperty.call(RESTATED_PREFIXES, m.standard)
              ? RESTATED_PREFIXES[m.standard]
              : [];
          return prefixes.some((p) => String(m.requirement).indexOf(p) === 0);
        };
        rolled.meta.normativeMappings = rolled.meta.normativeMappings.filter(
          (m) => !m || !ruleMapped.includes(m.standard) || restated(m) || produced.has(keyOf(m))
        );
      }

      rulesResults.push(rolled);
    }
  } catch {
    // no-throws: omit rulesResults if anything goes wrong
  }

  return rulesResults;
}

/**
 * The conditions the page was rendered under, read from the page itself.
 *
 * A rule that measures the layout (text spacing, target size) can give
 * another outcome for the same markup at another viewport width, or while
 * the web fonts are still loading. Reporting them is what makes such a
 * finding reproducible. It reads input, as reading the DOM does, so the
 * same page rendered the same way still gives the same result.
 *
 * Without a layout (jsdom, any DOM emulator) a viewport or a colour scheme
 * describes nothing that was measured, so only `layout: false` is reported.
 */
function readRenderingEnvironment(win, doc) {
  const dom = createSafeDom();
  let layout;
  try {
    const root = doc && dom.documentElement(doc);
    const rects =
      root && typeof dom.get(root, 'getClientRects') === 'function'
        ? dom.getClientRects(root)
        : null;
    layout = !!(
      win &&
      rects &&
      rects.length > 0 &&
      typeof dom.get(doc, 'createRange') === 'function'
    );
  } catch {
    layout = false;
  }
  if (!layout) return { layout: false };

  const env = { layout: true };
  const width = Number(win.innerWidth);
  const height = Number(win.innerHeight);
  if (Number.isFinite(width) && Number.isFinite(height)) env.viewport = { width, height };
  const dpr = Number(win.devicePixelRatio);
  if (Number.isFinite(dpr) && dpr > 0) env.devicePixelRatio = dpr;
  try {
    if (typeof win.matchMedia === 'function') {
      env.colorScheme = dom.get(win.matchMedia('(prefers-color-scheme: dark)'), 'matches')
        ? 'dark'
        : 'light';
    }
  } catch {}
  // Whether a font face is still loading, asked of each face rather than of
  // document.fonts.status: Chromium reports the set as loading for a while
  // after a style sheet adds a cascade layer, as text-spacing-content-loss
  // does, while every face is loaded and nothing is fetched. A second scan
  // straight after a first would otherwise say its fonts were loading.
  try {
    const fonts = dom.fonts(doc);
    if (fonts && typeof fonts.forEach === 'function') {
      let loading = false;
      fonts.forEach((face) => {
        if (face && face.status === 'loading') loading = true;
      });
      env.fonts = loading ? 'loading' : 'loaded';
    }
  } catch {}
  // Whether an image is still loading, for the same reason: the box it
  // arrives in can move what a layout rule measured. An image loaded lazily
  // (loading="lazy") is left out, since it waits for the reader to scroll
  // and may never load in a scan. Queried rather than read from
  // document.images, which is a live collection.
  try {
    if (typeof dom.get(doc, 'querySelectorAll') === 'function') {
      let loading = false;
      for (const img of dom.querySelectorAll(doc, 'img')) {
        const lazy = String(dom.getAttribute(img, 'loading') || '').toLowerCase() === 'lazy';
        if (!img.complete && !lazy) loading = true;
      }
      env.images = loading ? 'loading' : 'loaded';
    }
  } catch {}
  return env;
}

/**
 * Moves each running animation and transition to a fixed point for the scan,
 * then back to exactly where it was.
 *
 * A scan reads the page as it is at that moment, so a rule measuring a
 * fade-in or a marquee gave another outcome on every run: text measured at
 * 20% opacity failed contrast, and text-spacing-content-loss compared boxes
 * that had scrolled. A finite animation is moved to its end, the state the
 * page settles in; an infinite one (a marquee, a blinking cursor) to its
 * start, a state it returns to. Neither can be told apart from the page at
 * rest any other way, and the result no longer depends on when the scan ran.
 *
 * Only currentTime is set: a scan is one synchronous task, during which no
 * animation's time advances, so setting it back afterwards restores the
 * animation exactly, and the browser never paints the moved state. pause()
 * and play() are not used, since play() on a CSS animation would pin it as
 * playing over a later animation-play-state from the page. Animations on
 * another timeline (scroll-driven) are not time-based and are left alone.
 * Without getAnimations (jsdom) there is nothing to settle.
 */
function settleAnimations(doc) {
  const dom = createSafeDom();
  let animations = [];
  try {
    if (doc && typeof dom.get(doc, 'getAnimations') === 'function')
      animations = dom.getAnimations(doc);
  } catch {
    animations = [];
  }
  const moved = [];
  for (const anim of animations) {
    try {
      if (!anim || anim.playState !== 'running') continue;
      if (dom.timeline(anim) && dom.timeline(doc) && dom.timeline(anim) !== dom.timeline(doc))
        continue;
      const currentTime = anim.currentTime;
      if (typeof currentTime !== 'number') continue;
      const timing =
        anim.effect && typeof anim.effect.getComputedTiming === 'function'
          ? anim.effect.getComputedTiming()
          : null;
      const end = timing ? Number(timing.endTime) : NaN;
      const forward = !(Number(anim.playbackRate) < 0);
      anim.currentTime = Number.isFinite(end) && forward ? end : 0;
      moved.push({ anim, currentTime });
    } catch {}
  }
  return {
    count: moved.length,
    restore() {
      for (const { anim, currentTime } of moved) {
        try {
          anim.currentTime = currentTime;
        } catch {}
      }
    }
  };
}

/**
 * engineOptions.customRules, checked as a scan checks them: the valid rules'
 * definitions (by id, in the catalog's shape) and implementations, the
 * entries that are not valid with the reason, and the built-in ids the
 * valid ones override. Shared by the scan and the catalog functions
 * (getChecksCatalog, getCheckDefById, getChecksForRunOnly), so both list
 * the same rules. Logs nothing; the scan says what it skipped.
 */
function resolveCustomRules(customRules, CHECK_DEFS, COMPOSITE_RULES, ENGINE_TAG) {
  const defs = new Map();
  const impls = {};
  const skipped = [];
  const overriddenBuiltinIds = [];
  const raw = Array.isArray(customRules) ? customRules : [];

  function reviveRuleFn(value) {
    if (typeof value === 'function') return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        const fn = new Function('return (' + value + ')')();
        if (typeof fn === 'function') return fn;
      } catch {}
      // A method's source, from a method shorthand or a class
      // (`runInPage(ctx) {...}`, `async runInPage(ctx) {...}`), is not an
      // expression on its own; inside an object literal it is.
      try {
        const holder = new Function('return ({' + value + '})')();
        const keys = holder && typeof holder === 'object' ? Object.keys(holder) : [];
        const desc = keys.length === 1 ? Object.getOwnPropertyDescriptor(holder, keys[0]) : null;
        if (desc && typeof desc.value === 'function') return desc.value;
      } catch {}
    }
    return null;
  }

  const skip = (id, reason) => skipped.push({ id: id || null, reason });

  for (const c of raw) {
    if (!c || typeof c !== 'object') {
      skip('', 'not an object');
      continue;
    }
    const ruleId = typeof c.id === 'string' ? c.id.trim() : '';
    if (!ruleId) {
      skip('', 'no id');
      continue;
    }
    // A second rule with the same id would silently replace the first; a
    // composite's id would put one id in both checksResults and
    // rulesResults.
    if (defs.has(ruleId)) {
      skip(ruleId, 'another custom rule already has this id');
      continue;
    }
    if (
      Array.isArray(COMPOSITE_RULES) &&
      COMPOSITE_RULES.some((x) => x && typeof x === 'object' && x.id === ruleId)
    ) {
      skip(ruleId, "the id is a composite rule's");
      continue;
    }
    // An invalid custom rule is skipped, not a crash.
    const runFn = reviveRuleFn(c.runInPage);
    if (typeof runFn !== 'function') {
      skip(
        ruleId,
        typeof c.runInPage === 'string'
          ? 'runInPage source could not be turned back into a function'
          : 'runInPage is not a function'
      );
      continue;
    }

    const applicabilityFn = reviveRuleFn(c.applicability);
    let normalizedMeta;
    try {
      normalizedMeta = normalizeRuleMeta(ruleId, ruleId, c.meta, ENGINE_TAG);
    } catch (e) {
      skip(ruleId, 'invalid meta: ' + String((e && e.message) || e));
      continue;
    }

    if (CHECK_DEFS.some((d) => d && d.ruleId === ruleId)) overriddenBuiltinIds.push(ruleId);

    defs.set(ruleId, {
      ruleId,
      title: normalizedMeta.title,
      description: normalizedMeta.description,
      i18n: normalizedMeta.i18n,
      helpUrl: normalizedMeta.helpUrl,
      tags: normalizedMeta.tags,
      wcagSc: normalizedMeta.wcagSc,
      normativeMappings: normalizedMeta.normativeMappings,
      defaultSeverity: normalizedMeta.defaultSeverity,
      defaultConfidence: normalizedMeta.defaultConfidence,
      type: normalizedMeta.type,
      coverage: normalizedMeta.coverage,
      data: c.data === undefined ? null : c.data,
      ruleInterfaceVersion: normalizedMeta.ruleInterfaceVersion,
      ruleVersion: normalizedMeta.ruleVersion,
      normative: normalizedMeta.normative,
      atomic: normalizedMeta.atomic,
      deprecated: normalizedMeta.deprecated,
      deprecation: normalizedMeta.deprecation,
      category: normalizedMeta.category,
      standard: normalizedMeta.standard,
      applicability: normalizedMeta.applicability,
      expectation: normalizedMeta.expectation,
      references: normalizedMeta.references,
      requirements: normalizedMeta.requirements,
      mappings: normalizedMeta.mappings,
      margin: normalizedMeta.margin
    });
    impls[ruleId] = { run: runFn, applicability: applicabilityFn || null };
  }

  return { defs, impls, skipped, overriddenBuiltinIds };
}

function runCore(
  pageUrl,
  contextSelector,
  engineOptions,
  runOnly,
  CHECK_DEFS,
  RULE_IMPLS,
  ENGINE_TAG,
  SCHEMA_VERSION,
  COMPOSITE_RULES
) {
  // Plain reads unless this page has an element named after a DOM property,
  // which could override what the engine reads (src/core/safe-dom.js).
  const restoreDomProtection = createSafeDom().protectFor(
    typeof document !== 'undefined' ? document : null
  );
  try {
    const settled = settleAnimations(typeof document !== 'undefined' ? document : null);
    try {
      const result = runCoreSettled(
        pageUrl,
        contextSelector,
        engineOptions,
        runOnly,
        CHECK_DEFS,
        RULE_IMPLS,
        ENGINE_TAG,
        SCHEMA_VERSION,
        COMPOSITE_RULES
      );
      try {
        const env = result && result.engine && result.engine.environment;
        if (env && env.layout) env.animationsSettled = settled.count;
      } catch {}
      return result;
    } finally {
      settled.restore();
    }
  } finally {
    restoreDomProtection();
  }
}

function runCoreSettled(
  pageUrl,
  contextSelector,
  engineOptions,
  runOnly,
  CHECK_DEFS,
  RULE_IMPLS,
  ENGINE_TAG,
  SCHEMA_VERSION,
  COMPOSITE_RULES
) {
  const dom = createSafeDom();
  // Normalize contrast options without mutating caller-provided engineOptions.
  function __normalizeContrastOptions(engineOptions2) {
    const eo = engineOptions2 && typeof engineOptions2 === 'object' ? engineOptions2 : {};
    const c = eo.contrast && typeof eo.contrast === 'object' ? eo.contrast : {};
    const mode = c.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
    const rootCanvasFallback =
      typeof c.rootCanvasFallback === 'string' && c.rootCanvasFallback.trim()
        ? c.rootCanvasFallback.trim()
        : '#ffffff';
    return { mode, rootCanvasFallback };
  }

  const engineOptionsResolved =
    engineOptions && typeof engineOptions === 'object'
      ? { ...engineOptions, contrast: __normalizeContrastOptions(engineOptions) }
      : { contrast: __normalizeContrastOptions(null) };

  const policy = resolvePolicy(POLICY_CONTRACTS, engineOptionsResolved);

  // contextSelector accepts a single selector string (which may itself be a
  // comma-separated selector list -- ordinary CSS union semantics) OR an
  // array of selector strings for scanning multiple, possibly disjoint
  // regions in one run. Both forms resolve via querySelectorAll, not
  // querySelector, so "matches this selector" means all matches, not just
  // the first. Shared with frame-scan.js (same resolution used to discover
  // which child <iframe>/<frame> elements fall within the same scan scope).
  // An unparseable selector throws here, before any rule runs.
  const { ctxSelector, roots, unmatchedSelectors } = resolveContextRoots(document, contextSelector);
  // Reported on the result whenever a selector was given, so a caller can
  // tell a scope that matched nothing (every rule notApplicable) from a clean
  // scan of what it asked for.
  const contextMatch = ctxSelector
    ? { elementCount: roots.length, unmatchedSelectors: unmatchedSelectors.slice() }
    : null;
  const scopeIsEmpty = !!contextMatch && contextMatch.elementCount === 0;
  if (scopeIsEmpty) {
    try {
      console.warn(
        '[surea11y] contextSelector matched no element (' +
          unmatchedSelectors.map((s) => '"' + s + '"').join(', ') +
          '); nothing was scanned and every rule reports notApplicable.'
      );
    } catch {}
  }

  // Default on: opt OUT with `includeShadowDom: false`, not opt in.
  const includeShadowDom = !(
    engineOptionsResolved && engineOptionsResolved.includeShadowDom === false
  );
  // Default off: hidden/collapsed content is excluded from rule evaluation
  // unless the caller explicitly opts in.
  const includeHiddenElements = !!(
    engineOptionsResolved && engineOptionsResolved.includeHiddenElements === true
  );
  const excludeSelectors = normalizeSelectorList(
    engineOptionsResolved && engineOptionsResolved.excludeSelectors
  );
  // Default off: explicit opt-in for "this scan target was never meant to
  // represent a real page" -- see helpers.isWholeDocumentScope().
  const fragment = !!(engineOptionsResolved && engineOptionsResolved.fragment === true);

  // An option of the wrong type is ignored, and said so: read as if it
  // were missing, it would change the result without a word.
  function warnIgnoredOption(name, value, expected, fallback) {
    try {
      console.warn(
        '[surea11y] ' +
          name +
          ': ignoring ' +
          describeOptionValue(value) +
          '; ' +
          expected +
          '. ' +
          fallback
      );
    } catch {}
  }

  if (pageUrl != null && typeof pageUrl !== 'string') {
    warnIgnoredOption('pageUrl', pageUrl, 'pass a string', "The result's url is the document's.");
  }
  const url =
    (typeof pageUrl === 'string' && pageUrl) ||
    (document.location && document.location.href) ||
    null;
  const title = dom.get(document, 'title') || null;
  // Deterministic timestamp: only use host-provided value (no time-based logic).
  const rawTimestamp = engineOptionsResolved && engineOptionsResolved.timestamp;
  if (rawTimestamp != null && typeof rawTimestamp !== 'string') {
    warnIgnoredOption(
      'engineOptions.timestamp',
      rawTimestamp,
      'pass a string, such as new Date().toISOString()',
      "The result's timestamp is null."
    );
  }
  const timestamp =
    typeof rawTimestamp === 'string' && rawTimestamp.trim() ? rawTimestamp.trim() : null;

  // Read before any rule runs: some change the page while they measure it.
  const environment = readRenderingEnvironment(dom.defaultView(document) || window, document);

  // createDomHelpers()/createContrastHelpers() persist their element-keyed
  // caches (outerHtmlCache, selectorCache, etc.) on window.__a11ycoreSharedCache
  // so multiple helper instances created *within this run* can share them
  // deterministically. But a window/document is frequently reused across
  // SEPARATE runs -- e.g. Jest's jsdom environment creates one window per
  // test file, and mutating document.body between it() blocks is standard.
  // Those caches are keyed by element reference, not content, so a run that
  // reuses an already-cached element (document.body never changes identity)
  // would otherwise read stale data cached by an earlier, unrelated run on
  // the same window. Clearing at the start of every run keeps sharing scoped
  // to "this run" as intended, without leaking across runs.
  try {
    if (window && window.__a11ycoreSharedCache) window.__a11ycoreSharedCache = {};
  } catch {}

  const sharedHelpers = createDomHelpers({
    document,
    window,
    root: roots,
    includeShadowDom,
    includeHiddenElements,
    excludeSelectors,
    fragment,
    // Optional perf counters (bench/debug only). Deterministic and per-run.
    perfStats: !!(engineOptionsResolved && engineOptionsResolved.perfStats)
  });

  const profileRules = !!(engineOptionsResolved && engineOptionsResolved.profileRules);
  const ruleTimings = profileRules ? Object.create(null) : null;

  function nowMs() {
    // performance.now() if available, else Date.now()
    try {
      if (
        typeof performance !== 'undefined' &&
        performance &&
        typeof performance.now === 'function'
      ) {
        return performance.now();
      }
    } catch {}
    return Date.now();
  }

  // =========================
  // Probes (optional evidence fed by the host app)
  // Keep deterministic + serializable + no-throws.
  // =========================
  function sanitizeProbeValue(v, depth) {
    // depth-bounded, JSON-safe sanitizer
    if (depth <= 0) return null;
    if (v == null) return null;

    const t = typeof v;
    if (t === 'string') return v.length > 2000 ? v.slice(0, 2000) : v;
    if (t === 'number') return Number.isFinite(v) ? v : null;
    if (t === 'boolean') return v;
    if (t === 'function') return null;

    if (Array.isArray(v)) {
      // cap arrays to avoid huge payloads
      const out = [];
      const n = Math.min(v.length, 200);
      for (let i = 0; i < n; i++) out.push(sanitizeProbeValue(v[i], depth - 1));
      return out;
    }

    if (t === 'object') {
      const out = {};
      const keys = Object.keys(v).sort();
      // cap object keys
      const n = Math.min(keys.length, 50);
      for (let i = 0; i < n; i++) {
        const k = keys[i];
        // only allow string keys
        if (typeof k !== 'string') continue;
        out[k] = sanitizeProbeValue(v[k], depth - 1);
      }
      return out;
    }

    return null;
  }

  let probes;
  try {
    const rawProbes =
      engineOptionsResolved && typeof engineOptionsResolved.probes === 'object'
        ? engineOptionsResolved.probes
        : null;
    probes = rawProbes ? sanitizeProbeValue(rawProbes, 6) : null;
    if (!probes || typeof probes !== 'object' || Array.isArray(probes)) probes = null;
  } catch {
    probes = null;
  }

  // =========================
  // Runtime custom rules (engineOptions.customRules)
  // =========================
  // Same module shape as an internal rule file: { id, meta, runInPage, applicability?, data? }.
  // runInPage/applicability may be a real function (fine for same-realm/Node/jsdom callers)
  // or a function-source string (required for cross-realm callers, e.g. a Playwright
  // page.evaluate(runa11yCoreInPage, { engineOptions }) call -- engineOptions crosses a
  // structured-clone/JSON boundary there, so a live Function reference can't survive it,
  // but a string can). Reconstructed via `new Function`, matching exactly how build-core.js
  // already embeds each built-in rule's own runInPage source into the in-page runner.
  // Scan-scoped only (not added to the static CHECK_DEFS/getRulesCatalog()
  // catalog) -- matches surea11y's "fresh engineOptions per call, no
  // mutable global config" design (see ROADMAP.md).
  let effectiveCheckDefs = CHECK_DEFS;
  let effectiveRuleImpls = RULE_IMPLS;
  // Custom rules that were not run, and why: { id, reason }.
  const skippedCustomRules = [];
  const customRuleIds = new Set();
  const resolvedCustom = resolveCustomRules(
    engineOptionsResolved.customRules,
    CHECK_DEFS,
    COMPOSITE_RULES,
    ENGINE_TAG
  );
  for (const skipped of resolvedCustom.skipped) {
    skippedCustomRules.push(skipped);
    try {
      console.warn(
        '[surea11y] customRules: skipped ' +
          (skipped.id ? 'rule "' + skipped.id + '"' : 'a rule') +
          ' (' +
          skipped.reason +
          '); the rest of the scan runs as usual.'
      );
    } catch {}
  }
  const overriddenBuiltinIds = resolvedCustom.overriddenBuiltinIds;
  for (const id of resolvedCustom.defs.keys()) customRuleIds.add(id);
  if (resolvedCustom.defs.size) {
    effectiveCheckDefs = CHECK_DEFS.filter((d) => !resolvedCustom.defs.has(d.ruleId)).concat(
      Array.from(resolvedCustom.defs.values())
    );
    effectiveRuleImpls = { ...RULE_IMPLS, ...resolvedCustom.impls };
  }
  if (overriddenBuiltinIds.length) {
    // Overriding a built-in rule id is supported (see docs/ENGINE_OPTIONS.md),
    // but a same-named custom rule is just as likely to be an accidental
    // collision (a generic name like "region" or "tabindex" picked without
    // realizing it's already a built-in id) as a deliberate override -- so
    // surface it either way rather than silently swapping the rule out.
    try {
      console.warn(
        '[surea11y] customRules overriding built-in rule id(s) for this scan: ' +
          overriddenBuiltinIds.join(', ')
      );
    } catch {}
  }

  // =========================
  // WCAG version scoping
  // =========================
  // Every WCAG version so far is additive except for one criterion: 4.1.1
  // Parsing, which 2.2 removed. A rule mapped only to a removed criterion
  // still reports something real -- a duplicate id breaks `<label for>`,
  // fragment links and getElementById whatever the standard says -- but it
  // cannot be a conformance FAILURE under a target version that no longer
  // contains the criterion. So the rule keeps running and its fail is
  // coerced to cantTell there: the finding stays visible for human review
  // instead of gating a 2.2 run, and nobody has to remember to exclude it.
  //
  // Resolution order: an explicit engineOptions.wcagVersion, then whatever
  // the caller's own version tag set implies (the ready-made sets in
  // docs/ENGINE_OPTIONS.md), then this engine's default target of 2.2.
  const WCAG_REMOVED_SC_TAG = 'wcag22-removed';
  const DEFAULT_WCAG_VERSION = '2.2';

  function normalizeWcagVersion(v) {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '2.0' || s === '2.1' || s === '2.2' ? s : null;
  }

  // Only the nine version-origin tags carry version intent. An SC tag
  // (`wcag411`), a level tag on its own or `best-practice` says nothing
  // about which version the caller is conformance-testing against, so a
  // run filtered by those falls through to the default.
  function inferWcagVersionFromRunOnly(runOnly2) {
    // A WCAG target (runOnly.wcag) names its version.
    if (runOnly2 && runOnly2.wcag && runOnly2.wcag.version) return runOnly2.wcag.version;
    const tags = runOnly2 && Array.isArray(runOnly2.tags) ? runOnly2.tags : [];
    if (!tags.length) return null;
    if (tags.includes('wcag22a') || tags.includes('wcag22aa') || tags.includes('wcag22aaa'))
      return '2.2';
    if (tags.includes('wcag21a') || tags.includes('wcag21aa') || tags.includes('wcag21aaa'))
      return '2.1';
    if (tags.includes('wcag2a') || tags.includes('wcag2aa') || tags.includes('wcag2aaa'))
      return '2.0';
    return null;
  }

  const requestedWcagVersion = engineOptionsResolved && engineOptionsResolved.wcagVersion;
  const targetWcagVersion =
    normalizeWcagVersion(requestedWcagVersion) ||
    inferWcagVersionFromRunOnly(runOnly) ||
    DEFAULT_WCAG_VERSION;
  if (requestedWcagVersion != null && !normalizeWcagVersion(requestedWcagVersion)) {
    warnIgnoredOption(
      'engineOptions.wcagVersion',
      requestedWcagVersion,
      'use "2.0", "2.1" or "2.2"',
      'The run targets WCAG ' + targetWcagVersion + '.'
    );
  }

  // engineOptions.profile is resolved with the rest of the selection, before
  // runCore (resolveEffectiveRunOnly in scripts/build-core.js). A profile that
  // did not take effect is not an error, matching how other option values
  // fall back, but a caller who asked for a conformance target and silently
  // got a full run would read the result wrongly, so say so.
  const appliedProfile = runOnly && typeof runOnly.profile === 'string' ? runOnly.profile : null;
  // A rule whose behaviour differs between versions of its standard reads
  // which one the run targets here (ctx.standard).
  const runStandard = profileStandardOf(appliedProfile);
  const profileNotApplied = runOnly && runOnly.profileNotApplied;
  const requestedProfile = engineOptionsResolved.profile;
  if (requestedProfile != null && typeof requestedProfile !== 'string') {
    warnIgnoredOption(
      'engineOptions.profile',
      requestedProfile,
      'name a profile with a string, such as "wcag22-aa"',
      'No profile was applied.'
    );
  } else if (profileNotApplied) {
    try {
      console.warn(
        '[surea11y] engineOptions.profile "' +
          String(engineOptionsResolved.profile) +
          '" was not applied: ' +
          (profileNotApplied === 'unknown'
            ? 'no such profile.'
            : 'an include in runOnly (wcag, tags or rule ids) or engineOptions (rules, tags or tests) selects the rules instead.')
      );
    } catch {}
  }

  // engineOptions.optInRules: the opt-in rule tags unlocked for this run.
  // The result names those that added a rule the rest of the selection would
  // not have run (optInRulesRan, filled in the rule loop), so a reader knows
  // the run goes beyond the targeted standard. A WCAG profile unlocks without
  // running any, and a standard's profile runs its rules without the unlock.
  const optInUnlocked =
    runOnly && Array.isArray(runOnly.optInTags) ? runOnly.optInTags.slice() : [];
  const withoutUnlock = optInUnlocked.length ? { ...runOnly, optInTags: [] } : null;
  const optInRulesRan = new Set();
  if (runOnly && Array.isArray(runOnly.optInTagsUnknown) && runOnly.optInTagsUnknown.length) {
    try {
      console.warn(
        '[surea11y] engineOptions.optInRules: ignoring ' +
          runOnly.optInTagsUnknown.map((s) => '"' + s + '"').join(', ') +
          ', no such opt-in rule tag (' +
          (OPT_IN_RULE_TAGS.length
            ? 'use "all" or one of: ' + OPT_IN_RULE_TAGS.join(', ')
            : 'this version has none') +
          ').'
      );
    } catch {}
  }

  // engineOptions.mappings: which standards besides WCAG a result's
  // normativeMappings name. The catalog carries every one of them; a scan
  // result carries only those asked for, or implied by the applied profile.
  const mappingSelection = resolveMappingSelection(engineOptionsResolved, appliedProfile);
  if (mappingSelection.unknown.length) {
    try {
      console.warn(
        '[surea11y] engineOptions.mappings: ignoring ' +
          mappingSelection.unknown.map((s) => '"' + s + '"').join(', ') +
          ', no such standard or version.'
      );
    } catch {}
  }

  function scopeOutcomeToWcagVersion(def, result) {
    if (targetWcagVersion !== '2.2') return result;
    if (!result || typeof result !== 'object' || result.outcome !== 'fail') return result;

    const defTags = def && Array.isArray(def.tags) ? def.tags : [];
    if (!defTags.some((tag) => String(tag).toLowerCase() === WCAG_REMOVED_SC_TAG)) return result;

    const removedSc = def && Array.isArray(def.wcagSc) ? def.wcagSc.slice() : [];

    // Every occurrence becomes cantTell-tier here, so each one states why: the
    // finding stands, the criterion it was made against does not.
    const occurrences = Array.isArray(result.occurrences)
      ? result.occurrences.map((occ) => {
          if (!occ || typeof occ !== 'object' || Array.isArray(occ)) return occ;
          const next =
            occ.occurrenceOutcome === 'fail'
              ? { ...occ, occurrenceOutcome: 'cantTell' }
              : { ...occ };
          if (!next.uncertainty) {
            next.uncertainty = {
              code: 'out-of-scope',
              needed: `Whether this still matters under WCAG ${targetWcagVersion}, which removed the criterion it was found against.`,
              evidence: { removedSc, target: targetWcagVersion, findingStands: true }
            };
          }
          return next;
        })
      : result.occurrences;

    // Deliberately NOT reported through `error`: nothing went wrong here,
    // and consumers read a non-empty `error` as "this rule threw".
    return {
      ...result,
      outcome: 'cantTell',
      occurrences,
      wcagVersionScope: {
        target: targetWcagVersion,
        removedSc,
        coercedFrom: 'fail'
      }
    };
  }

  const checksResults = [];
  // Custom rules the run's selection leaves out, said once after the loop.
  const unselectedCustomRules = [];

  for (const def of effectiveCheckDefs) {
    const t0 = ruleTimings ? nowMs() : 0;
    const defResolved = resolveRuleDefI18n(def, engineOptionsResolved);
    if (!ruleMatchesRunOnly(defResolved, runOnly, ENGINE_TAG)) {
      // An override takes its built-in's place, so it runs wherever the
      // built-in would have, whatever tags it declares; leaving it out
      // would remove the built-in from the run.
      const builtin = overriddenBuiltinIds.includes(def.ruleId)
        ? CHECK_DEFS.find((d) => d && d.ruleId === def.ruleId)
        : null;
      const builtinSelected =
        !!builtin &&
        ruleMatchesRunOnly(resolveRuleDefI18n(builtin, engineOptionsResolved), runOnly, ENGINE_TAG);
      if (!builtinSelected) {
        // A custom rule left out by the selection is listed, not dropped
        // without a trace: under a profile or a WCAG target, a rule tagged
        // best-practice, or with no WCAG tag, is not part of the run.
        if (customRuleIds.has(def.ruleId)) unselectedCustomRules.push(def.ruleId);
        continue;
      }
    }
    if (
      withoutUnlock &&
      Array.isArray(defResolved.tags) &&
      !ruleMatchesRunOnly(defResolved, withoutUnlock, ENGINE_TAG)
    ) {
      for (const t of defResolved.tags) {
        const tag = String(t).toLowerCase();
        if (optInUnlocked.includes(tag)) optInRulesRan.add(tag);
      }
    }

    const implEntry = effectiveRuleImpls[defResolved.ruleId];
    const impl = implEntry && typeof implEntry.run === 'function' ? implEntry.run : null;
    const applicabilityFn =
      implEntry && typeof implEntry.applicability === 'function' ? implEntry.applicability : null;
    if (typeof impl !== 'function') continue;

    const callerConfig =
      engineOptionsResolved &&
      engineOptionsResolved.rules &&
      engineOptionsResolved.rules[defResolved.ruleId]
        ? engineOptionsResolved.rules[defResolved.ruleId]
        : null;
    // A rule's declared settings (contrast-minimum's thresholds) are its
    // standard's, not the caller's: a result that names WCAG 1.4.3 is decided
    // at WCAG's 4.5:1. So a caller's value for one is dropped, and a variant,
    // which is another rule under its own id, supplies its own. The caller's
    // other config (excludeSelectors) still applies.
    const settingNames = Array.isArray(defResolved.settings) ? defResolved.settings : [];
    let ruleConfig = callerConfig;
    if (ruleConfig && settingNames.length) {
      ruleConfig = { ...ruleConfig };
      for (const name of settingNames) delete ruleConfig[name];
    }
    const variant =
      defResolved.variant && typeof defResolved.variant === 'object' ? defResolved.variant : null;
    if (variant && variant.config) ruleConfig = { ...(ruleConfig || {}), ...variant.config };

    // Rule-scoped excludeSelectors (engineOptions.rules[ruleId].excludeSelectors)
    // apply on top of the global excludeSelectors for exactly this rule's
    // applicability check + run, then are cleared once this rule is done.
    // Safe because rule execution below is synchronous and one rule at a
    // time -- sharedHelpers is reused across all rules in this loop.
    if (typeof sharedHelpers.__setActiveRuleExcludeSelectors === 'function') {
      sharedHelpers.__setActiveRuleExcludeSelectors(ruleConfig && ruleConfig.excludeSelectors);
    }

    const ctx = {
      document,
      window,
      root: roots,
      rule: defResolved,
      config: ruleConfig,
      // The standard and version the run's profile targets, or null.
      standard: runStandard,
      helpers: sharedHelpers,
      engineTag: ENGINE_TAG,
      contextSelector: ctxSelector,
      engineOptions:
        engineOptionsResolved && typeof engineOptionsResolved === 'object'
          ? engineOptionsResolved
          : {},

      // Optional evidence channel provided by host app
      inputs: {
        probes
      }
    };

    // A scope that matched nothing has nothing for any rule to judge, the
    // page-level rules included: they would otherwise read the document the
    // caller scoped away from.
    if (scopeIsEmpty) {
      checksResults.push(
        normalizeRuleResult(
          defResolved,
          {
            outcome: 'notApplicable',
            occurrences: [],
            engineOptions: {
              ...(ctx.engineOptions || {}),
              locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
            }
          },
          SCHEMA_VERSION,
          policy,
          sharedHelpers
        )
      );
      if (ruleTimings)
        ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
      continue;
    }

    if (typeof applicabilityFn === 'function') {
      let applicable = true;
      try {
        const res = applicabilityFn(ctx);
        // Rules run synchronously: a Promise is truthy, and would have
        // counted as applicable whatever it resolved to.
        if (res && typeof res.then === 'function') {
          if (typeof res.catch === 'function') res.catch(() => {});
          throw new Error(
            'applicability returned a Promise; rules run synchronously, so it must return a boolean'
          );
        }
        if (typeof res === 'boolean') applicable = res;
        else if (res && typeof res === 'object' && typeof res.applicable === 'boolean')
          applicable = res.applicable;
      } catch (err) {
        const raw = {
          outcome: 'cantTell',
          occurrences: [],
          error: String(err && err.message ? err.message : err),
          engineOptions: {
            ...(ctx.engineOptions || {}),
            locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
          }
        };
        checksResults.push(
          normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers)
        );
        if (ruleTimings)
          ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
        continue;
      }

      if (!applicable) {
        const raw = {
          outcome: 'notApplicable',
          occurrences: [],
          engineOptions: {
            ...(ctx.engineOptions || {}),
            locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
          }
        };
        checksResults.push(
          normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers)
        );
        if (ruleTimings)
          ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
        continue;
      }
    }

    let result;
    try {
      result = impl(ctx);
    } catch (err) {
      result = {
        outcome: 'cantTell',
        occurrences: [],
        error: String(err && err.message ? err.message : err),
        engineOptions: {
          ...(ctx.engineOptions || {}),
          locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
        }
      };
    }

    // A rule that returned nothing usable is reported, not dropped: a
    // missing result would read as a rule that never existed.
    const unusable =
      result && typeof result.then === 'function'
        ? 'runInPage returned a Promise; rules run synchronously, so it must return a result object'
        : !result || typeof result !== 'object'
          ? 'runInPage returned ' +
            (result === null ? 'null' : typeof result) +
            ' instead of a result object'
          : '';
    if (unusable) {
      if (result && typeof result.catch === 'function') result.catch(() => {});
      result = {
        outcome: 'cantTell',
        occurrences: [],
        error: unusable,
        engineOptions: {
          ...(ctx.engineOptions || {}),
          locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
        }
      };
    }
    // A rule's type is its meta's: a different one in its return changes
    // neither how it is judged nor what the result says, and is noted.
    if (result && Object.prototype.hasOwnProperty.call(result, 'type')) {
      const returnedType = result.type;
      result = { ...result };
      delete result.type;
      if (returnedType !== undefined && returnedType !== defResolved.type) {
        result.error =
          (result.error ? String(result.error) + ' | ' : '') +
          'The rule returned type ' +
          JSON.stringify(returnedType) +
          "; a rule's type comes from its meta (" +
          JSON.stringify(defResolved.type) +
          ').';
      }
    }

    // A fail names what failed (a built-in rule's always does). One that
    // names nothing, from a custom rule judging the whole page, is reported
    // on the document element, so every reporter shows it as a failure
    // rather than as a rule that found nothing.
    if (
      result.outcome === 'fail' &&
      !(Array.isArray(result.occurrences) && result.occurrences.length)
    ) {
      result = {
        ...result,
        occurrences: [
          {
            __node: dom.documentElement(document),
            summary: 'The rule failed for the page without naming an element.',
            hint: "Review the page against the rule's description. A custom rule can name the element that fails by reporting it as an occurrence.",
            i18n: {
              summaryKey: 'engine_failWithoutOccurrence_summary',
              hintKey: 'engine_failWithoutOccurrence_hint'
            },
            data: { details: { reasonCode: 'FAIL_WITHOUT_OCCURRENCE' } }
          }
        ]
      };
    }

    // A variant reports in its own words: a message key of its base rule's
    // reads from the variant's prefix instead.
    if (variant && variant.messages && variant.messages.from && variant.messages.to) {
      const from = variant.messages.from + '_';
      const to = variant.messages.to + '_';
      const remap = (key) =>
        typeof key === 'string' && key.indexOf(from) === 0 ? to + key.slice(from.length) : key;
      for (const o of Array.isArray(result.occurrences) ? result.occurrences : []) {
        if (o && o.i18n && typeof o.i18n === 'object') {
          o.i18n.summaryKey = remap(o.i18n.summaryKey);
          o.i18n.hintKey = remap(o.i18n.hintKey);
        }
      }
      if (result.i18n && typeof result.i18n === 'object') {
        result.i18n.summaryKey = remap(result.i18n.summaryKey);
        result.i18n.hintKey = remap(result.i18n.hintKey);
      }
      result.summaryKey = remap(result.summaryKey);
      result.i18nKey = remap(result.i18nKey);
    }
    if (!result.engineOptions) {
      result.engineOptions = {
        ...(ctx.engineOptions || {}),
        locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
      };
    }
    checksResults.push(
      normalizeRuleResult(
        defResolved,
        scopeOutcomeToWcagVersion(defResolved, result),
        SCHEMA_VERSION,
        policy,
        sharedHelpers
      )
    );
    if (ruleTimings)
      ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
  }

  // Composite rollups below carry no occurrences/nodes of their own, so
  // they never exercise rule-scoped excludes -- but clear the "active
  // rule" state on sharedHelpers regardless, so nothing after this point
  // (composite aggregation, perf stats) can observe a stale rule's excludes.
  if (typeof sharedHelpers.__setActiveRuleExcludeSelectors === 'function') {
    sharedHelpers.__setActiveRuleExcludeSelectors(null);
  }

  const rulesResults = rollupCompositeResults(
    checksResults,
    COMPOSITE_RULES,
    runOnly,
    engineOptionsResolved,
    policy,
    sharedHelpers,
    ENGINE_TAG,
    SCHEMA_VERSION
  );

  // A custom rule keeps exactly the mappings it declares; every other result
  // drops the standards this run did not ask for.
  for (const r of checksResults.concat(rulesResults)) {
    if (!r || !r.meta || customRuleIds.has(r.ruleId)) continue;
    r.meta.normativeMappings = filterNormativeMappings(
      r.meta.normativeMappings,
      mappingSelection.tokens
    );
  }

  // Every result echoes the options it ran with, and translation reads its
  // dictionaries from that echo while each result is built. Once all of them
  // are, the dictionaries (engineOptions.messages: a locale side file in the
  // browser bundle, or a caller's own strings) are dropped from the echo: they
  // are data the run read, not a setting, and repeating them on every result
  // made a scan with a loaded locale tens of megabytes. engine.locale says
  // which dictionary the run used.
  // Two more options are echoed as the rules saw them rather than as given,
  // so a result stays plain data that JSON.stringify and structuredClone
  // (postMessage to an extension or a worker) can carry: `probes` as the
  // capped copy rules read (the raw object could be circular, or megabytes
  // repeated on every result), and `customRules` as their ids (the rules'
  // functions cannot be cloned, and their source repeated on every result).
  const rawCustomRules = Array.isArray(engineOptionsResolved.customRules)
    ? engineOptionsResolved.customRules
    : [];
  const echoedCustomRules = rawCustomRules
    .filter((c) => c && typeof c === 'object' && typeof c.id === 'string' && c.id.trim())
    .map((c) => ({ id: c.id.trim() }));
  for (const r of checksResults.concat(rulesResults)) {
    if (!r || !r.engineOptions || typeof r.engineOptions !== 'object') continue;
    const eo = r.engineOptions;
    if (!('messages' in eo) && !('probes' in eo) && !('customRules' in eo)) continue;
    const echoed = { ...eo };
    delete echoed.messages;
    if ('probes' in echoed) echoed.probes = probes;
    if ('customRules' in echoed) echoed.customRules = echoedCustomRules;
    r.engineOptions = echoed;
  }

  // Each rule result names the rollups that group it in this run. An empty
  // list means its findings appear in no rollup, so a consumer that reads only
  // rulesResults would miss them.
  const rollupIdsByRule = Object.create(null);
  for (const rolled of rulesResults) {
    const ids =
      rolled && rolled.data && rolled.data.details && Array.isArray(rolled.data.details.checksIds)
        ? rolled.data.details.checksIds
        : [];
    for (const tid of ids) (rollupIdsByRule[tid] = rollupIdsByRule[tid] || []).push(rolled.ruleId);
  }
  for (const r of checksResults) {
    if (r && typeof r === 'object') r.rollupIds = (rollupIdsByRule[r.ruleId] || []).slice();
  }

  // Optional perf counters passthrough (only when enabled). Deterministic.
  let perfStats = null;
  try {
    if (
      engineOptionsResolved &&
      engineOptionsResolved.perfStats &&
      sharedHelpers &&
      typeof sharedHelpers.getPerfStats === 'function'
    ) {
      perfStats = sharedHelpers.getPerfStats();
    }
  } catch {
    perfStats = null;
  }

  if (ruleTimings) {
    if (perfStats && engineOptionsResolved && engineOptionsResolved.profileRules) {
      perfStats.ruleTimings = ruleTimings; // (whatever your timing map is)
    }
  }

  if (unselectedCustomRules.length) {
    // Naming a rule in runOnly selects instead of a profile, so under one
    // the way in is the profile's own: the tags of the criteria the rule
    // checks, or runOnly.bestPractices for a best-practice rule.
    const selection = appliedProfile ? 'profile "' + appliedProfile + '"' : 'selection';
    const remedy = appliedProfile
      ? "tag it with the WCAG criteria it checks (as 'wcag111'), or add runOnly.bestPractices for a best-practice rule"
      : 'name its id or one of its tags in runOnly';
    for (const id of unselectedCustomRules) {
      skippedCustomRules.push({
        id,
        reason: "not selected by the run's " + selection + '; to run it, ' + remedy + '.'
      });
    }
    try {
      console.warn(
        "[surea11y] customRules: not run, since the run's " +
          selection +
          ' does not select them: ' +
          unselectedCustomRules.join(', ') +
          '. To run one, ' +
          remedy +
          '.'
      );
    } catch {}
  }

  return {
    engine: {
      tag: ENGINE_TAG,
      version: ENGINE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      locale: resolveLocale(engineOptionsResolved),
      wcagVersion: targetWcagVersion,
      ...(appliedProfile ? { profile: appliedProfile } : {}),
      // What the profile left out, when it excludes anything.
      ...(appliedProfile && runOnly && runOnly.profileExcludes
        ? { profileExcludes: runOnly.profileExcludes }
        : {}),
      ...(optInRulesRan.size
        ? { optInRules: optInUnlocked.filter((t) => optInRulesRan.has(t)) }
        : {}),
      ...(mappingSelection.tokens.length ? { mappings: mappingSelection.tokens.slice() } : {}),
      environment
    },
    url,
    title,
    timestamp,
    perfStats,
    contextSelector: ctxSelector,
    contextMatch,
    checksResults,
    rulesResults,
    overriddenBuiltinIds,
    skippedCustomRules
  };
}

module.exports = {
  resolveCustomRules,
  runCore,
  runCoreSettled,
  settleAnimations,
  rollupCompositeResults,
  readRenderingEnvironment
};
