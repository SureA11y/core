const { runAll } = require('./harness');
runAll([{ id:'body-text', html:`<!doctype html><html lang="en"><head><title>LM</title></head><body>This is an important notice about your account that sits outside every landmark.<main><h1>T</h1></main></body></html>` },
 { id:'body-text-after-main', html:`<!doctype html><html lang="en"><head><title>LM</title></head><body><main><h1>T</h1></main>Copyright 2026 Example Inc. All rights reserved.</body></html>` }], ['region']);
