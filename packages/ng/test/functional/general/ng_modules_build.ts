// import {suite, test} from '@testdeck/mocha';
// import {expect} from 'chai';
// import * as _ from 'lodash';
// import {Bootstrap, ClassesLoader, Config, Injector, PlatformUtils} from '@typexs/base';
//
// @suite('functional/general/ng_modules_build')
// class GeneralSpec {
//
//   before() {
//     Bootstrap.reset();
//   }
//
//   after() {
//     Bootstrap.reset();
//   }
//
//
//   @test
//   async 'collect ngModules'() {
//
//     let bts = Bootstrap._().configure({
//       app: {path: __dirname + '/fake_apps/coolapp'},
//       modules: {
//         libs: [{
//           topic: C_NG_MODUL,
//           refs: ['src/modules/*/*.module.*']
//         }]
//       }
//     });
//
//     bts = await bts.prepareRuntime();
//     const loader = bts.getLoader();
//     const classes = loader.getClasses(C_NG_MODUL);
//     expect(classes).to.have.length(3);
//
//     const ngmd = Injector.get(NgMetaDataCollector);
//     await ngmd.prepare();
//
//     const ngms = ngmd.modules;
//     expect(ngms).to.have.length(3);
//     expect(_.map(ngms, n => n.name)).to.deep.eq(['AppModule', 'ContactModule', 'TodoModule']);
//   }
//
//
//   @test
//   async 'build AppModule'() {
//     let bts = Bootstrap._().configure({
//       ng: {generated: './build/ng-app'},
//       app: {path: __dirname + '/fake_apps/coolapp'},
//       modules: {
//         libs: [{
//           topic: C_NG_MODUL,
//           refs: [
//             'app/modules/*/*.module.*'
//           ]
//         }]
//       }
//     });
//
//     bts = await bts.prepareRuntime();
//     const loader = bts.getLoader();
//
//     const ngmd = Injector.get(NgMetaDataCollector);
//     await ngmd.prepare();
//
//     const ngms = ngmd.modules;
//
//
//     const appPath = bts.getAppPath();
//     let generated = Config.get('ng.generated', '.');
//     generated = PlatformUtils.join(appPath, generated, 'app.module.ts');
//
//     const builder = new NgModuleBuilder();
//     builder
//       .file(generated)
//       .selfPackageName('project')
//       .addModules(ngms);
//
//     const str = builder.build();
//     console.log(str);
//
//
//     // builder.
//   }
// }
//
