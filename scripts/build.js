const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const exec = util.promisify(require('node:child_process').exec);
const path = require('node:path');
const { existsSync } = require('fs');

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
  const files = [].concat(
    glob.sync(cwd + '/LICENSE', { follow: false }),
    glob.sync(cwd + '/README*', { follow: false }),
    glob.sync(cwd + '/src/**/*.json', { follow: false }).filter(x => !/package\.json/.test(x)),
    glob.sync(cwd + '/src/bin/*', { follow: false })
  );
  files.forEach(x => {
    const y = x.replace('/src', '').replace(cwd, cwd + '/build/package');
    const dirname = path.dirname(y);
    if (!existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(y, fs.readFileSync(x));
  });
}

build().then(x => {

}).catch(err => {
  console.error(err);
  process.exit(1);
});
// exec()
