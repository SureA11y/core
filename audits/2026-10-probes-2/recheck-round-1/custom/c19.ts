import type { CustomRule } from '/home/user/core/src/index';
const a: CustomRule = { id: 'z', runInPage: (ctx) => ctx.helpers.queryAll('x') };
const b: CustomRule = { id: 'z', meta: {}, runInPage: (ctx) => 42 };
