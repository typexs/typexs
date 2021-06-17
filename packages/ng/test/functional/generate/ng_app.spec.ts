// import {suite, test, timeout} from "@testdeck/mocha";
// import * as fs from "fs";
// import * as os from "os";
// import {join} from "path";
// import {expect} from 'chai';
// import {Bootstrap, Log, PlatformUtils, SchematicsExecutor} from "@typexs/base";
//
//
//
//
// const TMPDIR = os.tmpdir();
// //const TESTDIR = join(TMPDIR,'ng-'+(new Date()).getTime(),'build') ;
// const TESTDIR = join(__dirname,'build') ;
//
//
// @suite('functional/commands/ng_app')
// class GeneralSpec {
//
//
//   static async after() {
//
//     try {
//        await PlatformUtils.deleteDirectory(TESTDIR);
//     } catch (e) {
//     }
//   }
//
//
//   @test @timeout(20000)
//   async 'create new app'() {
//     Log.info('Create new app');
//     let directory = join(TESTDIR,'output');
//     try {
//       await PlatformUtils.deleteDirectory(directory);
//     } catch (e) {
//     }
//     PlatformUtils.mkdir(directory);
//
//     let _argv = {
//       name: 'ng-test',
//       directory: 'ng-app',
//       skipGit: true
//     }
//
//     let executor = new SchematicsExecutor({
//       workdir: directory,
//       basedir: directory,
//       collectionName: __dirname + '/../../../src/packages/@schematics/typexs',
//       schematicName: 'ng-app',
//       argv: _argv
//     });
//
//     try {
//       await executor.run();
//     } catch (e) {
//       console.error(e);
//     }
//
//     expect(fs.existsSync(directory + `/${_argv.directory}/karma.conf.js`)).to.be.true;
//     expect(fs.existsSync(directory + `/${_argv.directory}/src/modules/app/app.module.ts`)).to.be.true;
//     expect(fs.existsSync(directory + `/${_argv.directory}/src/app/main.ts`)).to.be.true;
//
//   }
//
//   @test
//   async 'upgrade project'() {
//     let directory = join(TESTDIR,'output','ng-app');
//
//     if (!fs.existsSync(directory)) {
//       await this['create new app']();
//     }
//
//     Log.info('Upgrade project');
//
//     try {
//       fs.unlinkSync(directory + '/gulpfile.ts');
//       fs.unlinkSync(directory + '/karma.conf.js');
//       fs.unlinkSync(directory + '/src/app/main.ts');
//     } catch (e) {
//     }
//
//
//     let _argv = {
//       name: 'ng-test',
//       directory: 'ng-app',
//       skipGit: true
//     }
//
//     let executor = new SchematicsExecutor({
//       workdir: directory,
//       basedir: directory,
//       collectionName: __dirname + '/../../../src/packages/@schematics/typexs',
//       schematicName: 'ng-app',
//       argv: _argv
//     });
//
//     try {
//       await executor.run();
//     } catch (e) {
//       // console.error(e);
//     }
//
//
//     expect(fs.existsSync(directory + '/karma.conf.js')).to.be.true;
//     expect(fs.existsSync(directory + '/src/modules/app/app.module.ts')).to.be.true;
//     expect(fs.existsSync(directory + '/src/app/main.ts')).to.be.true;
//
//
//   }
//
//
// }
//
