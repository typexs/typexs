const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const { resolve } = require('path');


(async function() {
  const dir = resolve(__dirname + '/../packages') + '/*/package.json';
  const files = glob.sync(dir);
  const map = {};
  for (const packageJsonFile of files) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    const name = packageJson.name;
    const version = packageJson.version;
    map[name] = '^' + version;
  }
  console.log(map);
  for (const packageJsonFile of files) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    ['dependencies', 'peerDependencies', 'devDependencies'].forEach(x => {
      const deps = packageJson[x];
      if (deps) {
        Object.keys(deps).map(name => {
          if (map[name] && map[name] !== deps[name]) {
            deps[name] = map[name];
          }
        });
      }
    });
    fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2));
  }
})().then(x => {
});
