const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const exec = util.promisify(require('node:child_process').exec);

async function build() {
  const cwd = process.cwd();
  await exec('npx tsc --build');
  const packageJson = require(cwd + '/package.json');
  packageJson.main = 'index.js';
  packageJson.browser = 'browser.js';
  delete packageJson.private;
  delete packageJson.scripts;
  delete packageJson.publishConfig;
  fs.writeFileSync(cwd + '/build/package/package.json', JSON.stringify(packageJson, null, 2));
  // copy json files
  let files = glob.sync(cwd + '/src/**/*.json', { follow: false }).filter(x => !/package\.json/.test(x));
  files.forEach(x => {
    const y = x.replace(cwd + '/src', cwd + '/build/package');
    fs.writeFileSync(y, fs.readFileSync(x));
  });

  files = glob.sync(cwd + '/README.md', { follow: false });
  files.forEach(x => {
    const y = x.replace(cwd + '/src', cwd + '/build/package');
    fs.writeFileSync(y, fs.readFileSync(x));
  });
}

build().then(x => {

}).catch(err => {
  process.exit(1);
});
// exec()
