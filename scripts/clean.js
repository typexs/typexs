#!/bin/env node

const fs = require('node:fs');
const pth = require('node:path');

const p = process.cwd();
if (/\/packages\/.*\/src$/.test(p)) {
  const paths = [];
  if (process.argv.includes('modules')) {
    paths.push(...[
      pth.join(p, 'node_modules'),
      pth.join(p, '..', 'node_modules')
    ]);
  }
  if (process.argv.includes('build')) {
    paths.push(...[
      pth.join(p, '..', 'build'),
      pth.join(p, '..', '.angular')
    ]);
  }
  for (const path of paths) {
    if (fs.existsSync(path)) {
      fs.rmSync(path, { recursive: true, force: true });
    }
  }
}

