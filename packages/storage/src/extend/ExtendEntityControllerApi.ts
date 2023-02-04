// import { UseAPI } from '@typexs/base/decorators/UseAPI';
// import { EntityControllerApi, IEntityControllerApi, Inject, Injector, Invoker, Log } from '@typexs/base';
// import { ISaveOp } from '@typexs/base/libs/storage/framework/ISaveOp';
// import { IDeleteOp } from '@typexs/base/libs/storage/framework/IDeleteOp';
// import { EventBus } from '@allgemein/eventbus';
// import { ClassRef, ClassType } from '@allgemein/schema-api';
// import { assign, cloneDeep, isArray, isFunction } from 'lodash';
// import { StorageLoader } from '../lib/StorageLoader';
//
// @UseAPI(EntityControllerApi)
// export class ExtendEntityControllerApi implements IEntityControllerApi {
//   // check if worker is online, pass objects
//
//   @Inject(StorageLoader.NAME)
//   loader: StorageLoader;
//
//   isActive() {
//     if (this.loader && this.loader.isActive()) {
//       return true;
//     }
//     return false;
//   }
//
//   doAfterSave<T>(object: T[] | T, error: Error, op: ISaveOp<T>) {
//     if (!(this.isActive())) {
//       return;
//     }
//
//   }
//
//   doBeforeRemove<T>(op: IDeleteOp<T>) {
//     if (!this.isActive()) {
//       return;
//     }
//   }
// }
