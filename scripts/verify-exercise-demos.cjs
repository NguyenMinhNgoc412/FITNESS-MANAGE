// Offline integrity check: node scripts/verify-exercise-demos.cjs
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), assets = path.join(root, 'apps/app/assets/exercise-demos');
const provenance = JSON.parse(fs.readFileSync(path.join(assets, 'provenance.json'), 'utf8'));
const content = fs.readFileSync(path.join(root, 'apps/api/src/domain/exercise-content.ts'), 'utf8');
const catalog = [...content.matchAll(/exercise\('([^']+)', '[^']+', '([^']+)'/g)].map(match => [match[1], match[2]]);
assert.equal(catalog.length, 20); assert.equal(Object.keys(provenance).length, catalog.length);
let frames = 0, bytes = 0;
for (const [code, nameEn] of catalog) {
  const demo = provenance[code]; assert(demo, 'Missing catalog code: ' + code); assert.equal(demo.nameEn, nameEn); assert.equal(demo.catalogVersion, 1);
  assert(demo.frameFiles.length >= 2 && demo.frameFiles.length <= 3); assert.match(demo.sourceCommit, /^[a-f0-9]{40}$/); assert.match(demo.sourceUrl, /^https:\/\/github\.com\//); assert.match(demo.licenseUrl, /^https:\/\//);
  for (const file of demo.frameFiles) {
    assert.match(file, new RegExp('^' + code + '-[0-9]+\\.(jpg|png)$'));
    const data = fs.readFileSync(path.join(assets, file)); assert(data.length > 100);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), demo.sha256[file], 'Changed media requires provenance review: ' + file);
    frames++; bytes += data.length;
  }
}
const actual = fs.readdirSync(assets).filter(file => /\.(jpg|png|gif)$/i.test(file)); assert.equal(actual.length, frames, 'Unreviewed/unused media in assets');
console.log(`PASS: ${catalog.length} catalog codes, ${frames} frame hashes, source/license metadata; ${(bytes / 1024 / 1024).toFixed(2)} MiB bundled media.`);
