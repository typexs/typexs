const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const exec = util.promisify(require('node:child_process').exec);

async function build() {
  const cwd = process.cwd();
  console.log(cwd);
  await exec('npx tsc');
  const packageJson = require(cwd + '/package.json');
  packageJson.main = 'index.js';
  packageJson.browser = 'browser.js';
  delete packageJson.private;
  fs.writeFileSync(cwd+'/build/package/package.json', JSON.stringify(packageJson, null, 2));
  // copy json files
  const files = glob.sync('./src/**/*.json', { follow: false }).filter(x => !/package\.json/.test(x));
  // files.forEach(x => {
  //   const y = x.replace('./src', './build/package');
  //   fs.writeFileSync(y, fs.readFileSync(x));
  // });
}

build().then(x => {

}).catch(err => {
  process.exit(1);
});
// exec()
