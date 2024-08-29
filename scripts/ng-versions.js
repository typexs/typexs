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

  const todo = [];

  for (const packageJsonFile of files) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    const packageName = packageJson.name;
    const packageChange = packageNames.find(x => x.packageName === packageName);
    let _changed = false;
    if (packageChange) {
      packageJson.version = packageChange.version;
      const tag = 'v' + major(packageChange.version) + '-lts';
      packageJson.publishConfig.tag = tag;
      _changed = true;
    }
    ['dependencies', 'peerDependencies', 'devDependencies'].forEach(depGroup => {
      const deps = packageJson[depGroup];
      if (deps === undefined) {
        return;
      }
      const depPackageNames = Object.keys(deps);
      for (const depPackageName of depPackageNames) {
        const packageToChange = packageNames.find(x => x.packageName === depPackageName);
        if (packageToChange) {
          if (depGroup === 'peerDependencies') {
            deps[depPackageName] = '>=' + packageToChange.version;
          } else {
            deps[depPackageName] = '^' + packageToChange.version;
          }
          _changed = true;
        }
      }
    });
    if (_changed) {
      todo.push({ file: packageJsonFile, content: packageJson });
    }
  }

  packageNames.forEach(x => {
    fs.writeFileSync(x.file, JSON.stringify(x.content, null, 2));
  });
})().then(x => {
});
