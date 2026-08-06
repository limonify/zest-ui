import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), '..', '..', 'packages/zest-ui/package.json'),
    'utf8',
  ),
) as { version: string };

export const version = pkg.version;
