import * as _ from 'lodash';
import { CLS_DEF, IAggregateOptions, IDeleteOptions, IEntityController, IUpdateOptions, NotYetImplementedError } from '@typexs/base';
import { IClassRef, IEntityRef } from '@allgemein/schema-api';
import { LdapStorageRef } from './LdapStorageRef';
import { LdapConnection } from './LdapConnection';
import { ILdapSaveOptions } from './ops/ILdapSaveOptions';
import { ILdapFindOptions } from './ops/ILdapFindOptions';
import { FindOp } from './ops/FindOp';

export class LdapEntityController implements IEntityController {

  private readonly storageRef: LdapStorageRef;

  connection: LdapConnection;


  constructor(storageRef: LdapStorageRef) {
    this.storageRef = storageRef;
  }

  // getInvoker() {
  //   return this.storageRef.getInvoker();
  // }

  aggregate<T>(baseClass: CLS_DEF<T>, pipeline: any[], options?: IAggregateOptions): Promise<any[]> {
    throw new NotYetImplementedError('aggregate for elastic controller is currently not implemented');
  }

  find<T>(fn: CLS_DEF<T> | CLS_DEF<T>[], conditions?: any, options?: ILdapFindOptions): Promise<T[]> {
    return new FindOp<T>(this).run(fn as any, conditions, options);
  }

  findOne<T>(fn: CLS_DEF<T>, conditions?: any, options?: ILdapFindOptions): Promise<T> {
    return this.find<T>(fn, conditions, options).then(r => r.length > 0 ? r.shift() : null);
  }

  // forClass(cls: CLS_DEF<any> | IClassRef): IndexEntityRef | IndexEntityRef[] {
  forClass(cls: CLS_DEF<any>): any {
    if (_.isString(cls) && cls === '*') {
      return this.storageRef.getEntityRefs();
    }
    if (this.storageRef.hasEntityClass(cls)) {
      return this.storageRef.getEntityRef(cls as any);
    }
    return null;
  }


  name(): string {
    return this.storageRef.name;
  }

  entityIdQuery(entityRef: IEntityRef, value: any): any {
    return {
      _id: value
    };
  }

  /**
   * Returns the reference to handled storage
   */
  getStorageRef() {
    return this.storageRef;
  }

  remove<T>(object: any, condition?: any, options?: IDeleteOptions): Promise<number> {
    throw new NotYetImplementedError('remove for ldap controller is currently not implemented');
  }

  save<T>(object: any, options?: ILdapSaveOptions): Promise<T | T[]> {
    throw new NotYetImplementedError('save for ldap controller is currently not implemented');
  }

  update<T>(cls: CLS_DEF<T>, condition: any, update: any, options?: IUpdateOptions): Promise<number> {
    throw new NotYetImplementedError('update by query for ldap controller is currently not implemented');
  }


  // async connect() {
  //   if (this.connection) {
  //     if (!this.connection.isOpened()) {
  //       await this.connection.close();
  //       this.connection = await this.storageRef.connect();
  //     } else {
  //       this.connection.usageInc();
  //     }
  //   } else {
  //     this.connection = await this.storageRef.connect();
  //   }
  //   return this.connection;
  // }
  //
  // async close() {
  //   if (this.connection) {
  //     this.connection.usageDec();
  //     if (this.connection.getUsage() <= 0) {
  //       await this.connection.close();
  //       this.connection = null;
  //     }
  //   }
  // }

}
