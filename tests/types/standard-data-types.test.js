'use strict';

/**
 * src/pack.d.ts's standard data types against data the checker accepts. Each
 * document is written into a TypeScript file as a typed object literal and
 * compiled strictly: an object literal may not carry a field its type does
 * not declare, so this fails when valid data uses a field the types don't
 * know. The data a standard was built from is frozen, and typed so; a
 * misspelled field of a derived standard's own data is a type error.
 * Skipped when TypeScript is not installed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { checkStandardData } = require('../../src/standard-data.js');

let ts;
try {
  ts = require('typescript');
} catch {
  ts = null;
}

const PACK_TYPES = path.join(__dirname, '../../src/pack');

function compile(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-types-'));
  const file = path.join(dir, 'check.ts');
  fs.writeFileSync(file, source);
  const program = ts.createProgram([file], {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    types: []
  });
  return ts
    .getPreEmitDiagnostics(program)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n').slice(0, 400));
}

// Every field the format has, at once: laws and their names, a profile's
// law and tags, a version's notes, review and texts, groups within groups,
// tests with procedures, a requirement with a procedure, routes and asks.
const full = {
  format: 'surea11y-standard/1',
  key: 'city',
  standard: 'City',
  lang: 'en',
  versions: [{ version: '1', wcagVersion: '2.2', published: '2026-02' }],
  options: { wcagCorrespondence: true, ruleMapped: true },
  data: {
    1: {
      groups: [
        {
          id: 'g',
          title: 'All',
          groups: [{ id: 'img', title: 'Images', requirements: ['1.1', '1.2'] }]
        }
      ],
      requirements: {
        1.1: { title: 'Images', wcagSc: ['1.1.1'], tests: ['1.1.1'], partial: true, scope: 'page' },
        1.2: {
          title: 'Decorative images',
          wcagSc: ['1.1.1'],
          note: 'By hand.',
          procedure: {
            steps: ['Find the images.'],
            passWhen: 'They are hidden.',
            failWhen: 'One is not.',
            tools: ['devtools'],
            automation: 'manual'
          }
        }
      },
      tests: {
        '1.1.1': {
          title: 'An <img> has alt',
          requirements: ['1.1'],
          wcagSc: ['1.1.1'],
          scope: 'page',
          procedure: {
            steps: ['Check the alt.'],
            passWhen: 'It has one.',
            failWhen: 'It has none.'
          }
        }
      },
      ruleMap: {
        'img-alt-present': {
          requirements: ['1.1.1'],
          note: 'presence',
          reasonCodes: { X: { requirements: ['1.1.1'], outcome: 'cantTell' } },
          findings: [
            { when: { 'data.details.kind': 'x' }, requirements: ['1.1.1'], outcome: 'fail' }
          ]
        },
        'img-alt-quality': { requirements: [], asks: ['1.1.1'] }
      },
      notes: ['These procedures follow the method.'],
      review: {
        'img-alt-quality': {
          TEXT_ALTERNATIVE_REVIEW: {
            steps: ['Read the alt.'],
            passWhen: 'It describes the image.',
            failWhen: 'It does not.'
          }
        }
      },
      texts: {
        fr: {
          'requirements.1.1.title': 'Images',
          'tests.1.1.1.procedure.steps': ['Vérifier le alt.']
        }
      }
    }
  },
  profiles: { 'city-1': { version: '1', tags: ['city'], mappedRules: true, law: 'city-act' } },
  laws: {
    'city-act': {
      name: 'City Act',
      jurisdiction: 'FR',
      sources: [{ title: 'The act', url: 'https://example.org/act' }]
    }
  },
  texts: { fr: { 'laws.city-act.name': 'Loi de la ville' } }
};

test('data using every field of the format is typed', { skip: !ts && 'no TypeScript' }, () => {
  assert.deepEqual(checkStandardData(full), []);
  const source = `import { StandardData } from ${JSON.stringify(PACK_TYPES)};
const data: StandardData = ${JSON.stringify(full)};
export { data };
`;
  assert.deepEqual(compile(source), []);
});

test(
  "a standard's data is frozen, a base as it is, and a derived standard's own data is checked",
  { skip: !ts && 'no TypeScript' },
  () => {
    const source = `import { StandardData, standardDataOf, standardFromData, deriveStandard } from ${JSON.stringify(PACK_TYPES)};
declare const data: StandardData;
const base = standardDataOf(standardFromData(data));
if (base) {
  // @ts-expect-error The data a standard was built from is frozen.
  base.key = 'other';
  // @ts-expect-error So are its tables.
  base.data['1'].requirements['1.1'].title = 'other';
  // A frozen base is a base, and a standard is built from frozen data.
  standardFromData(base);
  deriveStandard([base], {
    format: 'surea11y-standard/1',
    key: 'derived',
    standard: 'Derived',
    versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'city', version: '1' }] }],
    data: {
      '1': {
        requirements: { '1.1': { basedOn: [{ standard: 'city', id: '1.1' }] } },
        ruleMap: { 'img-alt-quality': null }
      }
    }
  });
  deriveStandard([base], {
    format: 'surea11y-standard/1',
    key: 'derived',
    standard: 'Derived',
    versions: [{ version: '1', wcagVersion: '2.2' }],
    data: { '1': { requirements: {}, ruleMap: {} } },
    // @ts-expect-error A field the format doesn't have.
    profile: {}
  });
}
`;
    assert.deepEqual(compile(source), []);
  }
);
