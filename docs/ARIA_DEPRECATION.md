<!-- SPDX-License-Identifier: MPL-2.0 -->

# ARIA deprecation handling

WAI-ARIA states two strengths of author rule. SHOULD NOT leaves the usage
conforming; MUST NOT does not. The engine grades on that distinction:
deprecated or otherwise discouraged usage resolves to **`cantTell`**, so the
author decides, and only prohibited usage `fail`s.

`aria-query` encodes no deprecation status — its role fields are `props`,
`requiredProps` and `prohibitedProps`, and it simply drops a deprecated
property from the role's `props`. Left alone that turns every deprecated
pairing into a not-allowed `fail`. The deprecation data therefore lives in a
spec-derived layer the engine owns, the same pattern as `SUPPLEMENTAL_GLOBALS`
(the 1.3 globals aria-query lacks).

## The data layer — `src/core/aria-helpers.js`

Four sets and four predicates, consumed by `aria-allowed-attr` (attributes)
and `aria-deprecated-role` (roles):

```
DEPRECATED_ATTRS          // states/properties deprecated on roles that do not
                          //   support them              -> cantTell
DEPRECATED_ROLES          // roles deprecated but valid   -> cantTell
AUTHOR_DISCOURAGED_ROLES  // roles reserved for user agents at SHOULD NOT
                          //   strength                   -> cantTell
AUTHOR_PROHIBITED_ROLES   // roles carrying an author MUST NOT -> fail

isDeprecatedAttr(attr, role)   // role param reserved for per-role granularity
isDeprecatedRole(role)
isAuthorDiscouragedRole(role)
isAuthorProhibitedRole(role)
```

## Contents, reconciled against WAI-ARIA 1.2

- `DEPRECATED_ATTRS` = `aria-disabled`, `aria-errormessage`, `aria-haspopup`,
  `aria-invalid`. ARIA 1.2 kept these four in the global set as deprecated
  rather than removing them (change log, 07-May-2020), and marks each
  "deprecated on this role" in the characteristics table of every role that
  does not support it — 84 of the 94 role definitions carry at least one such
  annotation. No role treats any of the four as prohibited, so the flat set
  cannot downgrade a prohibited pairing to `cantTell`. These four are also the
  only attributes annotated that way anywhere in the specification.
- `DEPRECATED_ROLES` = `directory`, the only role marked
  `[Deprecated in ARIA 1.2]`, superseded by `list`.
- `AUTHOR_DISCOURAGED_ROLES` = `generic`, which §5.4 describes as "primarily
  for implementors of user agents. Authors SHOULD NOT use this role in
  content."
- `AUTHOR_PROHIBITED_ROLES` is empty. The only author MUST NOT covering roles
  applies to the abstract roles, which `aria-roles-valid` already reports.

`aria-dropeffect` and `aria-grabbed` are deprecated in full (since ARIA 1.1)
but remain global in 1.2 and 1.3, so they are allowed on every role and pass.
Deliberately: naming them would flag markup no version of the specification
disallows, and the spec offers no replacement to move to — it records only
that one is "expected to be replaced by a new feature in a future version".

The properties ARIA does prohibit — `aria-label`, `aria-labelledby`, and
`aria-roledescription` on `generic` — are disjoint from the deprecated set and
are `aria-prohibited-attr`'s concern.

Four pairings pass rather than reporting `cantTell`: `aria-errormessage` and
`aria-invalid` on `menuitemcheckbox` and `menuitemradio`, which aria-query
lists among the role's supported properties while ARIA 1.2 marks them
deprecated there. The generated table follows aria-query, which errs towards
allowing the usage.

## Verifying a spec revision

The role characteristics tables in the specification are machine-readable:
each role section carries `td.role-properties` (supported), `td.role-inherited`
(inherited) and `td.role-disallowed` (prohibited), and a deprecated entry is
suffixed "(deprecated on this role in ARIA 1.2)". Extracting those three cells
per role gives the full allowed/deprecated/prohibited matrix, which can be
diffed against the generated tables in `aria-allowed-attr` (`GLOBAL_ATTRS`,
`SUPPORTED_ATTRS_BY_ROLE`) plus `DEPRECATED_ATTRS` to confirm that no pairing
the specification allows or merely deprecates resolves to `fail`.

## Applying a later revision

A specification change is a data edit; no rule logic changes:

- A deprecation promoted to prohibited: remove it from `DEPRECATED_ATTRS` or
  `DEPRECATED_ROLES` so it falls back to the `fail` path, or move a role into
  `AUTHOR_PROHIBITED_ROLES`.
- A new deprecation: add it to the relevant set.
- A deprecation that becomes per-role rather than uniform: `isDeprecatedAttr`
  already receives the role, so a `(role, attr)` map replaces the flat set
  behind the same predicate.

Then extend `tests/engine-checks/automatic/aria-allowed-attr.test.js` and
`aria-deprecated-role.test.js`, run `npm run build`, `node scripts/run-tests.js`,
`npm run format:check` and `npm run i18n:report`.
