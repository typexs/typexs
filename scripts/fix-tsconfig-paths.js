import { fileURLToPath } from 'url';
import { join, resolve, dirname } from 'path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const rootDir = resolve(join(__dirname, '..'));
  const packageDir = join(rootDir, 'packages');
  const res = (await readdir(packageDir)).sort();

  const mdls = (await Promise.all(res.map(async x => {
    const pkgJsonPath = join(packageDir, x, 'src', 'package.json');
    const ngCheckPath = join(packageDir, x, 'angular.json');
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse((await readFile(pkgJsonPath)).toString());
      const data = { name: pkgJson.name, version: pkgJson.version, path: x };
      const isNg = existsSync(ngCheckPath);
      data.ng = isNg;
      return data;
    }
    return null;
  }))).filter(x => x !== null);

  // console.log(mdls);
  if (mdls.length > 0) {
    const ngSpec = {};
    const ngLib = {};
    mdls.map(x => {
      if (x.ng) {
        ngSpec[x.name] = [
          join('.', 'packages', x.path, 'src', 'public_api')
        ];
        ngLib[x.name] = [
          join('.', 'packages', x.path, 'build', 'package', 'public_api')
        ];
      } else {
        ngSpec[x.name] = [
          join('.', 'packages', x.path, 'src', 'browser')
        ];
        ngLib[x.name] = [
          join('.', 'packages', x.path, 'build', 'package', 'browser')
        ];
      }
      ngSpec[x.name + '/*'] = [
        join('.', 'packages', x.path, 'src', '*')
      ];
      ngLib[x.name + '/*'] = [
        join('.', 'packages', x.path, 'build', 'package', '*')
      ];
    });

    const todo = [
      { file: 'tsconfig.ng.spec.json', data: ngSpec },
      { file: 'tsconfig.ng.lib.json', data: ngLib }
    ]
      .map(async x => {
        const tsConfigPath = join(rootDir, x.file);
        const tsSpecJson = JSON.parse((await readFile(tsConfigPath)).toString());
        const keys = Object.keys(tsSpecJson.compilerOptions.paths);
        for (let y in x.data) {
          if (!keys.includes(y)) {
            tsSpecJson.compilerOptions.paths[y] = x.data[y];
          }
        }
        await writeFile(tsConfigPath, JSON.stringify(tsSpecJson, null, 2));

      });

    await Promise.all(todo);


  }


})();

