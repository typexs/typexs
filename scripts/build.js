const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const exec = util.promisify(require('node:child_process').exec);
const path = require('node:path');
const { existsSync } = require('fs');

async function build() {
  const cwd = path.join(process.cwd());
  const packageDir = path.resolve(path.join(cwd, '..'));
  await exec('npx tsc --build', {cwd: packageDir });
  const packageJson = require(cwd + '/package.json');
  packageJson.main = 'index.js';
  packageJson.browser = 'browser.js';
  delete packageJson.private;
  delete packageJson.scripts;
  delete packageJson.publishConfig;
  fs.writeFileSync(packageDir + '/build/package/package.json', JSON.stringify(packageJson, null, 2));
  // copy json files
  const files = [].concat(
    glob.sync(packageDir + '/LICENSE', { follow: false }),
    glob.sync(packageDir + '/README*', { follow: false }),
    glob.sync(packageDir + '/src/**/*.json', { follow: false }).filter(x => !/package\.json/.test(x)),
    glob.sync(packageDir + '/src/bin/*', { follow: false })
  );
  files.forEach(x => {
    const y = x.replace(packageDir, cwd).replace(cwd, packageDir + '/build/package');
    const dirname = path.dirname(y);
    if (!existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(y, fs.readFileSync(x));
  });
  console.log('')
}

build().then(x => {

}).catch(err => {
  console.error(err);
  process.exit(1);
});
// exec()
