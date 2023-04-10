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
    map[name] = version;
  }
  for (const packageJsonFile of files) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    Object.keys(packageJson.dependencies).map(name => {
      if(map[name] && map[name] !== packageJson.dependencies[name]){
        packageJson.dependencies[name] = map[name];
      }
    });
  }
  console.log(files);
})().then(x => {
});
