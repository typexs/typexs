const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const exec = util.promisify(require('node:child_process').exec);
const path = require('node:path');
const { existsSync } = require('fs');

const deleteKeys = ['private', 'scripts'];

async function build() {
  const cwd = path.join(process.cwd());
  const packageDir = path.resolve(path.join(cwd, '..'));
  await exec('npx tsc --build', { cwd: packageDir });
  const packageJson = require(cwd + '/package.json');
  packageJson.main = 'index.js';
  packageJson.browser = 'browser.js';
  deleteKeys.forEach(x => {
    delete packageJson[x];
  });
  // delete packageJson.publishConfig;
  fs.writeFileSync(packageDir + '/build/package/package.json', JSON.stringify(packageJson, null, 2));
  // copy json files
  const files = []
    .concat(
      glob.sync(packageDir + '/LICENSE', { follow: false }),
      glob.sync(packageDir + '/README*', { follow: false }),
      glob.sync(packageDir + '/src/**/*.json', { follow: false }).filter(x => !/package\.json/.test(x)),
      glob.sync(packageDir + '/src/bin/*', { follow: false })
    )
    .filter(x => x.indexOf('node_modules') === -1);
  const buildDir = path.join(packageDir, 'build', 'package');
  files.forEach((x) => {
    let y = x.replace(packageDir, '').replace('/src', ''); //.replace(cwd, packageDir + '/build/package');
    y = path.join(buildDir, y);
    const dirname = path.dirname(y);
    if (!existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(y, fs.readFileSync(x));
  });
  console.log('');
}

build().then(x => {

}).catch(err => {
  console.error(err);
  process.exit(1);
});
// exec()
