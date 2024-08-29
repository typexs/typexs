const { resolve } = require('path');
const util = require('node:util');
const fs = require('fs');
const glob = require('glob');
const { major, inc } = require('semver');
// const semverMajor = require('semver/functions/major')


(async function() {
  const dir = resolve(__dirname + '/../packages') + '/*/src/package.json';
  const files = glob.sync(dir);

  // find packages to change
  const packageNames = [];
  for (const packageJsonFile of files) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    const name = packageJson.name;
    const [group, groupPackageName] = name.split('/');
    if (/(^ng-)|(-ng$)|^ng$/.test(groupPackageName)) {
      const version = packageJson.version;
      packageNames.push({
        file: packageJsonFile,
        packageName: name,
        group: group,
        groupName: groupPackageName,
        oldVersion: version,
        version: inc(version, 'major')
      });
      // map[name] = '^' + version;
    }
  }


  for (const packageJsonFile of files) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    packageJson


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

  }


  console.log(packageNames);
  // for (const packageJsonFile of files) {
  //   const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
  //   ['dependencies', 'peerDependencies', 'devDependencies'].forEach(x => {
  //     const deps = packageJson[x];
  //     if (deps) {
  //       Object.keys(deps).map(name => {
  //         if (map[name] && map[name] !== deps[name]) {
  //           deps[name] = map[name];
  //         }
  //       });
  //     }
  //   });
  //   fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2));
  // }
})().then(x => {
});
