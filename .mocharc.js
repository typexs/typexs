'use strict';

module.exports = {
  diff: true,
  // extension: ['js'],
  // package: './package.json',
  reporter: 'spec',
  // slow: 75,
  timeout: 120000,
  ui: 'bdd',
  recursive: true,
  require: 'ts-node/register',
  'watch-extensions': ['ts']
};
