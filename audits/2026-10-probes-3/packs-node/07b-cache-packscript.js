'use strict';
// packScript is documented to throw for an invalid pack. After a non-strict
// scan with the same (invalid) pack object, does it still throw?
const { scan, quiet, base, report, packApi } = require('./lib.js');
const bad = () => base({ name: 'bad', namespace: 'bad', core: '^99.0.0' });
const fresh = bad();
let r1; try { packApi.packScript([fresh]); r1 = 'no throw'; } catch (e) { r1 = 'throws: ' + e.message; }
report('packScript, fresh invalid pack', r1);
const used = bad();
quiet(() => scan({ packs: [used] }));
let r2; try { const s = packApi.packScript([used]); r2 = 'NO THROW; script head: ' + s.split('\n').slice(0, 1).join(' ') + ' | registry key line: ' + (s.match(/registry\[[^\]]*\]/) || [])[0]; } catch (e) { r2 = 'throws: ' + e.message; }
report('packScript, same invalid pack after a non-strict scan', r2);
