const fs = require('node:fs');
const path = require('node:path');
const ts = require('../apps/app/node_modules/typescript');
const source = fs.readFileSync(path.join(__dirname, '../apps/app/src/qr.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const target = { exports: {} };
new Function('exports', compiled)(target.exports);
const cases = ['opaque.signed.token', 'a'.repeat(220), Array.from({ length: 271 }, (_, i) => String.fromCharCode(33 + i % 90)).join('')];
process.stdout.write(JSON.stringify(cases.map(value => ({ value, matrix: target.exports.qrMatrix(value) }))));
