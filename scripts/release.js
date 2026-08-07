'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (!packageJson.version) {
  throw new Error('package.json must define a version before releasing');
}

execFileSync('yarn', ['prepare'], { stdio: 'inherit' });
execFileSync(
  'gh',
  [
    'workflow',
    'run',
    'publish.yml',
    '--repo',
    'litlynx/react-native-enriched-html',
    '--ref',
    'main',
    '--field',
    'release-type=stable',
    '--field',
    `version=${packageJson.version}`,
    '--field',
    'dry-run=false',
  ],
  { stdio: 'inherit' }
);
