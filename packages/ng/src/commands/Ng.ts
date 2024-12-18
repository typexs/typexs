// import { existsSync, writeFileSync } from 'fs';
// import { dirname, join } from 'path';
// import { Config, FileUtils, Inject, Log, RuntimeLoader } from '@typexs/base';
// import { ModuleDescriptor } from '@allgemein/moduls';
// import * as glob from 'glob';
// import { NgMetaDataCollector } from '../lib/angular/NgMetaDataCollector';
// import { IStylesheetEntry } from '../lib/angular/IStylesheetEntry';
// import { ITemplateEntry } from '../lib/angular/ITemplateEntry';
// import { NgModuleBuilder } from '../lib/angular/NgModuleBuilder';
//
//
// export class Ng {
//
//   command = 'ng [op]';
//   aliases = 'ng';
//   describe = 'Ng prebuild ';
//
//
//   @Inject()
//   collector: NgMetaDataCollector;
//
//   @Inject('RuntimeLoader')
//   loader: RuntimeLoader;
//
//
//   builder(yargs: any) {
//     return yargs;
//   }
//
//   async handler(argv: any) {
//     const appName = Config.get('app.name', 'dummy');
//     const appPath = Config.get('app.path', '.');
//
//     switch (argv.op) {
//       // case 'build-modules':
//       //   return this.ngBuild();
//       // case 'build-themes':
//       //   return this.ngThemes();
//       case 'init':
//         return this.ngInit();
//     }
//   }
//
//
//   async ngInit() {
//     const allgPackagingJsonPath = findPackageJson(__dirname);
//     if (!allgPackagingJsonPath) {
//       throw new Error('can\'t find path to allgemein-packaging package json');
//     }
//     const allgPackagingJson = require(allgPackagingJsonPath);
//
//     const pathToPackageJsonPath = findPackageJson(process.cwd());
//     const pathToPackage = dirname(pathToPackageJsonPath);
//     if (!pathToPackageJsonPath) {
//       throw new Error('can\'t find path to project package json');
//     }
//     const pathToPackagingJson = require(pathToPackageJsonPath);
//
//     const skipPkg = ['mocha', 'jasmine', 'chai', 'mocha-typescript', 'typescript', 'ts-node'];
//
//     const changes = [];
//
//     for (const dep of Object.keys(allgPackagingJson.devDependencies)) {
//       if (skipPkg.includes(dep) || /^@types\//.test(dep)) {
//         continue;
//       }
//
//       if (!pathToPackagingJson.hasOwnProperty('devDependencies')) {
//         pathToPackagingJson.devDependencies = {};
//       }
//
//       if (!pathToPackagingJson.devDependencies.hasOwnProperty(dep)) {
//         pathToPackagingJson.devDependencies[dep] = allgPackagingJson.devDependencies[dep];
//         changes.push('add ' + dep + ' ' + allgPackagingJson.devDependencies[dep]);
//       } else {
//         const versionSrc = allgPackagingJson.devDependencies[dep].replace(/\^|>|<|=/g, '');
//         const versionDest = pathToPackagingJson.devDependencies[dep].replace(/\^|>|<|=/g, '');
//
//         if (compareVersions(versionDest, versionSrc) < 0) {
//           // update version
//           pathToPackagingJson.devDependencies[dep] = versionSrc;
//           changes.push('update ' + dep + ' ' + allgPackagingJson.devDependencies[dep]);
//         }
//       }
//     }
//
//     if (changes.length > 0) {
//       console.log('Update dev dependencies in ' + pathToPackageJsonPath);
//       console.log(changes.map(x => ' - ' + x).join('\n'));
//       writeFileSync(pathToPackageJsonPath, JSON.stringify(pathToPackagingJson, null, 2));
//       console.log('Run `npm install` to install packages.');
//     } else {
//       console.log('All dev dependencies are installed.');
//     }
//
//   }
//
//   async ngThemes() {
//     this.generateTemplateFile();
//     this.generateStylesheetFile();
//   }
//
//
//   /**
//    * Generate src/app/stylesheets.ts file
//    *
//    * @returns {Promise<void>}
//    */
//   private generateStylesheetFile() {
//     const modules = this.loader.registry.getModules();
//     const stylesheets = [];
//
//     let currentModule: ModuleDescriptor;
//
//     for (const _module of modules) {
//       const minmatch = '' + _module.path + '/?(src)/app/themes/**/*.+(css|less|sass|scss)';
//       currentModule = _module;
//       const files = glob.sync(minmatch);
//       if (isEmpty(files)) {
//         continue;
//       }
//
//
//       for (const file of files) {
//         const strippedPath = file.replace(_module.path, '');
//         const themePath = strippedPath.split('/app/themes/').pop();
//         const themeName = themePath.split('/').shift();
//         const fileName = themePath.split('/').pop();
//
//         const matchResult = fileName.match(/^(.*)\.(override|append)\.(css|less|sass|scss)$/);
//         if (matchResult && matchResult.length === 3) {
//           const stylesheet: IStylesheetEntry = {
//             theme: themeName,
//             name: matchResult[1],
//             subcontext: matchResult[2],
//             type: matchResult[3],
//             stylesheet: `require('./themes/${themePath}')`
//           };
//           stylesheets.push(stylesheet);
//         }
//       }
//     }
//
//     let content = JSON.stringify(stylesheets, null, 2);
//     content = content.replace(/\"(require\(.*\))\"/g, '$1');
//     const lines = ['/**', ' * GENERATED BY "typexs ng build-themes"',
//       ' * MODIFICATIONS WILL GET LOST ON NEXT GENERATION', ' */'];
//
//     if (currentModule.name === 'typexs') {
//       lines.push('import {IStylesheetEntry} from \'../libs/angular/IStylesheetEntry\';');
//     } else {
//       lines.push('import {IStylesheetEntry} from \'typexs\';');
//     }
//     lines.push('');
//     lines.push('export const STYLES: IStylesheetEntry[] =');
//     lines.push(content + ';');
//
//     content = lines.join('\n');
//
//     const stylesheetFileName = join(currentModule.path, 'src', 'app', 'stylesheets.ts');
//     FileUtils.writeFileSync(stylesheetFileName, content);
//     Log.info('Updated ' + stylesheetFileName);
//   }
//
//
//   /**
//    * Generate src/app/themes.ts file
//    *
//    * @returns {Promise<void>}
//    */
//   private generateTemplateFile() {
//     const modules = this.loader.registry.getModules();
//     const templeted = [];
//
//     let currentModule: ModuleDescriptor;
//
//     for (const _module of modules) {
//       const minmatch = '' + _module.path + '/?(src)/app/themes/**/*.html';
//       currentModule = _module;
//       const files = glob.sync(minmatch);
//       if (isEmpty(files)) {
//         continue;
//       }
//
//
//       for (const file of files) {
//         const strippedPath = file.replace(_module.path, '');
//         const themePath = strippedPath.split('/app/themes/').pop();
//         const themeName = themePath.split('/').shift();
//         const fileName = themePath.split('/').pop();
//
//         const matchResult = fileName.match(/^(.*)\.(component)\.html$/);
//         if (matchResult && matchResult.length === 3) {
//           const template: ITemplateEntry = {
//             theme: themeName,
//             name: matchResult[1],
//             type: matchResult[2],
//             template: `require('./themes/${themePath}')`
//           };
//           templeted.push(template);
//         }
//       }
//     }
//
//
//     let content = JSON.stringify(templeted, null, 2);
//     content = content.replace(/\"(require\(.*\))\"/g, '$1');
//     const lines = ['/**', ' * GENERATED BY "typexs ng build-themes"',
//       ' * MODIFICATIONS WILL GET LOST ON NEXT GENERATION', ' */'];
//
//     if (currentModule.name === 'typexs') {
//       lines.push('import {ITemplateEntry} from \'../libs/angular/ITemplateEntry\';');
//     } else {
//       lines.push('import {ITemplateEntry} from \'typexs\';');
//     }
//     lines.push('');
//     lines.push('export const THEMES: ITemplateEntry[] =');
//     lines.push(content + ';');
//
//     content = lines.join('\n');
//
//     const themeFileName = join(currentModule.path, 'src', 'app', 'themes.ts');
//     FileUtils.writeFileSync(themeFileName, content);
//     Log.info('Updated ' + themeFileName);
//
//   }
//
//
//   /**
//    * Generate src/modules/app/app.used.modules.ts
//    *
//    * @returns {Promise<void>}
//    */
//   async ngBuild() {
//     // TODO check if modules are enabled
//     const modules = this.collector.collectNgModules();
//     const builder = new NgModuleBuilder();
//     builder.addModules(modules);
//
//     const content = builder.build();
//
//     await builder.save();
//   }
// }
//
//
// const packageJson = 'package.json';
//
//
// function findPackageJson(_dirname: string) {
//   let packageJsonPath = null;
//   while (_dirname) {
//     packageJsonPath = join(_dirname, packageJson);
//     if (existsSync(packageJsonPath)) {
//       break;
//     } else {
//       _dirname = dirname(_dirname);
//     }
//
//     if (!_dirname) {
//       throw new Error('can\'t find path to package json');
//     }
//   }
//   return packageJsonPath;
// }
//
//
// /*
//  * Using code from npm modul compare-versions
//  */
// const semver = /^v?(?:\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+))?
// (?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
//
// function tryParse(v: any) {
//   return isNaN(Number(v)) ? v : Number(v);
// }
//
// function validate(version: string) {
//   if (typeof version !== 'string') {
//     throw new TypeError('Invalid argument expected string');
//   }
//   if (!semver.test(version)) {
//     throw new Error('Invalid argument not valid semver (\'' + version + '\' received)');
//   }
// }
//
// function indexOrEnd(str: string, q: string) {
//   return str.indexOf(q) === -1 ? str.length : str.indexOf(q);
// }
//
// function split(v: string) {
//   const c = v.replace(/^v/, '').replace(/\+.*$/, '');
//   const patchIndex = indexOrEnd(c, '-');
//   const arr = c.substring(0, patchIndex).split('.');
//   arr.push(c.substring(patchIndex + 1));
//   return arr;
// }
//
//
// function compareVersions(v1: string, v2: string) {
//   [v1, v2].forEach(validate);
//
//   const s1 = split(v1);
//   const s2 = split(v2);
//
//   for (let i = 0; i < Math.max(s1.length - 1, s2.length - 1); i++) {
//     const n1 = parseInt(s1[i] || '0', 10);
//     const n2 = parseInt(s2[i] || '0', 10);
//
//     if (n1 > n2) {
//       return 1;
//     }
//     if (n2 > n1) {
//       return -1;
//     }
//   }
//
//   const sp1 = s1[s1.length - 1];
//   const sp2 = s2[s2.length - 1];
//
//   if (sp1 && sp2) {
//     const p1 = sp1.split('.').map(tryParse);
//     const p2 = sp2.split('.').map(tryParse);
//
//     for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
//       if (p1[i] === undefined || typeof p2[i] === 'string' && typeof p1[i] === 'number') {
//         return -1;
//       }
//       if (p2[i] === undefined || typeof p1[i] === 'string' && typeof p2[i] === 'number') {
//         return 1;
//       }
//
//       if (p1[i] > p2[i]) {
//         return 1;
//       }
//       if (p2[i] > p1[i]) {
//         return -1;
//       }
//     }
//   } else if (sp1 || sp2) {
//     return sp1 ? -1 : 1;
//   }
//
//   return 0;
// }
//
// /*
//  * End of compare-versions
//  */
//
//
//
