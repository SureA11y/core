'use strict';

// Which way a cantTell finding points, when the page gives evidence for one:
// the answer the evidence makes likely, without claiming it is proven. The
// outcome stays cantTell; a lean is advice a reporter or a CI gate may use.
// Absent where only a person can judge.

const LEAN_DIRECTIONS = Object.freeze(['pass', 'fail']);

// A signal names a fact the rule read ('numeric-cells') and its value, a
// string, number, boolean or null.
const SIGNAL_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function signalValue(v) {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return { ok: true, v };
  if (typeof v === 'number' && Number.isFinite(v)) return { ok: true, v };
  return { ok: false };
}

// Returns null rather than throwing: a malformed lean must not cost the
// occurrence it was attached to, which keeps its cantTell either way.
function normalizeLean(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (LEAN_DIRECTIONS.indexOf(input.toward) === -1) return null;
  if (typeof input.why !== 'string' || !input.why.trim()) return null;

  const out = { toward: input.toward, why: input.why.trim() };

  const signals = [];
  for (const s of Array.isArray(input.signals) ? input.signals : []) {
    if (!s || typeof s !== 'object' || typeof s.signal !== 'string') continue;
    if (!SIGNAL_NAME.test(s.signal)) continue;
    const value = signalValue(s.value === undefined ? null : s.value);
    if (!value.ok) continue;
    signals.push({ signal: s.signal, value: value.v });
  }
  out.signals = signals;

  if (typeof input.caution === 'string' && input.caution.trim()) out.caution = input.caution.trim();

  const m = input.measured;
  if (
    m &&
    typeof m === 'object' &&
    Number.isInteger(m.agreed) &&
    Number.isInteger(m.cases) &&
    m.cases > 0 &&
    m.agreed >= 0 &&
    m.agreed <= m.cases
  ) {
    out.measured = { agreed: m.agreed, cases: m.cases };
    if (typeof m.corpus === 'string' && m.corpus) out.measured.corpus = m.corpus;
    if (typeof m.coreVersion === 'string' && m.coreVersion)
      out.measured.coreVersion = m.coreVersion;
  }

  const i = input.i18n;
  if (i && typeof i === 'object' && !Array.isArray(i)) {
    const ii = {};
    if (typeof i.whyKey === 'string' && i.whyKey) ii.whyKey = i.whyKey;
    if (typeof i.cautionKey === 'string' && i.cautionKey) ii.cautionKey = i.cautionKey;
    if (i.params && typeof i.params === 'object' && !Array.isArray(i.params))
      ii.params = { ...i.params };
    if (ii.whyKey || ii.cautionKey) out.i18n = ii;
  }
  return out;
}

module.exports = { LEAN_DIRECTIONS, SIGNAL_NAME, signalValue, normalizeLean };
