// Records a version cut by hand everywhere release-please would have, so it does not
// re-release what a manual tag already shipped.
const fs = require('fs');

const version = process.argv[2];

for (const path of ['package.json', 'packages/zest-ui/package.json']) {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

const manifestPath = '.release-please-manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest['.'] = version;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
